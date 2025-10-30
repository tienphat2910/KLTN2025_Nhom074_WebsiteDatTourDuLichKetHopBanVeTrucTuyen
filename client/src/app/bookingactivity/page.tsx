"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Activity } from "@/types/activity";
import { bookingActivityService } from "@/services/bookingActivityService";
import { paymentService } from "@/services/paymentService";
import { Discount } from "@/types/discount";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Users, DollarSign, MapPin } from "lucide-react";
import { env } from "@/config/env";
import {
  DiscountCode,
  PaymentMethod,
  SpecialRequest,
  validateActivityParticipants,
  validatePaymentMethod,
  validateScheduledDate,
  ActivityParticipant
} from "@/components/Booking/Common";
import {
  ActivityInfo,
  ActivityParticipantForm,
  ScheduledDate,
  ActivityPriceSummary
} from "@/components/Booking/Activity";

export default function BookingActivityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user, isAuthLoading } = useAuth();

  const activityId = searchParams.get("activityId");
  const adults = Number(searchParams.get("adults") || 1);
  const children = Number(searchParams.get("children") || 0);
  const babies = Number(searchParams.get("babies") || 0);
  const seniors = Number(searchParams.get("seniors") || 0);
  const dateParam = searchParams.get("date");

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Booking information
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [scheduledDate, setScheduledDate] = useState(dateParam || "");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Discount information
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt hoạt động!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Initialize participant info
  useEffect(() => {
    const participantList: ActivityParticipant[] = [];

    // Add adults
    for (let i = 0; i < adults; i++) {
      participantList.push({
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
      participantList.push({
        fullName: "",
        gender: "",
        dateOfBirth: "",
        cccd: "",
        type: "child"
      });
    }

    // Add babies
    for (let i = 0; i < babies; i++) {
      participantList.push({
        fullName: "",
        gender: "",
        dateOfBirth: "",
        cccd: "",
        type: "baby"
      });
    }

    // Add seniors
    for (let i = 0; i < seniors; i++) {
      participantList.push({
        fullName: "",
        gender: "",
        dateOfBirth: "",
        cccd: "",
        type: "senior"
      });
    }

    setParticipants(participantList);
  }, [adults, children, babies, seniors, user]);

  // Fetch activity data
  useEffect(() => {
    if (activityId) {
      fetch(`${env.API_BASE_URL}/activities/${activityId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setActivity(data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activityId]);

  const updateParticipant = (
    index: number,
    field: keyof ActivityParticipant,
    value: string
  ) => {
    setParticipants((prev) =>
      prev.map((participant, i) =>
        i === index ? { ...participant, [field]: value } : participant
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

  // Calculate subtotal
  const calculateSubtotal = () => {
    if (!activity?.price?.retail) return 0;

    const adultPrice = activity.price.retail.adult || 0;
    const childPrice = activity.price.retail.child || 0;
    const babyPrice = activity.price.retail.baby || 0;
    const seniorPrice = activity.price.retail.senior || 0;

    return (
      adults * adultPrice +
      children * childPrice +
      babies * babyPrice +
      seniors * seniorPrice
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt hoạt động!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }

    // Validate participant information
    if (!validateActivityParticipants(participants)) {
      return;
    }

    if (!validateScheduledDate(scheduledDate)) {
      return;
    }

    if (!validatePaymentMethod(paymentMethod)) {
      return;
    }

    if (!activity) {
      toast.error("Không tìm thấy thông tin hoạt động.");
      return;
    }

    setSubmitting(true);

    try {
      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscountAmount(subtotal);
      const finalTotal = calculateFinalTotal(subtotal);

      // If payment method is MoMo
      if (paymentMethod === "momo") {
        try {
          const momoResponse = await paymentService.createMoMoPayment({
            amount: finalTotal,
            orderInfo: `Thanh toán hoạt động: ${activity.name}`,
            extraData: JSON.stringify({
              activityId: activity._id,
              numAdults: adults,
              numChildren: children,
              numBabies: babies,
              numSeniors: seniors,
              scheduledDate,
              participants,
              note,
              discountCode: appliedDiscount?.code,
              discountAmount
            })
          });

          if (momoResponse.success && momoResponse.data?.payUrl) {
            const bookingData = {
              activityId: activity._id,
              numAdults: adults,
              numChildren: children,
              numBabies: babies,
              numSeniors: seniors,
              scheduledDate,
              subtotal,
              discountAmount,
              finalTotal,
              discountCode: appliedDiscount?.code,
              participants,
              note,
              paymentMethod,
              momoOrderId: momoResponse.data.orderId
            };

            localStorage.setItem(
              "pendingActivityBooking",
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

      // If payment method is ZaloPay
      if (paymentMethod === "zalopay") {
        try {
          const zalopayResponse = await paymentService.createZaloPayPayment({
            amount: finalTotal,
            description: `Thanh toán hoạt động: ${activity.name}`,
            extraData: JSON.stringify({
              activityId: activity._id,
              numAdults: adults,
              numChildren: children,
              numBabies: babies,
              numSeniors: seniors,
              scheduledDate,
              participants,
              note,
              discountCode: appliedDiscount?.code,
              discountAmount
            })
          });

          if (zalopayResponse.success && zalopayResponse.data?.order_url) {
            const bookingData = {
              activityId: activity._id,
              numAdults: adults,
              numChildren: children,
              numBabies: babies,
              numSeniors: seniors,
              scheduledDate,
              subtotal,
              discountAmount,
              finalTotal,
              discountCode: appliedDiscount?.code,
              participants,
              note,
              paymentMethod,
              zalopayTransId: zalopayResponse.data.app_trans_id
            };

            localStorage.setItem(
              "pendingActivityBooking",
              JSON.stringify(bookingData)
            );
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

      // For other payment methods
      const res = await bookingActivityService.createBookingActivity({
        activityId: activity._id,
        numAdults: adults,
        numChildren: children,
        numBabies: babies,
        numSeniors: seniors,
        scheduledDate,
        note,
        paymentMethod
      });

      if (res.success) {
        toast.success("Đặt hoạt động thành công!");
        router.push("/profile/bookings");
      } else {
        if (res.requireAuth) {
          router.push(
            `/login?redirect=${encodeURIComponent(
              window.location.pathname + window.location.search
            )}`
          );
        } else {
          toast.error(res.message || "Đặt hoạt động thất bại!");
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
        <div>Đang tải thông tin hoạt động...</div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Không tìm thấy hoạt động.</div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <Header />
      <div className="py-8 mt-16 sm:mt-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
              <h1 className="text-2xl font-bold mb-2">
                Đặt hoạt động: {activity.name}
              </h1>
              <div className="flex items-center text-orange-100">
                <MapPin className="w-4 h-4 mr-2" />
                <span>
                  {activity.location?.name ||
                    activity.location?.address ||
                    "Chưa có thông tin"}
                </span>
              </div>
              <div className="flex items-center text-orange-100 mt-2">
                <Users className="w-4 h-4 mr-2" />
                <span>
                  {adults + children + babies + seniors} người tham gia
                </span>
                <DollarSign className="w-4 h-4 ml-4 mr-1" />
                <span>
                  Tổng: {calculateFinalTotal(subtotal).toLocaleString("vi-VN")}{" "}
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
                  Thông tin tài khoản đặt hoạt động
                </h3>
                <p className="text-sm text-blue-700">
                  Đăng nhập với: {user?.email}
                </p>
              </div>

              {/* Activity Info - Using Component */}
              <ActivityInfo
                adults={adults}
                children={children}
                babies={babies}
                seniors={seniors}
                operatingHours={
                  activity.operating_hours?.mon_to_sat ||
                  activity.operating_hours?.sunday_holidays ||
                  undefined
                }
              />

              {/* Scheduled Date - Using Component */}
              <ScheduledDate
                scheduledDate={scheduledDate}
                setScheduledDate={setScheduledDate}
              />

              {/* Participant Information - Using Component */}
              <ActivityParticipantForm
                participants={participants}
                updateParticipant={updateParticipant}
              />

              {/* Special Requests - Using Component */}
              <SpecialRequest note={note} setNote={setNote} />

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

              {/* Price Summary - Using Component */}
              {activity.price?.retail && (
                <ActivityPriceSummary
                  adults={adults}
                  children={children}
                  babies={babies}
                  seniors={seniors}
                  adultPrice={activity.price.retail.adult || 0}
                  childPrice={activity.price.retail.child || 0}
                  babyPrice={activity.price.retail.baby || 0}
                  seniorPrice={activity.price.retail.senior || 0}
                  appliedDiscount={appliedDiscount}
                  calculateDiscountAmount={calculateDiscountAmount}
                />
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-lg"
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
                  "Xác nhận đặt đơn"
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
