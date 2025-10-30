"use client";

import { useState } from "react";
import { discountService } from "@/services/discountService";
import { Discount } from "@/types/discount";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface DiscountCodeProps {
  discountCode: string;
  setDiscountCode: (code: string) => void;
  appliedDiscount: Discount | null;
  setAppliedDiscount: (discount: Discount | null) => void;
}

export default function DiscountCode({
  discountCode,
  setDiscountCode,
  appliedDiscount,
  setAppliedDiscount
}: DiscountCodeProps) {
  const [applyingDiscount, setApplyingDiscount] = useState(false);

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

  return (
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
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
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
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">
                  Mã giảm giá: {appliedDiscount.code}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {appliedDiscount.discountType === "percentage"
                    ? `Giảm ${appliedDiscount.value}%`
                    : `Giảm ${appliedDiscount.value.toLocaleString("vi-VN")} đ`}
                </p>
                {appliedDiscount.description && (
                  <p className="text-sm text-green-700 mt-1">
                    {appliedDiscount.description}
                  </p>
                )}
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
  );
}
