"use client";

import { Wallet, Building2 } from "lucide-react";

interface PaymentMethodProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  showCash?: boolean; // Flight không dùng tiền mặt
}

export default function PaymentMethod({
  paymentMethod,
  setPaymentMethod,
  showCash = true
}: PaymentMethodProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Hình thức thanh toán *
      </label>
      <div
        className={`grid grid-cols-1 md:grid-cols-${
          showCash ? "4" : "3"
        } gap-4`}
      >
        {showCash && (
          <div
            onClick={() => setPaymentMethod("cash")}
            className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
              paymentMethod === "cash"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Wallet className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-medium">Tiền mặt</div>
                <div className="text-xs text-gray-500">Thanh toán khi nhận</div>
              </div>
            </div>
          </div>
        )}

        <div
          onClick={() => setPaymentMethod("momo")}
          className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
            paymentMethod === "momo"
              ? "border-orange-500 bg-orange-50"
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
              ? "border-orange-500 bg-orange-50"
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
              ? "border-orange-500 bg-orange-50"
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
  );
}
