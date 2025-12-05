"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import {
  amadeusBookingService,
  AmadeusBooking
} from "@/services/amadeusBookingService";
import {
  Plane,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  Luggage,
  Shield,
  Star,
  QrCode,
  Phone,
  Mail,
  User,
  BarChart3
} from "lucide-react";
import Barcode from "react-barcode";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
  expired: "bg-gray-100 text-gray-800 border-gray-300"
};

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
  expired: "Hết hạn"
};

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isAuthLoading } = useAuth();

  const [booking, setBooking] = useState<AmadeusBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const bookingId = params?.id as string;

  // Auth check
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập!");
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Load booking
  useEffect(() => {
    const loadBooking = async () => {
      if (!isAuthenticated || !bookingId) return;

      setLoading(true);
      try {
        const response = await amadeusBookingService.getAmadeusBookingById(
          bookingId
        );
        if (response.success && response.data) {
          setBooking(response.data);
        } else {
          toast.error("Không tìm thấy đơn đặt vé");
          router.push("/profile/booking");
        }
      } catch (error) {
        toast.error("Không thể tải thông tin đơn đặt vé");
        router.push("/profile/booking");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [isAuthenticated, bookingId, router]);

  // Cancel booking
  const handleCancel = async () => {
    if (!booking) return;

    if (!confirm("Bạn có chắc muốn hủy đơn đặt vé này?")) return;

    setCancelling(true);
    try {
      const response = await amadeusBookingService.cancelAmadeusBooking(
        booking._id,
        "Hủy bởi khách hàng"
      );

      if (response.success) {
        toast.success("Đã hủy đơn đặt vé thành công");
        setBooking((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      } else {
        toast.error(response.message || "Không thể hủy đơn đặt vé");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi hủy đơn đặt vé"
      );
    } finally {
      setCancelling(false);
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };

  // Format date
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading || isAuthLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-xl text-gray-600">Không tìm thấy đơn đặt vé</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const outboundSegments =
    booking.outboundFlight?.itineraries?.[0]?.segments || [];
  const firstSegment = outboundSegments[0];
  const lastSegment = outboundSegments[outboundSegments.length - 1];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => router.push("/profile/booking")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Quay lại danh sách
          </button>

          {/* Booking Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {booking.bookingReference}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      statusColors[booking.status]
                    }`}
                  >
                    {statusLabels[booking.status]}
                  </span>
                </div>
                <p className="text-gray-600">
                  Đặt ngày: {formatDateTime(booking.createdAt)}
                </p>
              </div>

              <div className="flex gap-3">
                {booking.status === "pending" && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancelling ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Hủy đơn"
                    )}
                  </button>
                )}
                {booking.qrCode && (
                  <a
                    href={booking.qrCode}
                    download={`booking-${booking.bookingReference}.png`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Download className="w-5 h-5 mr-1" />
                    Tải QR
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Flight Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Plane className="w-5 h-5 mr-2 text-blue-600" />
              Thông tin chuyến bay
              {booking.isRoundTrip && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  Khứ hồi
                </span>
              )}
            </h2>

            {/* Outbound Flight */}
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-700 mb-3">Chuyến đi</h3>

              {outboundSegments.map((segment, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col md:flex-row md:items-center gap-4 ${
                    idx > 0 ? "mt-4 pt-4 border-t" : ""
                  }`}
                >
                  {/* Flight Number */}
                  <div className="md:w-32">
                    <p className="font-semibold text-gray-900">
                      {segment.flightNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {segment.carrierCode}
                    </p>
                  </div>

                  {/* Route */}
                  <div className="flex-1 flex items-center gap-4">
                    {/* Departure */}
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">
                        {formatTime(segment.departure.at)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {segment.departure.iataCode}
                      </p>
                      {segment.departure.terminal && (
                        <p className="text-xs text-gray-500">
                          Terminal {segment.departure.terminal}
                        </p>
                      )}
                    </div>

                    {/* Duration Line */}
                    <div className="flex-1 px-4">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <div className="flex-1 h-0.5 bg-blue-300 mx-1" />
                        <Plane className="w-4 h-4 text-blue-600" />
                        <div className="flex-1 h-0.5 bg-blue-300 mx-1" />
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-1">
                        {segment.duration}
                      </p>
                    </div>

                    {/* Arrival */}
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">
                        {formatTime(segment.arrival.at)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {segment.arrival.iataCode}
                      </p>
                      {segment.arrival.terminal && (
                        <p className="text-xs text-gray-500">
                          Terminal {segment.arrival.terminal}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Class */}
                  <div className="md:w-24 text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {segment.cabin || "ECONOMY"}
                    </p>
                    {segment.class && (
                      <p className="text-xs text-gray-500">
                        Hạng {segment.class}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Date */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {firstSegment
                      ? formatDate(firstSegment.departure.at)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Return Flight (if round trip) */}
            {booking.isRoundTrip && booking.returnFlight && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">Chuyến về</h3>
                {booking.returnFlight.itineraries?.[0]?.segments?.map(
                  (segment, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col md:flex-row md:items-center gap-4 ${
                        idx > 0 ? "mt-4 pt-4 border-t" : ""
                      }`}
                    >
                      <div className="md:w-32">
                        <p className="font-semibold text-gray-900">
                          {segment.flightNumber}
                        </p>
                      </div>
                      <div className="flex-1 flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">
                            {formatTime(segment.departure.at)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {segment.departure.iataCode}
                          </p>
                        </div>
                        <div className="flex-1 px-4">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                            <div className="flex-1 h-0.5 bg-blue-300 mx-1" />
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">
                            {formatTime(segment.arrival.at)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {segment.arrival.iataCode}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Passengers */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Hành khách ({booking.passengers.length})
            </h2>

            <div className="space-y-3">
              {booking.passengers.map((passenger, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {passenger.lastName} {passenger.firstName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {passenger.type === "ADULT"
                          ? "Người lớn"
                          : passenger.type === "CHILD"
                          ? "Trẻ em"
                          : "Em bé"}{" "}
                        • {passenger.gender === "MALE" ? "Nam" : "Nữ"}
                      </p>
                    </div>
                  </div>
                  {passenger.selectedSeat?.seatNumber && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Ghế {passenger.selectedSeat.seatNumber}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-blue-600" />
              Thông tin liên hệ
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{booking.contactInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium">{booking.contactInfo.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Add-ons */}
          {(booking.addOns.extraBaggage > 0 ||
            booking.addOns.insurance ||
            booking.addOns.priorityBoarding) && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-blue-600" />
                Dịch vụ bổ sung
              </h2>

              <div className="space-y-2">
                {booking.addOns.extraBaggage > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Luggage className="w-5 h-5 text-orange-500 mr-2" />
                      <span>
                        Hành lý ký gửi thêm ({booking.addOns.extraBaggage} kiện)
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatPrice(booking.addOns.extraBaggagePrice)}
                    </span>
                  </div>
                )}
                {booking.addOns.insurance && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-green-500 mr-2" />
                      <span>Bảo hiểm du lịch</span>
                    </div>
                    <span className="font-medium">
                      {formatPrice(booking.addOns.insurancePrice)}
                    </span>
                  </div>
                )}
                {booking.addOns.priorityBoarding && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-500 mr-2" />
                      <span>Ưu tiên lên máy bay</span>
                    </div>
                    <span className="font-medium">
                      {formatPrice(booking.addOns.priorityBoardingPrice)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
              Chi tiết thanh toán
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Giá vé</span>
                <span>{formatPrice(booking.pricing.grandTotal)}</span>
              </div>

              {booking.seatSelections.length > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Phí chọn ghế</span>
                  <span>
                    {formatPrice(
                      booking.seatSelections.reduce(
                        (sum, s) => sum + s.seatPrice,
                        0
                      )
                    )}
                  </span>
                </div>
              )}

              {booking.addOns.extraBaggagePrice > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Hành lý thêm</span>
                  <span>{formatPrice(booking.addOns.extraBaggagePrice)}</span>
                </div>
              )}

              {booking.addOns.insurancePrice > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Bảo hiểm</span>
                  <span>{formatPrice(booking.addOns.insurancePrice)}</span>
                </div>
              )}

              {booking.addOns.priorityBoardingPrice > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Ưu tiên lên máy bay</span>
                  <span>
                    {formatPrice(booking.addOns.priorityBoardingPrice)}
                  </span>
                </div>
              )}

              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({booking.discountCode})</span>
                  <span>-{formatPrice(booking.discountAmount)}</span>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">
                    {formatPrice(booking.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <span>Phương thức: </span>
                <span className="ml-1 font-medium">
                  {booking.paymentMethod === "zalopay"
                    ? "ZaloPay"
                    : booking.paymentMethod === "momo"
                    ? "MoMo"
                    : booking.paymentMethod === "bank_transfer"
                    ? "Chuyển khoản"
                    : "Tiền mặt"}
                </span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    booking.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : booking.paymentStatus === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {booking.paymentStatus === "paid"
                    ? "Đã thanh toán"
                    : booking.paymentStatus === "pending"
                    ? "Chưa thanh toán"
                    : "Thất bại"}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code & Barcode */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code */}
              {booking.qrCode && (
                <div className="text-center">
                  <h2 className="text-lg font-semibold mb-4 flex items-center justify-center">
                    <QrCode className="w-5 h-5 mr-2 text-blue-600" />
                    Mã QR Check-in
                  </h2>
                  <img
                    src={booking.qrCode}
                    alt="QR Code"
                    className="w-40 h-40 mx-auto border rounded-lg"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Quét mã QR để xem thông tin vé
                  </p>
                </div>
              )}

              {/* Barcode */}
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-4 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Mã vạch đặt vé
                </h2>
                <div className="flex justify-center">
                  <Barcode
                    value={booking.bookingReference}
                    format="CODE128"
                    width={2}
                    height={60}
                    displayValue={true}
                    fontSize={14}
                    background="#ffffff"
                    lineColor="#000000"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Xuất trình mã vạch này khi làm thủ tục check-in
                </p>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-2">Yêu cầu đặc biệt</h2>
              <p className="text-gray-600">{booking.specialRequests}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
