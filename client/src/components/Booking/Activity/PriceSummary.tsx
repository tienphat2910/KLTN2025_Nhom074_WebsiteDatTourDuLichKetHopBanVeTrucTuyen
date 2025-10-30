"use client";

import { Discount } from "@/types/discount";

interface ActivityPriceSummaryProps {
  adults: number;
  children: number;
  babies: number;
  seniors: number;
  adultPrice: number;
  childPrice: number;
  babyPrice: number;
  seniorPrice: number;
  appliedDiscount: Discount | null;
  calculateDiscountAmount: (subtotal: number) => number;
}

export default function ActivityPriceSummary({
  adults,
  children,
  babies,
  seniors,
  adultPrice,
  childPrice,
  babyPrice,
  seniorPrice,
  appliedDiscount,
  calculateDiscountAmount
}: ActivityPriceSummaryProps) {
  const adultsTotal = adults * adultPrice;
  const childrenTotal = children * childPrice;
  const babiesTotal = babies * babyPrice;
  const seniorsTotal = seniors * seniorPrice;
  const subtotal = adultsTotal + childrenTotal + babiesTotal + seniorsTotal;
  const discountAmount = calculateDiscountAmount(subtotal);
  const finalTotal = subtotal - discountAmount;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Chi tiết giá</h2>

      <div className="space-y-3 mb-4">
        {adults > 0 && (
          <div className="flex justify-between text-sm">
            <span>
              Người lớn ({adults} x {adultPrice.toLocaleString("vi-VN")} đ)
            </span>
            <span className="font-medium">
              {adultsTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        {children > 0 && (
          <div className="flex justify-between text-sm">
            <span>
              Trẻ em ({children} x {childPrice.toLocaleString("vi-VN")} đ)
            </span>
            <span className="font-medium">
              {childrenTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        {babies > 0 && (
          <div className="flex justify-between text-sm">
            <span>
              Em bé ({babies} x {babyPrice.toLocaleString("vi-VN")} đ)
            </span>
            <span className="font-medium">
              {babiesTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        {seniors > 0 && (
          <div className="flex justify-between text-sm">
            <span>
              Người cao tuổi ({seniors} x {seniorPrice.toLocaleString("vi-VN")}{" "}
              đ)
            </span>
            <span className="font-medium">
              {seniorsTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-orange-200 pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Tạm tính:</span>
          <span className="font-medium">
            {subtotal.toLocaleString("vi-VN")} đ
          </span>
        </div>

        {appliedDiscount && discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Giảm giá ({appliedDiscount.code}):</span>
            <span className="font-medium">
              -{discountAmount.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold text-orange-600 border-t border-orange-200 pt-2">
          <span>Tổng tiền:</span>
          <span>{finalTotal.toLocaleString("vi-VN")} đ</span>
        </div>
      </div>
    </div>
  );
}
