"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { paymentService } from "@/services/paymentService";
import { bookingTourService } from "@/services/bookingTourService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
interface BookingData {
  tourId: string;
  numAdults: number;
  numChildren: number;
  numInfants: number;
  priceByAge: {
    adult: number;
    child: number;
    infant: number;
  };
  subtotal: number;
  status: string;
  passengers: any[];
  note: string;
  paymentMethod: string;
  momoOrderId: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "checking" | "success" | "failed" | "error"
  >("checking");
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [bookingCreated, setBookingCreated] = useState(false);

  // Get URL parameters from MoMo redirect
  const partnerCode = searchParams.get("partnerCode");
  const orderId = searchParams.get("orderId");
  const requestId = searchParams.get("requestId");
  const amount = searchParams.get("amount");
  const orderInfo = searchParams.get("orderInfo");
  const orderType = searchParams.get("orderType");
  const transId = searchParams.get("transId");
  const resultCode = searchParams.get("resultCode");
  const message = searchParams.get("message");
  const payType = searchParams.get("payType");
  const responseTime = searchParams.get("responseTime");
  const extraData = searchParams.get("extraData");
  const signature = searchParams.get("signature");

  useEffect(() => {
    // Check authentication
    if (!isAuthLoading && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập!");
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      handlePaymentResult();
    }
  }, [isAuthenticated, isAuthLoading]);

  const handlePaymentResult = async () => {
    try {
      setLoading(true);

      // Check if we have the required parameters
      if (!orderId || !resultCode) {
        setPaymentStatus("error");
        setLoading(false);
        toast.error("Thông tin thanh toán không hợp lệ!");
        return;
      }

      // Get pending booking data from localStorage
      const pendingBookingData = localStorage.getItem("pendingBooking");
      if (!pendingBookingData) {
        setPaymentStatus("error");
        setLoading(false);
        toast.error("Không tìm thấy thông tin đặt tour!");
        return;
      }

      const bookingData: BookingData = JSON.parse(pendingBookingData);

      // Verify this is the correct order
      if (bookingData.momoOrderId !== orderId) {
        setPaymentStatus("error");
        setLoading(false);
        toast.error("Mã đơn hàng không khớp!");
        return;
      }

      // Check payment status with MoMo
      const statusResponse = await paymentService.checkMoMoPaymentStatus(
        orderId
      );

      if (!statusResponse.success) {
        throw new Error("Không thể kiểm tra trạng thái thanh toán");
      }

      const paymentResult = statusResponse.data;
      setPaymentInfo({
        orderId,
        amount,
        message,
        resultCode,
        transId,
        paymentResult
      });

      // Check if payment was successful
      if (resultCode === "0" && paymentResult?.resultCode === 0) {
        setPaymentStatus("success");

        // Create the booking if payment successful and not already created
        if (!bookingCreated) {
          try {
            const bookingResponse = await bookingTourService.createBookingTour({
              ...bookingData,
              status: "confirmed", // Set as confirmed since payment is successful
              note: `${
                bookingData.note ? bookingData.note + "\n" : ""
              }Thanh toán MoMo thành công. Mã giao dịch: ${transId}, Mã đơn hàng: ${orderId}`
            });

            if (bookingResponse.success) {
              setBookingCreated(true);
              toast.success(
                "Thanh toán thành công! Đặt tour đã được xác nhận."
              );

              // Clear pending booking data
              localStorage.removeItem("pendingBooking");
            } else {
              // Payment successful but booking creation failed
              toast.error(
                "Thanh toán thành công nhưng có lỗi khi tạo booking. Vui lòng liên hệ hỗ trợ!"
              );
            }
          } catch (bookingError) {
            console.error("Booking creation error:", bookingError);
            toast.error(
              "Thanh toán thành công nhưng có lỗi khi tạo booking. Vui lòng liên hệ hỗ trợ!"
            );
          }
        }
      } else {
        setPaymentStatus("failed");
        toast.error(`Thanh toán thất bại: ${message || "Lỗi không xác định"}`);

        // Clear pending booking data
        localStorage.removeItem("pendingBooking");
      }
    } catch (error) {
      console.error("Payment result handling error:", error);
      setPaymentStatus("error");
      toast.error("Có lỗi khi xử lý kết quả thanh toán!");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryBooking = () => {
    // Clear any pending data and redirect back to booking
    localStorage.removeItem("pendingBooking");
    router.push("/tour");
  };

  const handleGoToBookings = () => {
    router.push("/profile/bookings");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div>Đang kiểm tra đăng nhập...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
        <div>Đang chuyển hướng đến trang đăng nhập...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100 py-8 pt-20 lg:pt-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Đang xử lý kết quả thanh toán...
                </h2>
                <p className="text-gray-500">Vui lòng đợi trong giây lát</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div
                  className={`p-6 text-white ${
                    paymentStatus === "success"
                      ? "bg-gradient-to-r from-green-500 to-green-600"
                      : paymentStatus === "failed"
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {paymentStatus === "success" && "✅"}
                      {paymentStatus === "failed" && "❌"}
                      {(paymentStatus === "error" ||
                        paymentStatus === "checking") &&
                        "⚠️"}
                    </div>
                    <h1 className="text-2xl font-bold">
                      {paymentStatus === "success" && "Thanh toán thành công!"}
                      {paymentStatus === "failed" && "Thanh toán thất bại!"}
                      {(paymentStatus === "error" ||
                        paymentStatus === "checking") &&
                        "Có lỗi xảy ra!"}
                    </h1>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {paymentStatus === "success" && (
                    <div className="text-center">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-green-800 mb-2">
                          Đặt tour thành công!
                        </h3>
                        <p className="text-green-700 text-sm">
                          Cảm ơn bạn đã sử dụng dịch vụ của LuTrip. Chúng tôi sẽ
                          liên hệ với bạn sớm nhất có thể.
                        </p>
                      </div>

                      {paymentInfo && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            Thông tin thanh toán
                          </h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Mã đơn hàng:</span>
                              <span className="font-medium">
                                {paymentInfo.orderId}
                              </span>
                            </div>
                            {paymentInfo.transId && (
                              <div className="flex justify-between">
                                <span>Mã giao dịch:</span>
                                <span className="font-medium">
                                  {paymentInfo.transId}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Số tiền:</span>
                              <span className="font-medium text-green-600">
                                {Number(paymentInfo.amount).toLocaleString(
                                  "vi-VN"
                                )}{" "}
                                đ
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Trạng thái:</span>
                              <span className="font-medium text-green-600">
                                Thành công
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <button
                          onClick={handleGoToBookings}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300"
                        >
                          Xem đặt tour của tôi
                        </button>
                        <button
                          onClick={handleGoHome}
                          className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300"
                        >
                          Về trang chủ
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentStatus === "failed" && (
                    <div className="text-center">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-red-800 mb-2">
                          Thanh toán không thành công
                        </h3>
                        <p className="text-red-700 text-sm">
                          {message ||
                            "Giao dịch không được hoàn tất. Vui lòng thử lại."}
                        </p>
                      </div>

                      {paymentInfo && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            Thông tin giao dịch
                          </h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Mã đơn hàng:</span>
                              <span className="font-medium">
                                {paymentInfo.orderId}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Số tiền:</span>
                              <span className="font-medium">
                                {Number(paymentInfo.amount).toLocaleString(
                                  "vi-VN"
                                )}{" "}
                                đ
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Trạng thái:</span>
                              <span className="font-medium text-red-600">
                                Thất bại
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <button
                          onClick={handleRetryBooking}
                          className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300"
                        >
                          Thử lại đặt tour
                        </button>
                        <button
                          onClick={handleGoHome}
                          className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300"
                        >
                          Về trang chủ
                        </button>
                      </div>
                    </div>
                  )}

                  {(paymentStatus === "error" ||
                    paymentStatus === "checking") && (
                    <div className="text-center">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-yellow-800 mb-2">
                          Có lỗi xảy ra
                        </h3>
                        <p className="text-yellow-700 text-sm">
                          Không thể xác định trạng thái thanh toán. Vui lòng
                          liên hệ hỗ trợ hoặc kiểm tra lại thông tin đặt tour.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleGoToBookings}
                          className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300"
                        >
                          Kiểm tra đặt tour của tôi
                        </button>
                        <button
                          onClick={handleRetryBooking}
                          className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300"
                        >
                          Đặt tour mới
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
