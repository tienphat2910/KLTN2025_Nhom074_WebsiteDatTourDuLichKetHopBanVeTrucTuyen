"use client";

import { Discount } from "@/types/discount";

interface TourPriceSummaryProps {
  adults: number;
  children: number;
  infants: number;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  appliedDiscount: Discount | null;
  calculateDiscountAmount: (subtotal: number) => number;
}

export default function TourPriceSummary({
  adults,
  children,
  infants,
  adultPrice,
  childPrice,
  infantPrice,
  appliedDiscount,
  calculateDiscountAmount
}: TourPriceSummaryProps) {
  const adultsTotal = adults * adultPrice;
  const childrenTotal = children * childPrice;
  const infantsTotal = infants * infantPrice;
  const subtotal = adultsTotal + childrenTotal + infantsTotal;
  const discountAmount = calculateDiscountAmount(subtotal);
  const finalTotal = subtotal - discountAmount;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-800 mb-3">Chi tiết đặt tour</h3>
      <div className="space-y-2 text-sm text-black">
        {adults > 0 && (
          <div className="flex justify-between">
            <span>
              Người lớn ({adults} x {adultPrice.toLocaleString("vi-VN")} đ)
            </span>
            <span className="font-medium">
              {adultsTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        {children > 0 && (
          <div className="flex justify-between">
            <span>
              Trẻ em ({children} x {childPrice.toLocaleString("vi-VN")} đ)
            </span>
            <span className="font-medium">
              {childrenTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        {infants > 0 && (
          <div className="flex justify-between">
            <span>
              Em bé ({infants} x {infantPrice.toLocaleString("vi-VN")} đ)
            </span>
            <span className="font-medium">
              {infantsTotal.toLocaleString("vi-VN")} đ
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
      </div>
    </div>
  );
}
