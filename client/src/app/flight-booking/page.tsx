"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import {
  AmadeusFlightOffer,
  mapAmadeusOfferToFlight,
  MappedAmadeusFlight,
  convertDuration
} from "@/services/flightService";
import {
  amadeusBookingService,
  AmadeusPassenger,
  SeatSelection,
  AddOns,
  SeatmapData,
  parseSeatmapToRows,
  getSeatInfo,
  getSeatType,
  createZaloPayPayment,
  createMoMoPayment
} from "@/services/amadeusBookingService";
import { discountService } from "@/services/discountService";
import { Discount } from "@/types/discount";
import { validateAmadeusPassengers } from "@/components/Booking/Common/validation";
import {
  Plane,
  Users,
  CreditCard,
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Armchair,
  Luggage,
  Shield,
  Star,
  Info,
  AlertCircle,
  Loader2
} from "lucide-react";

// Steps for booking process
const BOOKING_STEPS = [
  { id: 1, name: "Hành khách", icon: Users },
  { id: 2, name: "Chọn ghế", icon: Armchair },
  { id: 3, name: "Dịch vụ", icon: Luggage },
  { id: 4, name: "Thanh toán", icon: CreditCard },
  { id: 5, name: "Xác nhận", icon: Check }
];

// Price constants
const EXTRA_BAGGAGE_PRICE = 200000;
const INSURANCE_PRICE = 150000;
const PRIORITY_BOARDING_PRICE = 100000;

export default function AmadeusBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, isAuthLoading } = useAuth();

  // Current step
  const [currentStep, setCurrentStep] = useState(1);

  // Flight data from URL
  const [flightOffer, setFlightOffer] = useState<AmadeusFlightOffer | null>(
    null
  );
  const [mappedFlight, setMappedFlight] = useState<MappedAmadeusFlight | null>(
    null
  );
  const [returnFlightOffer, setReturnFlightOffer] =
    useState<AmadeusFlightOffer | null>(null);
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  // Passenger counts
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Form state
  const [passengers, setPassengers] = useState<AmadeusPassenger[]>([]);
  const [seatmap, setSeatmap] = useState<SeatmapData[]>([]);
  const [seatSelections, setSeatSelections] = useState<SeatSelection[]>([]);
  const [addOns, setAddOns] = useState<AddOns>({
    extraBaggage: 0,
    insurance: false,
    priorityBoarding: false
  });
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    fullName: ""
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingSeatmap, setLoadingSeatmap] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auth check
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt vé!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Load flight from URL params
  useEffect(() => {
    const flightData = searchParams.get("flightOffer");
    const returnData = searchParams.get("returnFlightOffer");
    const adultsParam = searchParams.get("adults");
    const childrenParam = searchParams.get("children");
    const infantsParam = searchParams.get("infants");

    if (adultsParam) setAdults(parseInt(adultsParam));
    if (childrenParam) setChildren(parseInt(childrenParam));
    if (infantsParam) setInfants(parseInt(infantsParam));

    if (flightData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(flightData));
        setFlightOffer(parsed);
        const mapped = mapAmadeusOfferToFlight(parsed, {}, 0);
        setMappedFlight(mapped);
      } catch {
        toast.error("Không thể đọc thông tin chuyến bay");
        router.push("/flights");
      }
    } else {
      toast.error("Không có thông tin chuyến bay");
      router.push("/flights");
    }

    if (returnData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(returnData));
        setReturnFlightOffer(parsed);
        setIsRoundTrip(true);
      } catch {
        console.warn("Cannot parse return flight");
      }
    }

    setLoading(false);
  }, [searchParams, router]);

  // Initialize passengers
  useEffect(() => {
    const passengerList: AmadeusPassenger[] = [];

    // Adults
    for (let i = 0; i < adults; i++) {
      passengerList.push({
        type: "ADULT",
        firstName:
          i === 0 && user?.fullName
            ? user.fullName.split(" ").slice(-1)[0]
            : "",
        lastName:
          i === 0 && user?.fullName
            ? user.fullName.split(" ").slice(0, -1).join(" ")
            : "",
        gender: "MALE",
        dateOfBirth: "",
        nationality: "VN",
        identityNumber: "",
        email: i === 0 && user?.email ? user.email : "",
        phone: i === 0 && user?.phone ? user.phone : ""
      });
    }

    // Children
    for (let i = 0; i < children; i++) {
      passengerList.push({
        type: "CHILD",
        firstName: "",
        lastName: "",
        gender: "MALE",
        dateOfBirth: "",
        nationality: "VN"
      });
    }

    // Infants
    for (let i = 0; i < infants; i++) {
      passengerList.push({
        type: "INFANT",
        firstName: "",
        lastName: "",
        gender: "MALE",
        dateOfBirth: "",
        nationality: "VN"
      });
    }

    setPassengers(passengerList);

    // Set contact info from first passenger
    if (user) {
      setContactInfo({
        email: user.email || "",
        phone: user.phone || "",
        fullName: user.fullName || ""
      });
    }
  }, [adults, children, infants, user]);

  // Load seatmap when entering step 2
  const loadSeatmap = useCallback(async () => {
    if (!flightOffer) return;

    setLoadingSeatmap(true);
    try {
      const response = await amadeusBookingService.getAmadeusSeatmap(
        flightOffer
      );
      if (response.success && response.data) {
        setSeatmap(response.data);
      } else {
        toast.info(
          "Không có sơ đồ ghế cho chuyến bay này. Ghế sẽ được chọn tự động."
        );
      }
    } catch {
      toast.info("Không thể tải sơ đồ ghế");
    } finally {
      setLoadingSeatmap(false);
    }
  }, [flightOffer]);

  useEffect(() => {
    if (currentStep === 2 && seatmap.length === 0) {
      loadSeatmap();
    }
  }, [currentStep, seatmap.length, loadSeatmap]);

  // Update passenger
  const updatePassenger = (
    index: number,
    field: keyof AmadeusPassenger,
    value: string
  ) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // Toggle seat selection
  const toggleSeatSelection = (
    passengerIndex: number,
    seatNumber: string,
    seatPrice: number,
    segmentId: string,
    flightNumber: string
  ) => {
    setSeatSelections((prev) => {
      const existing = prev.find(
        (s) => s.seatNumber === seatNumber && s.segmentId === segmentId
      );
      if (existing) {
        return prev.filter(
          (s) => !(s.seatNumber === seatNumber && s.segmentId === segmentId)
        );
      }

      // Remove previous seat for this passenger on this segment
      const filtered = prev.filter(
        (s) =>
          !(
            s.passengerName ===
              `${passengers[passengerIndex].firstName} ${passengers[passengerIndex].lastName}` &&
            s.segmentId === segmentId
          )
      );

      return [
        ...filtered,
        {
          passengerName: `${passengers[passengerIndex].firstName} ${passengers[passengerIndex].lastName}`,
          segmentId,
          flightNumber,
          seatNumber,
          seatPrice,
          seatCurrency: "VND"
        }
      ];
    });
  };

  // Validate discount code
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }

    setValidatingDiscount(true);
    try {
      const response = await discountService.validateDiscount(discountCode);

      if (response.success && response.data) {
        const discount = response.data;

        // Check if discount applies to flight
        const applicableType = discount.applicableType || "all";
        if (applicableType !== "all" && applicableType !== "flight") {
          toast.error("Mã giảm giá này không áp dụng cho vé máy bay");
          return;
        }

        setAppliedDiscount(discount);

        // Calculate discount amount
        const pricing = calculatePricing();
        let calculatedDiscount = 0;

        if (discount.discountType === "percentage") {
          calculatedDiscount = Math.round(
            (pricing.subtotal * discount.value) / 100
          );
          if (discount.maxDiscount) {
            calculatedDiscount = Math.min(
              calculatedDiscount,
              discount.maxDiscount
            );
          }
        } else {
          calculatedDiscount = Math.min(discount.value, pricing.subtotal);
        }

        setDiscountAmount(calculatedDiscount);
        toast.success(
          `Áp dụng mã giảm giá thành công! Giảm ${calculatedDiscount.toLocaleString(
            "vi-VN"
          )} VND`
        );
      } else {
        toast.error(response.message || "Mã giảm giá không hợp lệ");
        setAppliedDiscount(null);
        setDiscountAmount(0);
      }
    } catch (error) {
      console.error("Error validating discount:", error);
      toast.error("Lỗi khi kiểm tra mã giảm giá");
      setAppliedDiscount(null);
      setDiscountAmount(0);
    } finally {
      setValidatingDiscount(false);
    }
  };

  // Remove applied discount
  const handleRemoveDiscount = () => {
    setDiscountCode("");
    setAppliedDiscount(null);
    setDiscountAmount(0);
    toast.info("Đã hủy mã giảm giá");
  };

  // Calculate totals
  const calculatePricing = () => {
    const flightPrice = parseFloat(
      flightOffer?.price?.grandTotal || flightOffer?.price?.total || "0"
    );
    const returnPrice = parseFloat(
      returnFlightOffer?.price?.grandTotal ||
        returnFlightOffer?.price?.total ||
        "0"
    );
    const seatTotal = seatSelections.reduce((sum, s) => sum + s.seatPrice, 0);
    const baggageTotal = (addOns.extraBaggage || 0) * EXTRA_BAGGAGE_PRICE;
    const insuranceTotal = addOns.insurance
      ? INSURANCE_PRICE * passengers.length
      : 0;
    const priorityTotal = addOns.priorityBoarding
      ? PRIORITY_BOARDING_PRICE * passengers.length
      : 0;

    const subtotal =
      flightPrice +
      returnPrice +
      seatTotal +
      baggageTotal +
      insuranceTotal +
      priorityTotal;

    return {
      flightPrice,
      returnPrice,
      seatTotal,
      baggageTotal,
      insuranceTotal,
      priorityTotal,
      subtotal,
      discount: discountAmount,
      total: subtotal - discountAmount
    };
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Passengers
        return validateAmadeusPassengers(passengers, contactInfo);

      case 2: // Seats (optional)
        return true;

      case 3: // Add-ons (optional)
        return true;

      case 4: // Payment
        if (!paymentMethod) {
          toast.error("Vui lòng chọn phương thức thanh toán");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // Navigate steps
  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit booking
  const handleSubmit = async () => {
    if (!flightOffer) {
      toast.error("Không có thông tin chuyến bay");
      return;
    }

    if (!validateStep(4)) return;

    setSubmitting(true);
    try {
      // Step 1: Create booking
      const response = await amadeusBookingService.createAmadeusBooking({
        outboundFlightOffer: flightOffer,
        returnFlightOffer: returnFlightOffer || undefined,
        passengers,
        seatSelections,
        addOns,
        discountCode: discountCode || undefined,
        paymentMethod: paymentMethod as
          | "momo"
          | "zalopay"
          | "bank_transfer"
          | "cash",
        contactInfo,
        specialRequests: specialRequests || undefined
      });

      if (response.success && response.data) {
        const bookingId = response.data._id;

        // Step 2: Process payment based on method
        if (paymentMethod === "zalopay") {
          toast.loading("Đang tạo đơn thanh toán ZaloPay...", {
            id: "payment"
          });

          try {
            const paymentResponse = await createZaloPayPayment(bookingId);

            if (paymentResponse.success && paymentResponse.data?.order_url) {
              // Save booking ID to localStorage for payment success page
              localStorage.setItem("pendingAmadeusBookingId", bookingId);

              toast.success("Đang chuyển đến trang thanh toán ZaloPay...", {
                id: "payment"
              });
              // Redirect to ZaloPay payment page
              window.location.href = paymentResponse.data.order_url;
              return;
            } else {
              toast.error(
                paymentResponse.message || "Lỗi tạo thanh toán ZaloPay",
                { id: "payment" }
              );
              // Still show confirmation but with pending payment
              setCurrentStep(5);
            }
          } catch (paymentError) {
            console.error("Payment error:", paymentError);
            toast.error("Lỗi tạo thanh toán. Vui lòng thanh toán sau.", {
              id: "payment"
            });
            setCurrentStep(5);
          }
        } else if (paymentMethod === "momo") {
          // MoMo integration - similar flow
          toast.loading("Đang tạo đơn thanh toán MoMo...", {
            id: "payment"
          });

          try {
            const paymentResponse = await createMoMoPayment(bookingId);

            if (paymentResponse.success && paymentResponse.data?.payUrl) {
              // Save booking ID to localStorage for payment success page
              localStorage.setItem("pendingAmadeusBookingId", bookingId);

              toast.success("Đang chuyển đến trang thanh toán MoMo...", {
                id: "payment"
              });
              // Redirect to MoMo payment page
              window.location.href = paymentResponse.data.payUrl;
              return;
            } else {
              toast.error(
                paymentResponse.message || "Lỗi tạo thanh toán MoMo",
                { id: "payment" }
              );
              // Still show confirmation but with pending payment
              setCurrentStep(5);
            }
          } catch (paymentError) {
            console.error("Payment error:", paymentError);
            toast.error("Lỗi tạo thanh toán. Vui lòng thanh toán sau.", {
              id: "payment"
            });
            setCurrentStep(5);
          }
        } else {
          // Bank transfer or cash - just show confirmation
          toast.success(
            "Đặt vé thành công! Vui lòng thanh toán theo hướng dẫn."
          );
          setCurrentStep(5);
        }
      } else {
        toast.error(response.message || "Lỗi khi đặt vé");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi đặt vé");
    } finally {
      setSubmitting(false);
    }
  };

  const pricing = calculatePricing();

  // Render loading
  if (loading || isAuthLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Đặt vé máy bay</h1>
            <p className="text-gray-600 mt-1">
              {mappedFlight?.departure.airport} →{" "}
              {mappedFlight?.arrival.airport}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {BOOKING_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isActive
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`mt-2 text-sm font-medium ${
                          isActive ? "text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                    {idx < BOOKING_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 ${
                          currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Passenger Information */}
              {currentStep === 1 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Thông tin hành khách
                  </h2>

                  {passengers.map((passenger, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 mb-4 last:mb-0"
                    >
                      <h3 className="font-medium text-gray-700 mb-3">
                        Hành khách {index + 1} (
                        {passenger.type === "ADULT"
                          ? "Người lớn"
                          : passenger.type === "CHILD"
                          ? "Trẻ em"
                          : "Em bé"}
                        )
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Họ <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={passenger.lastName}
                            onChange={(e) =>
                              updatePassenger(index, "lastName", e.target.value)
                            }
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nguyễn Văn"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={passenger.firstName}
                            onChange={(e) =>
                              updatePassenger(
                                index,
                                "firstName",
                                e.target.value
                              )
                            }
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="A"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Giới tính
                          </label>
                          <select
                            value={passenger.gender}
                            onChange={(e) =>
                              updatePassenger(index, "gender", e.target.value)
                            }
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày sinh <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={passenger.dateOfBirth}
                            onChange={(e) =>
                              updatePassenger(
                                index,
                                "dateOfBirth",
                                e.target.value
                              )
                            }
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {passenger.type === "ADULT" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CCCD/Hộ chiếu{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={passenger.identityNumber || ""}
                              onChange={(e) =>
                                updatePassenger(
                                  index,
                                  "identityNumber",
                                  e.target.value
                                )
                              }
                              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0123456789"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quốc tịch
                          </label>
                          <select
                            value={passenger.nationality || "VN"}
                            onChange={(e) =>
                              updatePassenger(
                                index,
                                "nationality",
                                e.target.value
                              )
                            }
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="VN">Việt Nam</option>
                            <option value="US">United States</option>
                            <option value="GB">United Kingdom</option>
                            <option value="JP">Japan</option>
                            <option value="KR">Korea</option>
                            <option value="TH">Thailand</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Contact Information */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="font-medium text-gray-700 mb-4">
                      Thông tin liên hệ
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={contactInfo.email}
                          onChange={(e) =>
                            setContactInfo((prev) => ({
                              ...prev,
                              email: e.target.value
                            }))
                          }
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={contactInfo.phone}
                          onChange={(e) =>
                            setContactInfo((prev) => ({
                              ...prev,
                              phone: e.target.value
                            }))
                          }
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0901234567"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Seat Selection */}
              {currentStep === 2 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <Armchair className="w-5 h-5 mr-2 text-blue-600" />
                    Chọn ghế ngồi
                  </h2>

                  {loadingSeatmap ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">
                        Đang tải sơ đồ ghế...
                      </span>
                    </div>
                  ) : seatmap.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Armchair className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">
                        Sơ đồ ghế không khả dụng cho chuyến bay này.
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Ghế sẽ được chọn tự động khi hoàn tất đặt vé.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Seat Legend */}
                      <div className="flex flex-wrap gap-4 mb-6 text-sm">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-blue-100 border border-blue-300 rounded mr-2" />
                          <span>Còn trống</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-300 rounded mr-2" />
                          <span>Đã đặt</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-green-500 rounded mr-2" />
                          <span>Đã chọn</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-yellow-100 border border-yellow-400 rounded mr-2" />
                          <span>Lối thoát</span>
                        </div>
                      </div>

                      {/* Passenger seat assignment */}
                      <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">
                          Chọn ghế cho từng hành khách:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {passengers.map((p, idx) => {
                            const selectedSeat = seatSelections.find(
                              (s) =>
                                s.passengerName ===
                                `${p.firstName} ${p.lastName}`
                            );
                            return (
                              <span
                                key={idx}
                                className={`px-3 py-1 rounded-full text-sm ${
                                  selectedSeat
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {p.firstName || `HK ${idx + 1}`}:{" "}
                                {selectedSeat?.seatNumber || "Chưa chọn"}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Seatmap Display */}
                      {seatmap.map((sm, smIdx) => {
                        const rows = parseSeatmapToRows(sm);
                        const segment =
                          flightOffer?.itineraries?.[0]?.segments?.[smIdx];

                        return (
                          <div key={smIdx} className="mb-8">
                            {segment && (
                              <h3 className="font-medium text-gray-700 mb-4">
                                {segment.carrierCode}
                                {segment.number}: {segment.departure?.iataCode}{" "}
                                → {segment.arrival?.iataCode}
                              </h3>
                            )}

                            <div className="overflow-x-auto">
                              <div className="inline-flex flex-col items-center min-w-[300px]">
                                {/* Cockpit */}
                                <div className="w-24 h-12 bg-gray-200 rounded-t-full mb-4" />

                                {rows.map((row) => (
                                  <div
                                    key={row.number}
                                    className="flex items-center gap-2 mb-1"
                                  >
                                    <span className="w-6 text-sm text-gray-500 text-right">
                                      {row.number}
                                    </span>
                                    <div className="flex gap-1">
                                      {row.seats.map((seat, seatIdx) => {
                                        const seatInfo = getSeatInfo(seat);
                                        const seatType = getSeatType(
                                          seatInfo.characteristics
                                        );
                                        const isSelected = seatSelections.some(
                                          (s) =>
                                            s.seatNumber === seat.number &&
                                            s.segmentId ===
                                              (sm.segmentId || String(smIdx))
                                        );

                                        // Add aisle gap
                                        const addGap =
                                          seatIdx === 2 || seatIdx === 5;

                                        return (
                                          <div
                                            key={seat.number}
                                            className={`flex ${
                                              addGap ? "ml-4" : ""
                                            }`}
                                          >
                                            <button
                                              type="button"
                                              disabled={!seatInfo.isAvailable}
                                              onClick={() => {
                                                if (seatInfo.isAvailable) {
                                                  // For simplicity, assign to first passenger without seat
                                                  const unassignedIdx =
                                                    passengers.findIndex(
                                                      (p) =>
                                                        !seatSelections.find(
                                                          (s) =>
                                                            s.passengerName ===
                                                              `${p.firstName} ${p.lastName}` &&
                                                            s.segmentId ===
                                                              (sm.segmentId ||
                                                                String(smIdx))
                                                        )
                                                    );
                                                  const targetIdx =
                                                    unassignedIdx >= 0
                                                      ? unassignedIdx
                                                      : 0;
                                                  toggleSeatSelection(
                                                    targetIdx,
                                                    seat.number,
                                                    seatInfo.price,
                                                    sm.segmentId ||
                                                      String(smIdx),
                                                    segment
                                                      ? `${segment.carrierCode}${segment.number}`
                                                      : ""
                                                  );
                                                }
                                              }}
                                              className={`w-8 h-8 rounded text-xs font-medium transition-colors
                                                ${
                                                  !seatInfo.isAvailable
                                                    ? "bg-gray-300 cursor-not-allowed"
                                                    : isSelected
                                                    ? "bg-green-500 text-white"
                                                    : seatType === "exit"
                                                    ? "bg-yellow-100 border border-yellow-400 hover:bg-yellow-200"
                                                    : seatType === "premium"
                                                    ? "bg-purple-100 border border-purple-300 hover:bg-purple-200"
                                                    : "bg-blue-100 border border-blue-300 hover:bg-blue-200"
                                                }
                                              `}
                                              title={
                                                seatInfo.isAvailable
                                                  ? `${
                                                      seat.number
                                                    } - ${formatPrice(
                                                      seatInfo.price
                                                    )}`
                                                  : "Đã đặt"
                                              }
                                            >
                                              {seat.number.replace(/\d+/g, "")}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}

                                {/* Tail */}
                                <div className="w-24 h-8 bg-gray-200 rounded-b-lg mt-4" />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Selected seats summary */}
                      {seatSelections.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">
                            Ghế đã chọn
                          </h4>
                          <div className="space-y-1">
                            {seatSelections.map((s, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-sm"
                              >
                                <span>
                                  {s.passengerName} - Ghế {s.seatNumber} (
                                  {s.flightNumber})
                                </span>
                                <span className="font-medium">
                                  {formatPrice(s.seatPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Add-ons */}
              {currentStep === 3 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <Luggage className="w-5 h-5 mr-2 text-blue-600" />
                    Dịch vụ bổ sung
                  </h2>

                  <div className="space-y-4">
                    {/* Extra Baggage */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <Luggage className="w-6 h-6 text-orange-500 mt-1 mr-3" />
                          <div>
                            <h3 className="font-medium">Hành lý ký gửi thêm</h3>
                            <p className="text-sm text-gray-600">
                              Thêm 20kg hành lý ký gửi
                            </p>
                            <p className="text-sm font-medium text-blue-600 mt-1">
                              {formatPrice(EXTRA_BAGGAGE_PRICE)} / kiện
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() =>
                              setAddOns((prev) => ({
                                ...prev,
                                extraBaggage: Math.max(
                                  0,
                                  (prev.extraBaggage || 0) - 1
                                )
                              }))
                            }
                            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">
                            {addOns.extraBaggage || 0}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setAddOns((prev) => ({
                                ...prev,
                                extraBaggage: (prev.extraBaggage || 0) + 1
                              }))
                            }
                            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Insurance */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <Shield className="w-6 h-6 text-green-500 mt-1 mr-3" />
                          <div>
                            <h3 className="font-medium">Bảo hiểm du lịch</h3>
                            <p className="text-sm text-gray-600">
                              Bảo hiểm tai nạn và hành lý
                            </p>
                            <p className="text-sm font-medium text-blue-600 mt-1">
                              {formatPrice(INSURANCE_PRICE)} / người
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addOns.insurance || false}
                            onChange={(e) =>
                              setAddOns((prev) => ({
                                ...prev,
                                insurance: e.target.checked
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>
                    </div>

                    {/* Priority Boarding */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <Star className="w-6 h-6 text-yellow-500 mt-1 mr-3" />
                          <div>
                            <h3 className="font-medium">Ưu tiên lên máy bay</h3>
                            <p className="text-sm text-gray-600">
                              Lên máy bay trước, hành lý được ưu tiên
                            </p>
                            <p className="text-sm font-medium text-blue-600 mt-1">
                              {formatPrice(PRIORITY_BOARDING_PRICE)} / người
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addOns.priorityBoarding || false}
                            onChange={(e) =>
                              setAddOns((prev) => ({
                                ...prev,
                                priorityBoarding: e.target.checked
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Special requests */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yêu cầu đặc biệt (tùy chọn)
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ví dụ: Suất ăn chay, xe lăn, v.v."
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Payment */}
              {currentStep === 4 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                    Thanh toán
                  </h2>

                  {/* Discount code */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã giảm giá
                    </label>
                    {appliedDiscount ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <Check className="w-5 h-5 text-green-600 mr-2" />
                          <div>
                            <span className="font-medium text-green-700">
                              {appliedDiscount.code}
                            </span>
                            <p className="text-sm text-green-600">
                              Giảm {discountAmount.toLocaleString("vi-VN")} VND
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDiscount}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) =>
                            setDiscountCode(e.target.value.toUpperCase())
                          }
                          disabled={validatingDiscount}
                          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          placeholder="Nhập mã giảm giá"
                        />
                        <button
                          type="button"
                          onClick={handleApplyDiscount}
                          disabled={validatingDiscount || !discountCode.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                        >
                          {validatingDiscount ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Áp dụng"
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payment methods */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-700">
                      Phương thức thanh toán
                    </h3>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="zalopay"
                        checked={paymentMethod === "zalopay"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="ml-3 flex items-center">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/vi/7/77/ZaloPay_Logo.png"
                          alt="ZaloPay"
                          className="h-6 mr-2"
                        />
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="momo"
                        checked={paymentMethod === "momo"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="ml-3 flex items-center">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                          alt="MoMo"
                          className="h-6 mr-2"
                        />
                        <span className="font-medium">MoMo</span>
                      </div>
                    </label>
                  </div>

                  {/* Terms */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <Info className="w-4 h-4 inline mr-1" />
                      Bằng việc nhấn Xác nhận đặt vé, bạn đồng ý với{" "}
                      <a
                        href="/terms"
                        className="text-blue-600 hover:underline"
                      >
                        Điều khoản sử dụng
                      </a>{" "}
                      và{" "}
                      <a
                        href="/privacy"
                        className="text-blue-600 hover:underline"
                      >
                        Chính sách bảo mật
                      </a>{" "}
                      của chúng tôi.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {currentStep === 5 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Đặt vé thành công!
                    </h2>
                    <p className="text-gray-600">
                      Cảm ơn bạn đã đặt vé. Thông tin chi tiết đã được gửi qua
                      email.
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-4">Thông tin chuyến bay</h3>
                    {mappedFlight && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold">
                              {mappedFlight.flightNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              {mappedFlight.airline}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">
                              {mappedFlight.departure.time} →{" "}
                              {mappedFlight.arrival.time}
                            </p>
                            <p className="text-sm text-gray-600">
                              {mappedFlight.departure.airport} →{" "}
                              {mappedFlight.arrival.airport}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => router.push("/flights")}
                      className="flex-1 py-3 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50"
                    >
                      Tìm chuyến bay khác
                    </button>
                    <button
                      onClick={() => router.push("/profile/booking")}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      Xem đơn đặt vé
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep < 5 && (
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    disabled={currentStep === 1}
                    className={`px-6 py-3 rounded-lg font-medium flex items-center
                      ${
                        currentStep === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Quay lại
                  </button>

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
                    >
                      Tiếp tục
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-1" />
                          Xác nhận đặt vé
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar - Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
                <h3 className="font-semibold text-lg mb-4">Chi tiết đặt vé</h3>

                {/* Flight Info */}
                {mappedFlight && (
                  <div className="border-b pb-4 mb-4">
                    <div className="flex items-center mb-2">
                      <Plane className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="font-medium">
                        {mappedFlight.airline}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {mappedFlight.flightNumber}
                    </p>
                    <div className="mt-2 flex items-center text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                      <span>
                        {mappedFlight.departure.airport} →{" "}
                        {mappedFlight.arrival.airport}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                      <span>{mappedFlight.departure.date}</span>
                      <Clock className="w-4 h-4 text-gray-400 ml-3 mr-1" />
                      <span>
                        {mappedFlight.departure.time} -{" "}
                        {mappedFlight.arrival.time}
                      </span>
                    </div>
                  </div>
                )}

                {/* Passengers */}
                <div className="border-b pb-4 mb-4">
                  <div className="flex items-center mb-2">
                    <Users className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="font-medium">Hành khách</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {adults > 0 && <p>Người lớn: {adults}</p>}
                    {children > 0 && <p>Trẻ em: {children}</p>}
                    {infants > 0 && <p>Em bé: {infants}</p>}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giá vé</span>
                    <span>{formatPrice(pricing.flightPrice)}</span>
                  </div>

                  {pricing.returnPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vé về</span>
                      <span>{formatPrice(pricing.returnPrice)}</span>
                    </div>
                  )}

                  {pricing.seatTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chọn ghế</span>
                      <span>{formatPrice(pricing.seatTotal)}</span>
                    </div>
                  )}

                  {pricing.baggageTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hành lý thêm</span>
                      <span>{formatPrice(pricing.baggageTotal)}</span>
                    </div>
                  )}

                  {pricing.insuranceTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bảo hiểm</span>
                      <span>{formatPrice(pricing.insuranceTotal)}</span>
                    </div>
                  )}

                  {pricing.priorityTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ưu tiên lên máy bay</span>
                      <span>{formatPrice(pricing.priorityTotal)}</span>
                    </div>
                  )}

                  {pricing.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giảm giá</span>
                      <span className="text-green-600">
                        -{formatPrice(pricing.discount)}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Tổng cộng</span>
                      <span className="text-blue-600">
                        {formatPrice(pricing.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Test Environment Notice */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 shrink-0" />
                    <p className="text-xs text-amber-700">
                      Quý khách vui lòng điền đúng thông tin. Chúng tôi không
                      chịu trách nhiệm nếu quý khách đều thông tin sai !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
