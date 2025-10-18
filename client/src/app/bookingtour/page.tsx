"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { tourService, Tour } from "@/services/tourService";
import { bookingTourService } from "@/services/bookingTourService";
import { paymentService } from "@/services/paymentService";
import { discountService } from "@/services/discountService";
import { Discount } from "@/types/discount";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PassengerInfo {
  fullName: string;
  phone?: string;
  email?: string;
  gender: string;
  dateOfBirth: string;
  cccd?: string;
  type: "adult" | "child" | "infant";
}

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
  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(""); // Add payment method state

  // Discount information
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

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
    const totalPassengers = adults + children + infants;
    const passengerList: PassengerInfo[] = [];

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
      toast.error("Vui lòng đăng nhập để đặt tour!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }

    // Validate passenger information
    const hasEmptyFields = passengers.some((passenger, index) => {
      // For first passenger (contact person), check all required fields
      if (index === 0) {
        return (
          !passenger.fullName.trim() ||
          !passenger.phone?.trim() ||
          !passenger.email?.trim() ||
          !passenger.gender.trim() ||
          !passenger.dateOfBirth.trim()
        );
      }
      // For other passengers, only check name, gender and date of birth
      return (
        !passenger.fullName.trim() ||
        !passenger.gender.trim() ||
        !passenger.dateOfBirth.trim()
      );
    });

    if (hasEmptyFields) {
      toast.error("Vui lòng nhập đầy đủ thông tin tất cả hành khách!");
      return;
    }

    if (!paymentMethod) {
      toast.error("Vui lòng chọn hình thức thanh toán!");
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
            // Store booking data temporarily for after payment
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

            // Store in localStorage to retrieve after payment redirect
            localStorage.setItem("pendingBooking", JSON.stringify(bookingData));

            // Show success message and redirect to MoMo
            toast.success("Đang chuyển hướng đến trang thanh toán MoMo...");

            // Redirect to MoMo payment page
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">Đặt Tour: {tour.title}</h1>
            <div className="flex items-center text-blue-100">
              <span className="mr-4">
                👥 {adults + children + infants} khách
              </span>
              <span>
                💰 Tổng:{" "}
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

            {/* Passenger Information */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Thông tin hành khách
              </h3>

              <div className="space-y-6">
                {passengers.map((passenger, index) => {
                  // Count passengers by type up to current index
                  const passengersOfSameType = passengers
                    .slice(0, index + 1)
                    .filter((p) => p.type === passenger.type).length;

                  const isContactPerson = index === 0;

                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center mb-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {getPassengerTypeLabel(passenger.type)}{" "}
                          {passengersOfSameType}
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
                              updatePassenger(index, "fullName", e.target.value)
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

                        {/* CCCD */}
                        <div className="lg:col-span-1">
                          <label className="block font-semibold mb-1 text-gray-700">
                            CCCD/CMND
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                            value={passenger.cccd || ""}
                            onChange={(e) =>
                              updatePassenger(index, "cccd", e.target.value)
                            }
                            placeholder="Nhập số CCCD/CMND"
                          />
                        </div>

                        {/* Phone (only for contact person) */}
                        {isContactPerson && (
                          <div className="lg:col-span-2">
                            <label className="block font-semibold mb-1 text-gray-700">
                              Số điện thoại *
                            </label>
                            <input
                              type="tel"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                              value={passenger.phone || ""}
                              onChange={(e) =>
                                updatePassenger(index, "phone", e.target.value)
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
                                updatePassenger(index, "email", e.target.value)
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cash Payment */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === "cash"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      id="cash"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3 text-blue-600"
                    />
                    <div className="text-2xl mr-2">💵</div>
                    <label
                      htmlFor="cash"
                      className="font-semibold text-gray-800 cursor-pointer"
                    >
                      Tiền mặt
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Thanh toán bằng tiền mặt khi gặp hướng dẫn viên
                  </p>
                </div>

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
                      * Sau khi đặt tour, bạn sẽ nhận được thông báo với thông
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
                          <strong>Ngân hàng:</strong> Ngân hàng Thương mại Cổ
                          phần Tiên Phong
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
                          <strong>Chi nhánh:</strong> TPBank - Chi nhánh Tp. Hồ
                          Chí Minh
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          * Vui lòng ghi rõ nội dung chuyển khoản theo hướng dẫn
                          sau khi đặt tour
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                    <div className="text-green-600 mr-2">💵</div>
                    Thanh toán tiền mặt
                  </h4>
                  <div className="text-sm text-green-700">
                    <p className="mb-2">
                      Quý khách vui lòng thanh toán tiền mặt khi gặp hướng dẫn
                      viên tại điểm tập trung hoặc tại văn phòng công ty.
                    </p>
                    <p className="text-xs text-green-600">
                      * Chúng tôi sẽ liên hệ với quý khách để xác nhận và thông
                      báo địa điểm thanh toán cụ thể
                    </p>
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

            {/* Tour Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Chi tiết đặt tour
              </h3>
              <div className="space-y-2 text-sm text-black">
                {(() => {
                  const subtotal = tour.pricingByAge
                    ? adults * tour.pricingByAge.adult +
                      children * tour.pricingByAge.child +
                      infants * tour.pricingByAge.infant
                    : 0;
                  const discountAmount = calculateDiscountAmount(subtotal);
                  const finalTotal = calculateFinalTotal(subtotal);

                  return (
                    <>
                      {adults > 0 && (
                        <div className="flex justify-between">
                          <span>
                            Người lớn ({adults} x{" "}
                            {tour.pricingByAge?.adult.toLocaleString("vi-VN")}{" "}
                            đ)
                          </span>
                          <span className="font-medium">
                            {(
                              adults * (tour.pricingByAge?.adult || 0)
                            ).toLocaleString("vi-VN")}{" "}
                            đ
                          </span>
                        </div>
                      )}
                      {children > 0 && (
                        <div className="flex justify-between">
                          <span>
                            Trẻ em ({children} x{" "}
                            {tour.pricingByAge?.child.toLocaleString("vi-VN")}{" "}
                            đ)
                          </span>
                          <span className="font-medium">
                            {(
                              children * (tour.pricingByAge?.child || 0)
                            ).toLocaleString("vi-VN")}{" "}
                            đ
                          </span>
                        </div>
                      )}
                      {infants > 0 && (
                        <div className="flex justify-between">
                          <span>
                            Em bé ({infants} x{" "}
                            {tour.pricingByAge?.infant.toLocaleString("vi-VN")}{" "}
                            đ)
                          </span>
                          <span className="font-medium">
                            {(
                              infants * (tour.pricingByAge?.infant || 0)
                            ).toLocaleString("vi-VN")}{" "}
                            đ
                          </span>
                        </div>
                      )}

                      {/* Subtotal */}
                      <div className="flex justify-between border-t pt-2">
                        <span>Tạm tính:</span>
                        <span className="font-medium">
                          {subtotal.toLocaleString("vi-VN")} đ
                        </span>
                      </div>

                      {/* Discount */}
                      {appliedDiscount && discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Giảm giá ({appliedDiscount.code}):</span>
                          <span className="font-medium">
                            -{discountAmount.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      )}

                      {/* Final Total */}
                      <div className="border-t pt-2 flex justify-between text-lg font-bold text-green-600">
                        <span>Tổng tiền:</span>
                        <span>{finalTotal.toLocaleString("vi-VN")} đ</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

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
  );
}
