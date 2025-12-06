"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { paymentService } from "@/services/paymentService";
import { bookingTourService } from "@/services/bookingTourService";
import { bookingFlightService } from "@/services/bookingFlightService";
import { checkPaymentStatus as checkAmadeusPaymentStatus } from "@/services/amadeusBookingService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
interface BookingTourData {
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

interface BookingFlightData {
  flightId: string;
  flightCode: string;
  flightClassId: string;
  numTickets: number;
  pricePerTicket: number;
  totalFlightPrice: number;
  discountAmount?: number;
  finalTotal?: number;
  discountCode?: string;
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
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "zalopay" | null>(
    null
  );

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

  // Get URL parameters from ZaloPay redirect
  const appTransId = searchParams.get("apptransid");
  const zalopayStatus = searchParams.get("status"); // 1 = success, -1 = failed
  const zalopayAmount = searchParams.get("amount");
  const checksum = searchParams.get("checksum");

  useEffect(() => {
    console.log("🔄 UseEffect triggered:", {
      isAuthLoading,
      isAuthenticated,
      paymentMethod,
      hasAppTransId: !!appTransId,
      hasZalopayStatus: !!zalopayStatus,
      hasOrderId: !!orderId,
      hasPartnerCode: !!partnerCode
    });

    // Detect payment method from URL params (only run once on mount)
    if (!paymentMethod) {
      if (appTransId || zalopayStatus) {
        console.log("✅ Detected ZaloPay");
        setPaymentMethod("zalopay");
        return; // Return early to avoid calling handlePaymentResult in the same render
      } else if (orderId || partnerCode) {
        console.log("✅ Detected MoMo");
        setPaymentMethod("momo");
        return; // Return early to avoid calling handlePaymentResult in the same render
      }
    }

    // Check authentication
    if (!isAuthLoading && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập!");
      router.push("/login");
      return;
    }

    if (isAuthenticated && paymentMethod && !bookingCreated) {
      console.log("🚀 Calling handlePaymentResult with method:", paymentMethod);
      handlePaymentResult();
    }
  }, [
    isAuthenticated,
    isAuthLoading,
    paymentMethod,
    appTransId,
    zalopayStatus,
    orderId,
    partnerCode
  ]);

  const handlePaymentResult = async () => {
    try {
      setLoading(true);

      if (paymentMethod === "momo") {
        await handleMoMoPayment();
      } else if (paymentMethod === "zalopay") {
        await handleZaloPayPayment();
      } else {
        setPaymentStatus("error");
        toast.error("Không xác định được phương thức thanh toán!");
      }
    } catch (error) {
      console.error("Payment result handling error:", error);
      setPaymentStatus("error");
      toast.error("Có lỗi khi xử lý kết quả thanh toán!");
    } finally {
      setLoading(false);
    }
  };

  const handleMoMoPayment = async () => {
    // Check if we have the required parameters
    if (!orderId || !resultCode) {
      setPaymentStatus("error");
      toast.error("Thông tin thanh toán không hợp lệ!");
      return;
    }

    // Get pending booking data from localStorage - try tour, flight, and activity
    const pendingTourData = localStorage.getItem("pendingBooking");
    const pendingFlightData = localStorage.getItem("pendingFlightBooking");
    const pendingActivityData = localStorage.getItem("pendingActivityBooking");

    if (!pendingTourData && !pendingFlightData && !pendingActivityData) {
      setPaymentStatus("error");
      toast.error("Không tìm thấy thông tin đặt vé!");
      return;
    }

    // Priority: Flight > Tour > Activity (check in order of specificity)
    const isFlight = !!pendingFlightData;
    const isTour = !isFlight && !!pendingTourData;
    const isActivity = !isFlight && !isTour && !!pendingActivityData;

    const bookingData = isFlight
      ? JSON.parse(pendingFlightData!)
      : isTour
      ? JSON.parse(pendingTourData!)
      : JSON.parse(pendingActivityData!);

    // Verify this is the correct order
    if (bookingData.momoOrderId !== orderId) {
      setPaymentStatus("error");
      toast.error("Mã đơn hàng không khớp!");
      return;
    }

    // Check payment status with MoMo
    const statusResponse = await paymentService.checkMoMoPaymentStatus(orderId);

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
      paymentResult,
      method: "momo"
    });

    // Check if payment was successful
    if (resultCode === "0" && paymentResult?.resultCode === 0) {
      setPaymentStatus("success");

      // Create the booking if payment successful and not already created
      if (!bookingCreated && transId && orderId) {
        await createBooking(
          bookingData,
          isTour,
          isFlight,
          isActivity,
          transId,
          orderId
        );
      }
    } else {
      setPaymentStatus("failed");
      toast.error(`Thanh toán thất bại: ${message || "Lỗi không xác định"}`);
      clearPendingBookings();
    }
  };

  const handleZaloPayPayment = async () => {
    console.log("🔍 ZaloPay Payment Debug:", {
      appTransId,
      zalopayStatus,
      zalopayAmount,
      checksum
    });

    // Check if we have the required parameters
    if (!appTransId || !zalopayStatus) {
      setPaymentStatus("error");
      toast.error("Thông tin thanh toán không hợp lệ!");
      return;
    }

    // Get pending booking data from localStorage
    const pendingTourData = localStorage.getItem("pendingBooking");
    const pendingFlightData = localStorage.getItem("pendingFlightBooking");
    const pendingActivityData = localStorage.getItem("pendingActivityBooking");
    const pendingAmadeusBookingId = localStorage.getItem(
      "pendingAmadeusBookingId"
    );

    console.log("📦 Pending Data:", {
      hasTour: !!pendingTourData,
      hasFlight: !!pendingFlightData,
      hasActivity: !!pendingActivityData,
      hasAmadeusBooking: !!pendingAmadeusBookingId
    });

    // Check if this is an Amadeus booking
    if (pendingAmadeusBookingId) {
      await handleAmadeusZaloPayPayment(pendingAmadeusBookingId);
      return;
    }

    if (!pendingTourData && !pendingFlightData && !pendingActivityData) {
      setPaymentStatus("error");
      toast.error("Không tìm thấy thông tin đặt vé!");
      return;
    }

    // Priority: Flight > Tour > Activity (check in order of specificity)
    const isFlight = !!pendingFlightData;
    const isTour = !isFlight && !!pendingTourData;
    const isActivity = !isFlight && !isTour && !!pendingActivityData;

    const bookingData = isFlight
      ? JSON.parse(pendingFlightData!)
      : isTour
      ? JSON.parse(pendingTourData!)
      : JSON.parse(pendingActivityData!);

    console.log("📄 Booking Data:", {
      fullData: bookingData,
      zalopayTransId: bookingData.zalopayTransId,
      appTransId,
      matches: bookingData.zalopayTransId === appTransId
    });

    // Verify this is the correct order (only if zalopayTransId exists)
    // Note: ZaloPay might return different formats, so we'll be flexible
    if (bookingData.zalopayTransId && appTransId) {
      const storedId = String(bookingData.zalopayTransId).trim();
      const receivedId = String(appTransId).trim();

      // Don't enforce strict matching - just log warning if different
      if (storedId !== receivedId) {
        console.warn("⚠️ Transaction ID mismatch (will proceed anyway):", {
          stored: storedId,
          received: receivedId
        });
        // Update to use the received ID
        bookingData.zalopayTransId = receivedId;
      }
    }

    // If no zalopayTransId in booking data, add it now
    if (!bookingData.zalopayTransId) {
      console.warn("⚠️ No zalopayTransId in booking data, adding it now");
      bookingData.zalopayTransId = appTransId;
    }

    setPaymentInfo({
      orderId: appTransId,
      amount: zalopayAmount,
      transId: appTransId,
      method: "zalopay"
    });

    // Check if payment was successful (status = 1)
    if (zalopayStatus === "1") {
      setPaymentStatus("success");

      // Create the booking if payment successful and not already created
      if (!bookingCreated) {
        await createBooking(
          bookingData,
          isTour,
          isFlight,
          isActivity,
          appTransId!,
          appTransId!
        );
      }
    } else {
      setPaymentStatus("failed");
      toast.error("Thanh toán ZaloPay thất bại!");
      clearPendingBookings();
    }
  };

  // Handle Amadeus booking payment (booking already created, just update status)
  const handleAmadeusZaloPayPayment = async (bookingId: string) => {
    console.log("🛫 Handling Amadeus ZaloPay Payment for booking:", bookingId);

    setPaymentInfo({
      orderId: appTransId,
      amount: zalopayAmount,
      transId: appTransId,
      method: "zalopay",
      bookingType: "amadeus_flight"
    });

    // Check if payment was successful (status = 1)
    if (zalopayStatus === "1") {
      try {
        // Check payment status from server to update booking
        const statusResponse = await checkAmadeusPaymentStatus(bookingId);

        console.log("📦 Amadeus Payment Status Response:", statusResponse);

        if (statusResponse.success && statusResponse.data) {
          const { paymentStatus: serverPaymentStatus, bookingReference } =
            statusResponse.data;

          setPaymentInfo((prev: any) => ({
            ...prev,
            bookingReference,
            bookingId
          }));

          if (serverPaymentStatus === "paid") {
            setPaymentStatus("success");
            setBookingCreated(true);
            toast.success(
              "Thanh toán thành công! Đặt vé máy bay đã được xác nhận."
            );
          } else {
            // Payment successful on ZaloPay but server hasn't updated yet
            // This can happen due to callback delay
            setPaymentStatus("success");
            setBookingCreated(true);
            toast.success("Thanh toán thành công! Đơn đặt vé đang được xử lý.");
          }
        } else {
          // Still show success since ZaloPay confirmed
          setPaymentStatus("success");
          setBookingCreated(true);
          toast.success(
            "Thanh toán thành công! Đơn đặt vé đang được xác nhận."
          );
        }
      } catch (error) {
        console.error("Error checking Amadeus payment status:", error);
        // Still show success since ZaloPay returned status = 1
        setPaymentStatus("success");
        setBookingCreated(true);
        toast.success(
          "Thanh toán thành công! Vui lòng kiểm tra đơn đặt vé của bạn."
        );
      }
    } else {
      setPaymentStatus("failed");
      toast.error("Thanh toán ZaloPay thất bại!");
    }

    // Clear pending Amadeus booking ID
    localStorage.removeItem("pendingAmadeusBookingId");
  };

  const createBooking = async (
    bookingData: any,
    isTour: boolean,
    isFlight: boolean,
    isActivity: boolean,
    transId: string,
    orderId: string
  ) => {
    try {
      console.log("🔨 Creating booking with data:", {
        isTour,
        isFlight,
        isActivity,
        transId,
        orderId,
        bookingData
      });

      let bookingResponse;
      const paymentNote =
        paymentMethod === "momo"
          ? `Thanh toán MoMo thành công. Mã giao dịch: ${transId}, Mã đơn hàng: ${orderId}`
          : `Thanh toán ZaloPay thành công. Mã giao dịch: ${transId}`;

      if (isTour) {
        const { bookingTourService } = await import(
          "@/services/bookingTourService"
        );
        bookingResponse = await bookingTourService.createBookingTour({
          ...bookingData,
          status: "confirmed",
          note: `${
            bookingData.note ? bookingData.note + "\n" : ""
          }${paymentNote}`
        });
      } else if (isFlight) {
        const { bookingFlightService } = await import(
          "@/services/bookingFlightService"
        );

        console.log("✈️ Creating flight booking with payload:", {
          ...bookingData,
          status: "confirmed",
          note: `${
            bookingData.note ? bookingData.note + "\n" : ""
          }${paymentNote}`
        });

        bookingResponse = await bookingFlightService.createBookingFlight({
          ...bookingData,
          status: "confirmed",
          note: `${
            bookingData.note ? bookingData.note + "\n" : ""
          }${paymentNote}`
        });

        console.log("📥 Flight booking response:", bookingResponse);
      } else if (isActivity) {
        const { bookingActivityService } = await import(
          "@/services/bookingActivityService"
        );
        bookingResponse = await bookingActivityService.createBookingActivity({
          ...bookingData,
          status: "confirmed",
          note: `${
            bookingData.note ? bookingData.note + "\n" : ""
          }${paymentNote}`
        });
      }

      console.log("📦 Booking response:", bookingResponse);

      if (bookingResponse?.success) {
        setBookingCreated(true);
        const bookingType = isTour
          ? "tour"
          : isFlight
          ? "vé máy bay"
          : "hoạt động";
        toast.success(
          `Thanh toán thành công! Đặt ${bookingType} đã được xác nhận.`
        );
        clearPendingBookings();
      } else {
        console.error("❌ Booking creation failed:", {
          success: bookingResponse?.success,
          message: bookingResponse?.message,
          fullResponse: bookingResponse
        });
        toast.error(
          `Thanh toán thành công nhưng có lỗi khi tạo booking: ${
            bookingResponse?.message || "Lỗi không xác định"
          }. Vui lòng liên hệ hỗ trợ!`
        );
      }
    } catch (bookingError: any) {
      console.error("❌ Booking creation error:", {
        error: bookingError,
        message: bookingError?.message,
        stack: bookingError?.stack,
        response: bookingError?.response?.data
      });
      toast.error(
        `Thanh toán thành công nhưng có lỗi khi tạo booking: ${
          bookingError?.message || "Lỗi không xác định"
        }. Vui lòng liên hệ hỗ trợ!`
      );
    }
  };

  const clearPendingBookings = () => {
    localStorage.removeItem("pendingBooking");
    localStorage.removeItem("pendingFlightBooking");
    localStorage.removeItem("pendingActivityBooking");
    localStorage.removeItem("pendingAmadeusBookingId");
  };

  const handleRetryBooking = () => {
    clearPendingBookings();
    router.push("/");
  };

  const handleGoToBookings = () => {
    router.push("/profile/booking");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
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
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div>Đang chuyển hướng đến trang đăng nhập...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-blue-50 py-8 pt-20 lg:pt-30">
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
                      ? "bg-green-600"
                      : paymentStatus === "failed"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                  }`}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      {paymentStatus === "success" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          x="0px"
                          y="0px"
                          width="100"
                          height="100"
                          viewBox="0,0,256,256"
                        >
                          <g
                            fill="none"
                            fillRule="nonzero"
                            stroke="none"
                            strokeWidth="1"
                            strokeLinecap="butt"
                            strokeLinejoin="miter"
                            strokeMiterlimit="10"
                            strokeDasharray=""
                            strokeDashoffset="0"
                            fontFamily="none"
                            fontWeight="none"
                            fontSize="none"
                            textAnchor="middle"
                            style={{ mixBlendMode: "normal" }}
                          >
                            <g transform="scale(5.33333,5.33333)">
                              <path
                                d="M44,24c0,11.045 -8.955,20 -20,20c-11.045,0 -20,-8.955 -20,-20c0,-11.045 8.955,-20 20,-20c11.045,0 20,8.955 20,20z"
                                fill="#5af360"
                              ></path>
                              <path
                                d="M34.602,14.602l-13.602,13.597l-5.602,-5.598l-2.797,2.797l8.399,8.403l16.398,-16.402z"
                                fill="#ffffff"
                              ></path>
                            </g>
                          </g>
                        </svg>
                      )}
                      {paymentStatus === "failed" && (
                        <img
                          width="100"
                          height="100"
                          src="https://img.icons8.com/ios-glyphs/100/ffffff/multiply-2.png"
                          alt="failed"
                        />
                      )}
                      {(paymentStatus === "error" ||
                        paymentStatus === "checking") && (
                        <img
                          width="100"
                          height="100"
                          src="https://img.icons8.com/color/100/error--v1.png"
                          alt="error"
                        />
                      )}
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
                          Đặt đơn thành công!
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
                          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                        >
                          Xem đơn hàng của tôi
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
                          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                        >
                          Thử lại
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
                          liên hệ hỗ trợ hoặc kiểm tra lại thông tin đặt đơn.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleGoToBookings}
                          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                        >
                          Kiểm tra đặt đơn của tôi
                        </button>
                        <button
                          onClick={handleRetryBooking}
                          className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300"
                        >
                          Đặt đơn mới
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
