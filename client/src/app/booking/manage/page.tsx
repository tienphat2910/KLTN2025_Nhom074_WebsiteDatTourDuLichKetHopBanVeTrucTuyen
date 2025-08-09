"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  };
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function BookingManagePage() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [searchId, setSearchId] = useState("");

  useEffect(() => {
    // Load all bookings from localStorage
    const allBookings: BookingData[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("booking_")) {
        try {
          const booking = JSON.parse(localStorage.getItem(key) || "");
          allBookings.push(booking);
        } catch (e) {
          // Skip invalid data
        }
      }
    }
    // Sort by creation date (newest first)
    allBookings.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setBookings(allBookings);
  }, []);

  const filteredBookings = searchId
    ? bookings.filter((booking) =>
        booking.id.toLowerCase().includes(searchId.toLowerCase())
      )
    : bookings;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
      <Header />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Quản lý đặt tour
          </h1>

          {/* Search */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã đặt tour..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setSearchId("")}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          {/* Bookings list */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {searchId
                    ? "Không tìm thấy đặt tour nào"
                    : "Chưa có đặt tour nào"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchId
                    ? "Thử tìm kiếm với từ khóa khác"
                    : "Đặt tour đầu tiên của bạn ngay hôm nay!"}
                </p>
                {!searchId && (
                  <Link
                    href="/tours"
                    className="inline-block bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    Xem tours
                  </Link>
                )}
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {booking.tour.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Mã đặt tour: {booking.id}
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">
                          Khách hàng:
                        </span>
                        <div className="font-medium">
                          {booking.customerInfo.fullName}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Ngày đặt:</span>
                        <div className="font-medium">
                          {new Date(booking.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Tổng tiền:
                        </span>
                        <div className="font-medium text-green-600">
                          {booking.totalPrice.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        href={`/booking/confirmation/${booking.id}`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                      <Link
                        href={`/tours/detail/${booking.tour.slug}`}
                        className="flex-1 bg-gray-200 text-gray-700 text-center py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Xem tour
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
