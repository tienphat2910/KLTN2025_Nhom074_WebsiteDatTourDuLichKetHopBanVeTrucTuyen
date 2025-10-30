"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { tourService, Tour } from "@/services/tourService";
import { bookingTourService } from "@/services/bookingTourService";
import { paymentService } from "@/services/paymentService";
import { Discount } from "@/types/discount";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Users, DollarSign } from "lucide-react";
import {
  DiscountCode,
  PaymentMethod,
  SpecialRequest,
  validateTourPassengers,
  validatePaymentMethod,
  TourPassenger
} from "@/components/Booking/Common";
import { TourPassengerForm, TourPriceSummary } from "@/components/Booking/Tour";

export default function BookingTourPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user, isAuthLoading } = useAuth();

  const tourId = searchParams.get("tourId");
  const adults = Number(searchParams.get("adults") || 1);
  const children = Number(searchParams.get("children") || 0);
  const infants = Number(searchParams.get("infants") || 0);

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Thông tin hành khách
  const [passengers, setPassengers] = useState<TourPassenger[]>([]);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Discount information
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt tour!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Initialize passenger info based on number of people
  useEffect(() => {
    const passengerList: TourPassenger[] = [];

    // Add adults
    for (let i = 0; i < adults; i++) {
      passengerList.push({
        fullName: i === 0 && user?.fullName ? user.fullName : "",
        phone: i === 0 && user?.phone ? user.phone : undefined,
        email: i === 0 && user?.email ? user.email : undefined,
        gender: "",
        dateOfBirth: "",
        cccd: "",
        type: "adult"
      });
    }

    // Add children
    for (let i = 0; i < children; i++) {
      passengerList.push({
        fullName: "",
        gender: "",
        dateOfBirth: "",
        cccd: "",
        type: "child"
      });
    }

    // Add infants
    for (let i = 0; i < infants; i++) {
      passengerList.push({
        fullName: "",
        gender: "",
        dateOfBirth: "",
        cccd: "",
        type: "infant"
      });
    }

    setPassengers(passengerList);
  }, [adults, children, infants, user]);

  useEffect(() => {
    if (tourId) {
      tourService.getTourById(tourId).then((res) => {
        if (res.success) setTour(res.data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [tourId]);

  const updatePassenger = (
    index: number,
    field: keyof TourPassenger,
    value: string
  ) => {
    setPassengers((prev) =>
      prev.map((passenger, i) =>
        i === index ? { ...passenger, [field]: value } : passenger
      )
    );
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
      toast.error("Vui lòng đăng nhập để đặt tour!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }

    // Validate passenger information
    if (!validateTourPassengers(passengers)) {
      return;
    }

    if (!validatePaymentMethod(paymentMethod)) {
      return;
    }

    if (!tour) {
      toast.error("Không tìm thấy thông tin tour.");
      return;
    }

    if (!tour.pricingByAge) {
      toast.error("Thiếu thông tin giá tour.");
      return;
    }

    setSubmitting(true);

    try {
      // Calculate total amount
      const subtotal =
        adults * tour.pricingByAge.adult +
        children * tour.pricingByAge.child +
        infants * tour.pricingByAge.infant;

      const discountAmount = calculateDiscountAmount(subtotal);
      const finalTotal = calculateFinalTotal(subtotal);

      // If payment method is MoMo, handle MoMo payment flow
      if (paymentMethod === "momo") {
        try {
          // Create MoMo payment
          const momoResponse = await paymentService.createMoMoPayment({
            amount: finalTotal,
            orderInfo: `Thanh toán tour: ${tour.title}`,
            extraData: JSON.stringify({
              tourId: tour._id,
              numAdults: adults,
              numChildren: children,
              numInfants: infants,
              passengers,
              note,
              discountCode: appliedDiscount?.code,
              discountAmount
            })
          });

          if (momoResponse.success && momoResponse.data?.payUrl) {
            const bookingData = {
              tourId: tour._id,
              numAdults: adults,
              numChildren: children,
              numInfants: infants,
              priceByAge: tour.pricingByAge,
              subtotal: subtotal,
              discountAmount,
              finalTotal,
              discountCode: appliedDiscount?.code,
              status: "pending",
              passengers,
              note,
              paymentMethod,
              momoOrderId: momoResponse.data.orderId
            };

            localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
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

      // If payment method is ZaloPay, handle ZaloPay payment flow
      if (paymentMethod === "zalopay") {
        try {
          const zalopayResponse = await paymentService.createZaloPayPayment({
            amount: finalTotal,
            description: `Thanh toán tour: ${tour.title}`,
            extraData: JSON.stringify({
              tourId: tour._id,
              numAdults: adults,
              numChildren: children,
              numInfants: infants,
              passengers,
              note,
              discountCode: appliedDiscount?.code,
              discountAmount
            })
          });

          if (zalopayResponse.success && zalopayResponse.data?.order_url) {
            const bookingData = {
              tourId: tour._id,
              numAdults: adults,
              numChildren: children,
              numInfants: infants,
              priceByAge: tour.pricingByAge,
              subtotal: subtotal,
              discountAmount,
              finalTotal,
              discountCode: appliedDiscount?.code,
              status: "pending",
              passengers,
              note,
              paymentMethod,
              zalopayTransId: zalopayResponse.data.app_trans_id
            };

            localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
            toast.success("Đang chuyển hướng đến trang thanh toán ZaloPay...");
            window.location.href = zalopayResponse.data.order_url;
            return;
          } else {
            throw new Error(
              zalopayResponse.message || "Không thể tạo thanh toán ZaloPay"
            );
          }
        } catch (zalopayError) {
          console.error("ZaloPay payment error:", zalopayError);
          toast.error("Lỗi khi tạo thanh toán ZaloPay. Vui lòng thử lại!");
          setSubmitting(false);
          return;
        }
      }

      // For other payment methods, proceed with normal booking flow
      const res = await bookingTourService.createBookingTour({
        tourId: tour._id,
        numAdults: adults,
        numChildren: children,
        numInfants: infants,
        priceByAge: tour.pricingByAge,
        subtotal: subtotal,
        discountAmount,
        finalTotal,
        discountCode: appliedDiscount?.code,
        status: "pending",
        passengers,
        note,
        paymentMethod
      });

      if (res.success) {
        toast.success("Đặt tour thành công!");
        router.push("/profile/booking");
      } else {
        if (res.requireAuth) {
          router.push(
            `/login?redirect=${encodeURIComponent(
              window.location.pathname + window.location.search
            )}`
          );
        } else {
          toast.error(res.message || "Đặt tour thất bại!");
        }
      }
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Lỗi kết nối server!");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
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
        <div>Đang tải thông tin tour...</div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Không tìm thấy tour.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
      <Header />
      <div className="py-8 mt-16 sm:mt-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
              <h1 className="text-2xl font-bold mb-2">
                Đặt Tour: {tour.title}
              </h1>
              <div className="flex items-center text-blue-100">
                <span className="mr-4 flex items-center gap-1">
                  <Users className="w-4 h-4" /> {adults + children + infants}{" "}
                  khách
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> Tổng:{" "}
                  {(() => {
                    const subtotal = tour.pricingByAge
                      ? adults * tour.pricingByAge.adult +
                        children * tour.pricingByAge.child +
                        infants * tour.pricingByAge.infant
                      : 0;
                    const finalTotal = calculateFinalTotal(subtotal);
                    return finalTotal.toLocaleString("vi-VN");
                  })()}{" "}
                  đ
                  {appliedDiscount && (
                    <span className="ml-2 text-yellow-300 text-sm">
                      (Đã áp dụng mã giảm giá)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* User Account Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Thông tin tài khoản đặt tour
                </h3>
                <p className="text-sm text-blue-700">
                  Đăng nhập với: {user?.email}
                </p>
              </div>

              {/* Passenger Information - Using Component */}
              <TourPassengerForm
                passengers={passengers}
                updatePassenger={updatePassenger}
              />

              {/* Discount Code Section - Using Component */}
              <DiscountCode
                discountCode={discountCode}
                setDiscountCode={setDiscountCode}
                appliedDiscount={appliedDiscount}
                setAppliedDiscount={setAppliedDiscount}
              />

              {/* Payment Method Selection - Using Component */}
              <PaymentMethod
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                showCash={true}
              />

              {/* Special Requests - Using Component */}
              <SpecialRequest note={note} setNote={setNote} />

              {/* Tour Summary - Using Component */}
              {tour.pricingByAge && (
                <TourPriceSummary
                  adults={adults}
                  children={children}
                  infants={infants}
                  adultPrice={tour.pricingByAge.adult}
                  childPrice={tour.pricingByAge.child}
                  infantPrice={tour.pricingByAge.infant}
                  appliedDiscount={appliedDiscount}
                  calculateDiscountAmount={calculateDiscountAmount}
                />
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-lg"
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
                  "Xác nhận đặt tour"
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
