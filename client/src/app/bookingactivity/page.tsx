"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Activity } from "@/types/activity";
import { Discount } from "@/types/discount";
import { bookingActivityService } from "@/services/bookingActivityService";
import { discountService } from "@/services/discountService";
import { paymentService } from "@/services/paymentService";
import { toast } from "sonner";
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  DollarSign,
  Tag,
  CreditCard,
  Wallet,
  Building2
} from "lucide-react";
import { env } from "@/config/env";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ParticipantInfo {
  fullName: string;
  phone?: string;
  email?: string;
  gender: string;
  dateOfBirth: string;
  cccd?: string;
  type: "adult" | "child" | "baby" | "senior";
}

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
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [scheduledDate, setScheduledDate] = useState(dateParam || "");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Discount information
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

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
    const participantList: ParticipantInfo[] = [];

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
    field: keyof ParticipantInfo,
    value: string
  ) => {
    setParticipants((prev) =>
      prev.map((participant, i) =>
        i === index ? { ...participant, [field]: value } : participant
      )
    );
  };

  const getParticipantTypeLabel = (
    type: "adult" | "child" | "baby" | "senior"
  ) => {
    switch (type) {
      case "adult":
        return "Người lớn";
      case "child":
        return "Trẻ em";
      case "baby":
        return "Em bé";
      case "senior":
        return "Người cao tuổi";
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
    const hasEmptyFields = participants.some((participant, index) => {
      if (index === 0) {
        return (
          !participant.fullName.trim() ||
          !participant.phone?.trim() ||
          !participant.email?.trim() ||
          !participant.gender.trim() ||
          !participant.dateOfBirth.trim()
        );
      }
      return (
        !participant.fullName.trim() ||
        !participant.gender.trim() ||
        !participant.dateOfBirth.trim()
      );
    });

    if (hasEmptyFields) {
      toast.error("Vui lòng nhập đầy đủ thông tin tất cả người tham gia!");
      return;
    }

    if (!scheduledDate) {
      toast.error("Vui lòng chọn ngày tham gia!");
      return;
    }

    if (!paymentMethod) {
      toast.error("Vui lòng chọn hình thức thanh toán!");
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
  const discountAmount = calculateDiscountAmount(subtotal);
  const finalTotal = calculateFinalTotal(subtotal);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
      <Header />

      <div className="py-8 px-4 mt-20">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
              <h1 className="text-2xl font-bold mb-2">
                Đặt hoạt động: {activity.name}
              </h1>
              <div className="flex items-center text-blue-100">
                <MapPin className="w-4 h-4 mr-2" />
                {activity.location?.name ||
                  activity.location?.address ||
                  "Chưa có địa chỉ"}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Activity Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <h2 className="font-semibold text-lg mb-3 text-blue-900">
                  Thông tin hoạt động
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-blue-600" />
                    <span>
                      {adults} người lớn, {children} trẻ em, {babies} em bé,{" "}
                      {seniors} người cao tuổi
                    </span>
                  </div>
                  {activity.operating_hours?.mon_to_sat && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-600" />
                      <span>
                        Giờ hoạt động: {activity.operating_hours.mon_to_sat}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduled Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày tham gia *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Participant Information */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  Thông tin người tham gia
                </h2>

                {participants.map((participant, index) => (
                  <div
                    key={index}
                    className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <h3 className="font-medium text-gray-700 mb-3">
                      {getParticipantTypeLabel(participant.type)} #{index + 1}
                      {index === 0 && " (Người liên hệ)"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Họ và tên *
                        </label>
                        <input
                          type="text"
                          value={participant.fullName}
                          onChange={(e) =>
                            updateParticipant(index, "fullName", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          placeholder="Nhập họ và tên"
                        />
                      </div>

                      {index === 0 && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Số điện thoại *
                            </label>
                            <input
                              type="tel"
                              value={participant.phone || ""}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "phone",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                              placeholder="Nhập số điện thoại"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email *
                            </label>
                            <input
                              type="email"
                              value={participant.email || ""}
                              onChange={(e) =>
                                updateParticipant(
                                  index,
                                  "email",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                              placeholder="Nhập email"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Giới tính *
                        </label>
                        <select
                          value={participant.gender}
                          onChange={(e) =>
                            updateParticipant(index, "gender", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày sinh *
                        </label>
                        <input
                          type="date"
                          value={participant.dateOfBirth}
                          onChange={(e) =>
                            updateParticipant(
                              index,
                              "dateOfBirth",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CCCD/CMND
                        </label>
                        <input
                          type="text"
                          value={participant.cccd || ""}
                          onChange={(e) =>
                            updateParticipant(index, "cccd", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nhập số CCCD/CMND (tùy chọn)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập ghi chú của bạn..."
                />
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Hình thức thanh toán *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div
                    onClick={() => setPaymentMethod("cash")}
                    className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === "cash"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className="w-6 h-6 text-green-600" />
                      <div>
                        <div className="font-medium">Tiền mặt</div>
                        <div className="text-xs text-gray-500">
                          Thanh toán khi nhận
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("momo")}
                    className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === "momo"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                        alt="MoMo"
                        className="w-8 h-8 object-contain"
                      />
                      <div>
                        <div className="font-medium">MoMo</div>
                        <div className="text-xs text-gray-500">Ví điện tử</div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("zalopay")}
                    className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === "zalopay"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/vi/7/77/ZaloPay_Logo.png"
                        alt="ZaloPay"
                        className="w-8 h-8 object-contain"
                      />
                      <div>
                        <div className="font-medium">ZaloPay</div>
                        <div className="text-xs text-gray-500">Ví điện tử</div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === "bank_transfer"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-6 h-6 text-blue-600" />
                      <div>
                        <div className="font-medium">Chuyển khoản</div>
                        <div className="text-xs text-gray-500">Ngân hàng</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã giảm giá (tùy chọn)
                </label>
                {!appliedDiscount ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) =>
                        setDiscountCode(e.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã giảm giá"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={applyingDiscount}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {applyingDiscount ? "Đang kiểm tra..." : "Áp dụng"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-green-900">
                          {appliedDiscount.code}
                        </div>
                        <div className="text-sm text-green-700">
                          Giảm{" "}
                          {appliedDiscount.discountType === "percentage"
                            ? `${appliedDiscount.value}%`
                            : `${appliedDiscount.value.toLocaleString(
                                "vi-VN"
                              )}đ`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200 mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  Chi tiết giá
                </h2>

                <div className="space-y-3 mb-4">
                  {adults > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Người lớn ({adults} x{" "}
                        {(activity.price?.retail?.adult || 0).toLocaleString(
                          "vi-VN"
                        )}
                        đ)
                      </span>
                      <span className="font-medium">
                        {(
                          adults * (activity.price?.retail?.adult || 0)
                        ).toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                  )}
                  {children > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Trẻ em ({children} x{" "}
                        {(activity.price?.retail?.child || 0).toLocaleString(
                          "vi-VN"
                        )}
                        đ)
                      </span>
                      <span className="font-medium">
                        {(
                          children * (activity.price?.retail?.child || 0)
                        ).toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                  )}
                  {babies > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Em bé ({babies} x{" "}
                        {(activity.price?.retail?.baby || 0).toLocaleString(
                          "vi-VN"
                        )}
                        đ)
                      </span>
                      <span className="font-medium">
                        {(
                          babies * (activity.price?.retail?.baby || 0)
                        ).toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                  )}
                  {seniors > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Người cao tuổi ({seniors} x{" "}
                        {(activity.price?.retail?.senior || 0).toLocaleString(
                          "vi-VN"
                        )}
                        đ)
                      </span>
                      <span className="font-medium">
                        {(
                          seniors * (activity.price?.retail?.senior || 0)
                        ).toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-blue-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tạm tính:</span>
                    <span className="font-medium">
                      {subtotal.toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {appliedDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium">
                        -{discountAmount.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold text-blue-900 pt-2 border-t border-blue-200">
                    <span>Tổng cộng:</span>
                    <span>{finalTotal.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận đặt chỗ"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
