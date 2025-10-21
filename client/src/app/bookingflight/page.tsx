"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Flight, flightService } from "@/services/flightService";
import {
  bookingFlightService,
  PassengerInfo
} from "@/services/bookingFlightService";
import { paymentService } from "@/services/paymentService";
import { discountService } from "@/services/discountService";
import { Discount } from "@/types/discount";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function BookingFlightPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user, isAuthLoading } = useAuth();

  const flightId = searchParams.get("flightId");
  const adults = Number(searchParams.get("adults") || 1);
  const children = Number(searchParams.get("children") || 0);
  const infants = Number(searchParams.get("infants") || 0);
  const seatClass = searchParams.get("seatClass") || "economy";

  // Add-ons from URL
  const extraBaggage = Number(searchParams.get("extraBaggage") || 0);
  const insurance = searchParams.get("insurance") === "true";
  const prioritySeat = searchParams.get("prioritySeat") === "true";

  // Pricing constants for add-ons
  const EXTRA_BAGGAGE_PRICE = 200000;
  const INSURANCE_PRICE = 150000;
  const PRIORITY_SEAT_PRICE = 100000;

  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Passenger information
  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Discount information
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt vé!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Initialize passenger info
  useEffect(() => {
    const passengerList: PassengerInfo[] = [];

    // Add adults (require CCCD)
    for (let i = 0; i < adults; i++) {
      passengerList.push({
        fullName: i === 0 && user?.fullName ? user.fullName : "",
        phoneNumber: i === 0 && user?.phone ? user.phone : undefined,
        email: i === 0 && user?.email ? user.email : undefined,
        gender: "Nam",
        dateOfBirth: "",
        identityNumber: "", // Required for adults
        nationality: "Vietnam"
      });
    }

    // Add children (no CCCD needed)
    for (let i = 0; i < children; i++) {
      passengerList.push({
        fullName: "",
        gender: "Nam",
        dateOfBirth: "",
        identityNumber: undefined, // Not required for children
        nationality: "Vietnam"
      });
    }

    // Add infants (no CCCD needed)
    for (let i = 0; i < infants; i++) {
      passengerList.push({
        fullName: "",
        gender: "Nam",
        dateOfBirth: "",
        identityNumber: undefined, // Not required for infants
        nationality: "Vietnam"
      });
    }

    setPassengers(passengerList);
  }, [adults, children, infants, user]);

  useEffect(() => {
    if (flightId) {
      flightService
        .getFlightById(flightId)
        .then((data) => {
          setFlight(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading flight:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [flightId]);

  const updatePassenger = (
    index: number,
    field: keyof PassengerInfo,
    value: string
  ) => {
    setPassengers((prev) =>
      prev.map((passenger, i) =>
        i === index ? { ...passenger, [field]: value } : passenger
      )
    );
  };

  const getPassengerTypeLabel = (type: "adult" | "child" | "infant") => {
    switch (type) {
      case "adult":
        return "Người lớn";
      case "child":
        return "Trẻ em";
      case "infant":
        return "Em bé";
      default:
        return "";
    }
  };

  // Apply discount code
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá!");
      return;
    }

    setApplyingDiscount(true);
    try {
      const response = await discountService.validateDiscount(
        discountCode.trim().toUpperCase()
      );

      if (response.success && response.data) {
        setAppliedDiscount(response.data);
        toast.success("Áp dụng mã giảm giá thành công!");
      } else {
        setAppliedDiscount(null);
        toast.error(response.message || "Mã giảm giá không hợp lệ!");
      }
    } catch (error) {
      console.error("Validate discount error:", error);
      setAppliedDiscount(null);
      toast.error("Có lỗi xảy ra khi kiểm tra mã giảm giá!");
    } finally {
      setApplyingDiscount(false);
    }
  };

  // Remove applied discount
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    toast.success("Đã xóa mã giảm giá!");
  };

  // Calculate discount amount
  const calculateDiscountAmount = (subtotal: number) => {
    if (!appliedDiscount) return 0;

    if (appliedDiscount.discountType === "percentage") {
      return Math.round((subtotal * appliedDiscount.value) / 100);
    } else {
      return Math.min(appliedDiscount.value, subtotal);
    }
  };

  // Calculate final total after discount
  const calculateFinalTotal = (subtotal: number) => {
    return subtotal - calculateDiscountAmount(subtotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt vé!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }

    // Validate passenger information
    const hasEmptyFields = passengers.some((passenger, index) => {
      // First passenger (contact person - always adult)
      if (index === 0) {
        return (
          !passenger.fullName.trim() ||
          !passenger.phoneNumber?.trim() ||
          !passenger.email?.trim() ||
          !passenger.gender.trim() ||
          !passenger.dateOfBirth.trim() ||
          !passenger.identityNumber?.trim()
        );
      }

      // Other passengers
      // Adults need CCCD, but children and infants don't
      const isAdult = index < adults;
      if (isAdult) {
        return (
          !passenger.fullName.trim() ||
          !passenger.gender.trim() ||
          !passenger.dateOfBirth.trim() ||
          !passenger.identityNumber?.trim()
        );
      } else {
        // Children and infants don't need CCCD
        return (
          !passenger.fullName.trim() ||
          !passenger.gender.trim() ||
          !passenger.dateOfBirth.trim()
        );
      }
    });

    if (hasEmptyFields) {
      toast.error("Vui lòng nhập đầy đủ thông tin tất cả hành khách!");
      return;
    }

    if (!paymentMethod) {
      toast.error("Vui lòng chọn hình thức thanh toán!");
      return;
    }

    if (!flight) {
      toast.error("Không tìm thấy thông tin chuyến bay.");
      return;
    }

    if (!flight.classes || flight.classes.length === 0) {
      toast.error("Thiếu thông tin giá vé.");
      return;
    }

    setSubmitting(true);

    try {
      // Get selected flight class
      const selectedClass = flight.classes.find(
        (c) => c.className.toLowerCase() === seatClass.toLowerCase()
      );

      if (!selectedClass) {
        toast.error("Thiếu thông tin giá vé cho hạng ghế.");
        return;
      }

      // Calculate total amount with age-based pricing
      const numTickets = adults + children + infants;
      const baseTicketPrice = selectedClass.price;
      const pricePerTicket = baseTicketPrice; // Keep for backend compatibility

      // Age-based pricing:
      // Adults (12+ years): 100% of ticket price
      // Children (2-11 years): 90% of ticket price
      // Infants (under 2 years): 10% of ticket price
      const adultsTotal = adults * baseTicketPrice;
      const childrenTotal = children * (baseTicketPrice * 0.9);
      const infantsTotal = infants * (baseTicketPrice * 0.1);
      const totalFlightPrice = adultsTotal + childrenTotal + infantsTotal;

      // Calculate add-ons
      const baggageTotal = extraBaggage * EXTRA_BAGGAGE_PRICE;
      const insuranceTotal = insurance ? numTickets * INSURANCE_PRICE : 0;
      const prioritySeatTotal = prioritySeat
        ? numTickets * PRIORITY_SEAT_PRICE
        : 0;
      const addOnsTotal = baggageTotal + insuranceTotal + prioritySeatTotal;

      const subtotalWithAddons = totalFlightPrice + addOnsTotal;

      const discountAmount = calculateDiscountAmount(subtotalWithAddons);
      const finalTotal = calculateFinalTotal(subtotalWithAddons);

      // Prepare note with add-ons information
      let bookingNote = note;
      const addOnsInfo = [];
      if (extraBaggage > 0) {
        addOnsInfo.push(
          `Hành lý thêm: ${extraBaggage} kiện (${baggageTotal.toLocaleString(
            "vi-VN"
          )} đ)`
        );
      }
      if (insurance) {
        addOnsInfo.push(
          `Bảo hiểm du lịch: ${numTickets} người (${insuranceTotal.toLocaleString(
            "vi-VN"
          )} đ)`
        );
      }
      if (prioritySeat) {
        addOnsInfo.push(
          `Chỗ ngồi ưu tiên: ${numTickets} người (${prioritySeatTotal.toLocaleString(
            "vi-VN"
          )} đ)`
        );
      }
      if (addOnsInfo.length > 0) {
        bookingNote = `${
          bookingNote ? bookingNote + "\n\n" : ""
        }Dịch vụ bổ sung:\n${addOnsInfo.join("\n")}`;
      }

      // If payment method is MoMo, handle MoMo payment flow
      if (paymentMethod === "momo") {
        try {
          const momoResponse = await paymentService.createMoMoPayment({
            amount: finalTotal,
            orderInfo: `Thanh toán vé máy bay: ${flight.flightCode}`,
            extraData: JSON.stringify({
              flightId: flight._id,
              flightCode: flight.flightCode,
              flightClassId: selectedClass._id,
              numTickets,
              pricePerTicket,
              totalFlightPrice,
              passengers,
              note: bookingNote,
              discountCode: appliedDiscount?.code,
              discountAmount
            })
          });

          if (momoResponse.success && momoResponse.data?.payUrl) {
            const bookingData = {
              flightId: flight._id,
              flightCode: flight.flightCode,
              flightClassId: selectedClass._id,
              numTickets,
              pricePerTicket,
              totalFlightPrice,
              discountAmount,
              finalTotal,
              discountCode: appliedDiscount?.code,
              status: "pending",
              passengers,
              note: bookingNote,
              paymentMethod,
              momoOrderId: momoResponse.data.orderId
            };

            localStorage.setItem(
              "pendingFlightBooking",
              JSON.stringify(bookingData)
            );
            toast.success("Đang chuyển hướng đến trang thanh toán MoMo...");
            paymentService.redirectToMoMoPayment(momoResponse.data.payUrl);
            return;
          } else {
            throw new Error(
              momoResponse.message || "Không thể tạo thanh toán MoMo"
            );
          }
        } catch (momoError) {
          console.error("MoMo payment error:", momoError);
          toast.error("Lỗi khi tạo thanh toán MoMo. Vui lòng thử lại!");
          setSubmitting(false);
          return;
        }
      }

      // For other payment methods, proceed with normal booking flow
      const res = await bookingFlightService.createBookingFlight({
        flightId: flight._id,
        flightCode: flight.flightCode,
        flightClassId: selectedClass._id,
        numTickets,
        pricePerTicket,
        totalFlightPrice,
        discountAmount,
        finalTotal,
        discountCode: appliedDiscount?.code,
        status: "pending",
        passengers,
        note: bookingNote,
        paymentMethod
      });

      if (res.success) {
        toast.success("Đặt vé thành công!");
        router.push("/profile/booking");
      } else {
        if (res.requireAuth) {
          router.push(
            `/login?redirect=${encodeURIComponent(
              window.location.pathname + window.location.search
            )}`
          );
        } else {
          toast.error(res.message || "Đặt vé thất bại!");
        }
      }
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Lỗi kết nối server!");
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang chuyển hướng đến trang đăng nhập...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang tải thông tin chuyến bay...</div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Không tìm thấy chuyến bay.</div>
      </div>
    );
  }

  const selectedClass = flight.classes?.find(
    (c) => c.className.toLowerCase() === seatClass.toLowerCase()
  );
  const baseTicketPrice = selectedClass?.price || 0;
  const numTickets = adults + children + infants;

  // Age-based pricing calculation for display
  const adultsPrice = baseTicketPrice; // 100%
  const childrenPrice = baseTicketPrice * 0.9; // 90%
  const infantsPrice = baseTicketPrice * 0.1; // 10%

  const adultsTotal = adults * adultsPrice;
  const childrenTotal = children * childrenPrice;
  const infantsTotal = infants * infantsPrice;
  const totalFlightPrice = adultsTotal + childrenTotal + infantsTotal;

  // Calculate add-ons for display
  const baggageTotal = extraBaggage * EXTRA_BAGGAGE_PRICE;
  const insuranceTotal = insurance ? numTickets * INSURANCE_PRICE : 0;
  const prioritySeatTotal = prioritySeat ? numTickets * PRIORITY_SEAT_PRICE : 0;
  const addOnsTotal = baggageTotal + insuranceTotal + prioritySeatTotal;

  const subtotalWithAddons = totalFlightPrice + addOnsTotal;
  const finalTotal = calculateFinalTotal(subtotalWithAddons);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100">
      <Header />

      <div className="py-8 px-4 mt-20">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white p-6">
              <h1 className="text-2xl font-bold mb-2">
                Đặt vé: {flight.departureAirportId.city} →{" "}
                {flight.arrivalAirportId.city}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center text-blue-100 gap-2 text-sm">
                <span className="mr-4">
                  👥 {adults + children + infants} hành khách
                </span>
                <span className="mr-4">✈️ {flight.flightCode}</span>
                <span className="mr-4">
                  🎫 Hạng{" "}
                  {flight.classes?.find(
                    (c) => c.className.toLowerCase() === seatClass.toLowerCase()
                  )?.className ||
                    (seatClass === "economy"
                      ? "Phổ thông"
                      : seatClass === "business"
                      ? "Thương gia"
                      : seatClass)}
                </span>
                {(extraBaggage > 0 || insurance || prioritySeat) && (
                  <span className="mr-4">➕ Có dịch vụ bổ sung</span>
                )}
                <span>
                  💰 Tổng: {finalTotal.toLocaleString("vi-VN")} đ
                  {appliedDiscount && (
                    <span className="ml-2 text-yellow-300 text-xs">
                      (Đã giảm giá)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* User Account Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Thông tin tài khoản đặt vé
                </h3>
                <p className="text-sm text-blue-700">
                  Đăng nhập với: {user?.email}
                </p>
              </div>

              {/* Passenger Information */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Thông tin hành khách
                </h3>

                <div className="space-y-6">
                  {passengers.map((passenger, index) => {
                    // Determine passenger type based on index
                    let passengerType: "adult" | "child" | "infant" = "adult";
                    let passengerNumber = index + 1;

                    if (index < adults) {
                      passengerType = "adult";
                      passengerNumber = index + 1;
                    } else if (index < adults + children) {
                      passengerType = "child";
                      passengerNumber = index - adults + 1;
                    } else {
                      passengerType = "infant";
                      passengerNumber = index - adults - children + 1;
                    }

                    const isContactPerson = index === 0;

                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center mb-4">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {getPassengerTypeLabel(passengerType)}{" "}
                            {passengerNumber}
                          </span>
                          {isContactPerson && (
                            <span className="ml-2 text-xs text-gray-500">
                              (Người liên hệ)
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Full Name */}
                          <div className="lg:col-span-1">
                            <label className="block font-semibold mb-1 text-gray-700">
                              Họ và tên *
                            </label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                              value={passenger.fullName}
                              onChange={(e) =>
                                updatePassenger(
                                  index,
                                  "fullName",
                                  e.target.value
                                )
                              }
                              placeholder="Nhập họ và tên"
                              required
                            />
                          </div>

                          {/* Gender */}
                          <div className="lg:col-span-1">
                            <label className="block font-semibold mb-1 text-gray-700">
                              Giới tính *
                            </label>
                            <select
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                              value={passenger.gender}
                              onChange={(e) =>
                                updatePassenger(index, "gender", e.target.value)
                              }
                              required
                            >
                              <option value="" className="text-gray-400">
                                Chọn giới tính
                              </option>
                              <option value="Nam" className="text-gray-900">
                                Nam
                              </option>
                              <option value="Nữ" className="text-gray-900">
                                Nữ
                              </option>
                            </select>
                          </div>

                          {/* Date of Birth */}
                          <div className="lg:col-span-1">
                            <label className="block font-semibold mb-1 text-gray-700">
                              Ngày sinh *
                            </label>
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                              value={passenger.dateOfBirth}
                              onChange={(e) =>
                                updatePassenger(
                                  index,
                                  "dateOfBirth",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>

                          {/* CCCD - Only for adults */}
                          {passengerType === "adult" && (
                            <div className="lg:col-span-1">
                              <label className="block font-semibold mb-1 text-gray-700">
                                CCCD/CMND *
                              </label>
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                                value={passenger.identityNumber || ""}
                                onChange={(e) =>
                                  updatePassenger(
                                    index,
                                    "identityNumber",
                                    e.target.value
                                  )
                                }
                                placeholder="Nhập số CCCD/CMND (9 hoặc 12 số)"
                                required
                              />
                            </div>
                          )}

                          {/* Phone (only for contact person) */}
                          {isContactPerson && (
                            <div className="lg:col-span-2">
                              <label className="block font-semibold mb-1 text-gray-700">
                                Số điện thoại *
                              </label>
                              <input
                                type="tel"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                                value={passenger.phoneNumber || ""}
                                onChange={(e) =>
                                  updatePassenger(
                                    index,
                                    "phoneNumber",
                                    e.target.value
                                  )
                                }
                                placeholder="Nhập số điện thoại"
                                required
                              />
                            </div>
                          )}

                          {/* Email (only for contact person) */}
                          {isContactPerson && (
                            <div className="lg:col-span-2">
                              <label className="block font-semibold mb-1 text-gray-700">
                                Email *
                              </label>
                              <input
                                type="email"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                                value={passenger.email || ""}
                                onChange={(e) =>
                                  updatePassenger(
                                    index,
                                    "email",
                                    e.target.value
                                  )
                                }
                                placeholder="Nhập email"
                                required
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discount Code Section */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Mã giảm giá (không bắt buộc)
                </h3>

                {!appliedDiscount ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 uppercase"
                      value={discountCode}
                      onChange={(e) =>
                        setDiscountCode(e.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã giảm giá"
                      disabled={applyingDiscount}
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={applyingDiscount || !discountCode.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {applyingDiscount ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Đang kiểm tra...
                        </span>
                      ) : (
                        "Áp dụng"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">
                            Mã giảm giá: {appliedDiscount.code}
                          </p>
                          <p className="text-sm text-green-700">
                            {appliedDiscount.description}
                          </p>
                          <p className="text-sm text-green-600 font-medium">
                            Giảm:{" "}
                            {appliedDiscount.discountType === "percentage"
                              ? `${appliedDiscount.value}%`
                              : `${appliedDiscount.value.toLocaleString(
                                  "vi-VN"
                                )} đ`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Hình thức thanh toán
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Momo Payment */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === "momo"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("momo")}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id="momo"
                        name="paymentMethod"
                        value="momo"
                        checked={paymentMethod === "momo"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 text-blue-600"
                      />
                      <div className="w-6 h-6 mr-2 bg-pink-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        M
                      </div>
                      <label
                        htmlFor="momo"
                        className="font-semibold text-gray-800 cursor-pointer"
                      >
                        MoMo
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">
                      Thanh toán qua ví điện tử MoMo
                    </p>
                  </div>

                  {/* Bank Transfer */}
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === "bank_transfer"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("bank_transfer")}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id="bank_transfer"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === "bank_transfer"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3 text-blue-600"
                      />
                      <div className="text-2xl mr-2">🏦</div>
                      <label
                        htmlFor="bank_transfer"
                        className="font-semibold text-gray-800 cursor-pointer"
                      >
                        Chuyển khoản
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">
                      Chuyển khoản ngân hàng
                    </p>
                  </div>
                </div>

                {/* Payment Information Display */}
                {paymentMethod === "momo" && (
                  <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                    <h4 className="font-semibold text-pink-800 mb-2 flex items-center">
                      <div className="w-5 h-5 mr-2 bg-pink-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        M
                      </div>
                      Thông tin thanh toán MoMo
                    </h4>
                    <div className="text-sm text-pink-700">
                      <p className="mb-1">
                        <strong>Số điện thoại:</strong> 0376549230
                      </p>
                      <p className="mb-1">
                        <strong>Tên tài khoản:</strong> Nguyễn Tiến Phát
                      </p>
                      <p className="text-xs text-pink-600 mt-2">
                        * Sau khi đặt vé, bạn sẽ nhận được thông báo với thông
                        tin chi tiết để thanh toán
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === "bank_transfer" && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <div className="text-blue-600 mr-2">🏦</div>
                      Thông tin chuyển khoản
                    </h4>
                    <div className="text-sm text-blue-700 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="mb-1">
                            <strong>Ngân hàng:</strong> Ngân hàng TMCP Tiên
                            Phong
                          </p>
                          <p className="mb-1">
                            <strong>Số tài khoản:</strong> 6886 8686 547
                          </p>
                          <p className="mb-1">
                            <strong>Chủ tài khoản:</strong> NGUYEN TIEN PHAT
                          </p>
                        </div>
                        <div>
                          <p className="mb-1">
                            <strong>Chi nhánh:</strong> TPBank - Chi nhánh
                            TP.HCM
                          </p>
                          <p className="text-xs text-blue-600 mt-2">
                            * Vui lòng ghi rõ nội dung chuyển khoản theo hướng
                            dẫn sau khi đặt vé
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Special Requests */}
              <div className="mb-6">
                <label className="block font-semibold mb-2 text-gray-700">
                  Yêu cầu đặc biệt (không bắt buộc)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập yêu cầu đặc biệt của bạn..."
                />
              </div>

              {/* Flight Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Chi tiết đặt vé
                </h3>
                <div className="space-y-2 text-sm text-black">
                  <div className="flex justify-between">
                    <span>Hạng ghế:</span>
                    <span className="font-medium capitalize">
                      {flight.classes?.find(
                        (c) =>
                          c.className.toLowerCase() === seatClass.toLowerCase()
                      )?.className ||
                        (seatClass === "economy"
                          ? "Phổ thông"
                          : seatClass === "business"
                          ? "Thương gia"
                          : seatClass)}
                    </span>
                  </div>
                  {adults > 0 && (
                    <div className="flex justify-between">
                      <span>
                        Người lớn ({adults} x{" "}
                        {adultsPrice.toLocaleString("vi-VN")} đ)
                      </span>
                      <span className="font-medium">
                        {adultsTotal.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  )}
                  {children > 0 && (
                    <div className="flex justify-between">
                      <span>
                        Trẻ em 2-11 tuổi ({children} x{" "}
                        {childrenPrice.toLocaleString("vi-VN")} đ - 90%)
                      </span>
                      <span className="font-medium">
                        {childrenTotal.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  )}
                  {infants > 0 && (
                    <div className="flex justify-between">
                      <span>
                        Em bé dưới 2 tuổi ({infants} x{" "}
                        {infantsPrice.toLocaleString("vi-VN")} đ - 10%)
                      </span>
                      <span className="font-medium">
                        {infantsTotal.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="flex justify-between border-t pt-2">
                    <span>Tạm tính vé:</span>
                    <span className="font-medium">
                      {totalFlightPrice.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  {/* Add-ons */}
                  {extraBaggage > 0 && (
                    <div className="flex justify-between">
                      <span>🧳 Hành lý thêm ({extraBaggage} kiện):</span>
                      <span className="font-medium">
                        {baggageTotal.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  )}
                  {insurance && (
                    <div className="flex justify-between">
                      <span>🛡️ Bảo hiểm ({numTickets} người):</span>
                      <span className="font-medium">
                        {insuranceTotal.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  )}
                  {prioritySeat && (
                    <div className="flex justify-between">
                      <span>💺 Chỗ ngồi ưu tiên ({numTickets} người):</span>
                      <span className="font-medium">
                        {prioritySeatTotal.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  )}

                  {/* Subtotal with add-ons */}
                  {addOnsTotal > 0 && (
                    <div className="flex justify-between border-t pt-2">
                      <span>Tổng phụ:</span>
                      <span className="font-medium">
                        {subtotalWithAddons.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  )}

                  {/* Discount */}
                  {appliedDiscount &&
                    calculateDiscountAmount(subtotalWithAddons) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá ({appliedDiscount.code}):</span>
                        <span className="font-medium">
                          -
                          {calculateDiscountAmount(
                            subtotalWithAddons
                          ).toLocaleString("vi-VN")}{" "}
                          đ
                        </span>
                      </div>
                    )}

                  {/* Final Total */}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-sky-600">
                    <span>Tổng tiền:</span>
                    <span>{finalTotal.toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  "Xác nhận đặt vé"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
