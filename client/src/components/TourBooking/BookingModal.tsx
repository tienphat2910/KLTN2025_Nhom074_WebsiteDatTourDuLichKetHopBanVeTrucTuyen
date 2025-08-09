"use client";

import { useState } from "react";
import { Tour } from "@/services/tourService";

interface BookingModalProps {
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
  participants: {
    adult: number;
    child: number;
    infant: number;
  };
  totalPrice: number;
}

interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  notes: string;
}

export default function BookingModal({
  tour,
  isOpen,
  onClose,
  participants,
  totalPrice
}: BookingModalProps) {
  const [step, setStep] = useState(1); // 1: Customer Info, 2: Payment
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: "",
    email: "",
    phone: "",
    notes: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinueToPayment = () => {
    // Validate customer info
    if (!customerInfo.fullName || !customerInfo.email || !customerInfo.phone) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    setStep(2);
  };

  const handleBookingSubmit = async () => {
    setIsProcessing(true);

    // Mock booking submission
    setTimeout(() => {
      const bookingId = `LT${Date.now()}`;

      // Store booking data in localStorage (mock)
      const bookingData = {
        id: bookingId,
        tour: {
          id: tour._id,
          title: tour.title,
          slug: tour.slug
        },
        customerInfo,
        participants,
        totalPrice,
        paymentMethod,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(`booking_${bookingId}`, JSON.stringify(bookingData));

      setIsProcessing(false);

      // Redirect to booking confirmation
      window.location.href = `/booking/confirmation/${bookingId}`;
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {step === 1 ? "Thông tin đặt tour" : "Thanh toán"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-1 mx-2 ${
                step >= 2 ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            // Step 1: Customer Information
            <div className="space-y-6">
              {/* Tour summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {tour.title}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>📍 Khởi hành từ: {tour.departureLocation?.name}</div>
                  <div>⏰ Thời gian: {tour.duration || "Đang cập nhật"}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                    <span>
                      {participants.adult} người lớn, {participants.child} trẻ
                      em, {participants.infant} em bé
                    </span>
                    <span className="font-bold text-blue-600">
                      {totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Thông tin liên hệ
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerInfo.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                      placeholder="0123 456 789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500 resize-none"
                    placeholder="Yêu cầu đặc biệt, ghi chú thêm..."
                  />
                </div>
              </div>

              {/* Continue button */}
              <button
                onClick={handleContinueToPayment}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Tiếp tục thanh toán
              </button>
            </div>
          ) : (
            // Step 2: Payment
            <div className="space-y-6">
              {/* Order summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Tóm tắt đơn hàng
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Tour: {tour.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Khách hàng: {customerInfo.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Số lượng khách:{" "}
                      {participants.adult +
                        participants.child +
                        participants.infant}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                    <span>Tổng tiền:</span>
                    <span className="text-green-600">
                      {totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Phương thức thanh toán
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    <input
                      type="radio"
                      name="payment"
                      value="bank_transfer"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        Chuyển khoản ngân hàng
                      </div>
                      <div className="text-sm text-gray-600">
                        Chuyển khoản qua tài khoản ngân hàng
                      </div>
                    </div>
                    <div className="text-blue-600">🏦</div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    <input
                      type="radio"
                      name="payment"
                      value="momo"
                      checked={paymentMethod === "momo"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">Ví MoMo</div>
                      <div className="text-sm text-gray-600">
                        Thanh toán qua ví điện tử MoMo
                      </div>
                    </div>
                    <div className="text-pink-600">📱</div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    <input
                      type="radio"
                      name="payment"
                      value="vnpay"
                      checked={paymentMethod === "vnpay"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">VNPay</div>
                      <div className="text-sm text-gray-600">
                        Thanh toán qua VNPay
                      </div>
                    </div>
                    <div className="text-blue-600">💳</div>
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all duration-300"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleBookingSubmit}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {isProcessing ? "Đang xử lý..." : "Xác nhận đặt tour"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
