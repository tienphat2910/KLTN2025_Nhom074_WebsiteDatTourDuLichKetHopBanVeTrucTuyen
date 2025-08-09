"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";

interface BookingData {
  id: string;
  tour: {
    id: string;
    title: string;
    slug: string;
  };
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    notes: string;
  };
  participants: {
    adult: number;
    child: number;
    infant: number;
  };
  totalPrice: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock loading booking data from localStorage
    setTimeout(() => {
      const bookingData = localStorage.getItem(`booking_${bookingId}`);
      if (bookingData) {
        setBooking(JSON.parse(bookingData));
      }
      setIsLoading(false);
    }, 1000);
  }, [bookingId]);

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Chuyển khoản ngân hàng";
      case "momo":
        return "Ví MoMo";
      case "vnpay":
        return "VNPay";
      default:
        return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Đang tải thông tin đặt tour..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Không tìm thấy thông tin đặt tour
          </h1>
          <p className="text-gray-600 mb-8">
            Mã đặt tour không tồn tại hoặc đã bị xóa.
          </p>
          <Link
            href="/tours"
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 inline-block"
          >
            ← Xem tour khác
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
      <Header />

      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Success message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Đặt tour thành công!
          </h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã đặt tour. Chúng tôi sẽ liên hệ với bạn sớm nhất để xác
            nhận.
          </p>
        </div>

        {/* Booking details */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Thông tin đặt tour
                  </h2>
                  <p className="text-green-100">Mã đặt tour: {booking.id}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {getStatusText(booking.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Tour information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Thông tin tour
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800">
                    {booking.tour.title}
                  </h4>
                  <div className="mt-2 text-sm text-gray-600">
                    <div>
                      Ngày đặt:{" "}
                      {new Date(booking.createdAt).toLocaleString("vi-VN")}
                    </div>
                    <div className="mt-1">
                      Số lượng khách: {booking.participants.adult} người lớn,{" "}
                      {booking.participants.child} trẻ em,{" "}
                      {booking.participants.infant} em bé
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Thông tin khách hàng
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Họ và tên:</span>
                      <div className="font-medium text-gray-800">
                        {booking.customerInfo.fullName}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <div className="font-medium text-gray-800">
                        {booking.customerInfo.email}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">
                        Số điện thoại:
                      </span>
                      <div className="font-medium text-gray-800">
                        {booking.customerInfo.phone}
                      </div>
                    </div>
                  </div>
                </div>
                {booking.customerInfo.notes && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-600">Ghi chú:</span>
                    <div className="font-medium text-gray-800">
                      {booking.customerInfo.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Thông tin thanh toán
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">
                        Phương thức thanh toán
                      </div>
                      <div className="text-sm text-gray-600">
                        {getPaymentMethodName(booking.paymentMethod)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {booking.totalPrice.toLocaleString("vi-VN")}đ
                      </div>
                      <div className="text-sm text-gray-600">Tổng tiền</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment instructions */}
              {booking.paymentMethod === "bank_transfer" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    Hướng dẫn chuyển khoản
                  </h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>
                      🏦 <strong>Ngân hàng:</strong> Vietcombank
                    </div>
                    <div>
                      👤 <strong>Tên tài khoản:</strong> CÔNG TY LUTRIP
                    </div>
                    <div>
                      🔢 <strong>Số tài khoản:</strong> 0123456789
                    </div>
                    <div>
                      💰 <strong>Số tiền:</strong>{" "}
                      {booking.totalPrice.toLocaleString("vi-VN")}đ
                    </div>
                    <div>
                      📝 <strong>Nội dung:</strong> {booking.id}{" "}
                      {booking.customerInfo.fullName}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Link
                  href={`/tours/detail/${booking.tour.slug}`}
                  className="flex-1 bg-gray-200 text-gray-700 text-center font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300"
                >
                  Xem lại tour
                </Link>
                <Link
                  href="/tours"
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white text-center font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Đặt tour khác
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Contact information */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Cần hỗ trợ?
            </h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a href="tel:081820319" className="hover:text-blue-600">
                  Hotline: 081 820 319
                </a>
              </div>
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:info@lutrip.com"
                  className="hover:text-blue-600"
                >
                  Email: info@lutrip.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
