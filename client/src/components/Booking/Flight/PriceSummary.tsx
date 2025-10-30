"use client";

import { Discount } from "@/types/discount";
import { Luggage, Shield, Armchair } from "lucide-react";

interface FlightPriceSummaryProps {
  adults: number;
  children: number;
  infants: number;
  baseTicketPrice: number;
  extraBaggage: number;
  insurance: boolean;
  prioritySeat: boolean;
  EXTRA_BAGGAGE_PRICE: number;
  INSURANCE_PRICE: number;
  PRIORITY_SEAT_PRICE: number;
  appliedDiscount: Discount | null;
  calculateDiscountAmount: (subtotal: number) => number;
}

export default function FlightPriceSummary({
  adults,
  children,
  infants,
  baseTicketPrice,
  extraBaggage,
  insurance,
  prioritySeat,
  EXTRA_BAGGAGE_PRICE,
  INSURANCE_PRICE,
  PRIORITY_SEAT_PRICE,
  appliedDiscount,
  calculateDiscountAmount
}: FlightPriceSummaryProps) {
  const adultsPrice = baseTicketPrice;
  const childrenPrice = baseTicketPrice * 0.9;
  const infantsPrice = baseTicketPrice * 0.1;

  const adultsTotal = adults * adultsPrice;
  const childrenTotal = children * childrenPrice;
  const infantsTotal = infants * infantsPrice;
  const totalFlightPrice = adultsTotal + childrenTotal + infantsTotal;

  const numTickets = adults + children + infants;
  const baggageTotal = extraBaggage * EXTRA_BAGGAGE_PRICE;
  const insuranceTotal = insurance ? numTickets * INSURANCE_PRICE : 0;
  const prioritySeatTotal = prioritySeat ? numTickets * PRIORITY_SEAT_PRICE : 0;
  const addOnsTotal = baggageTotal + insuranceTotal + prioritySeatTotal;

  const subtotal = totalFlightPrice + addOnsTotal;
  const discountAmount = calculateDiscountAmount(subtotal);
  const finalTotal = subtotal - discountAmount;

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-6 rounded-lg border border-sky-200 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Chi tiết giá</h2>

      {/* Flight Tickets */}
      <div className="space-y-3 mb-4">
        <h3 className="font-medium text-gray-700 text-sm">Vé máy bay</h3>
        {adults > 0 && (
          <div className="flex justify-between text-sm">
            <span>
              Người lớn ({adults} x {adultsPrice.toLocaleString("vi-VN")} đ)
            </span>
            <span className="font-medium">
              {adultsTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        {children > 0 && (
          <div className="flex justify-between text-sm">
            <span>
              Trẻ em ({children} x {childrenPrice.toLocaleString("vi-VN")} đ -
              90%)
            </span>
            <span className="font-medium">
              {childrenTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        {infants > 0 && (
          <div className="flex justify-between text-sm">
            <span>
              Em bé ({infants} x {infantsPrice.toLocaleString("vi-VN")} đ - 10%)
            </span>
            <span className="font-medium">
              {infantsTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
      </div>

      {/* Add-ons */}
      {addOnsTotal > 0 && (
        <div className="space-y-3 mb-4 border-t border-sky-200 pt-4">
          <h3 className="font-medium text-gray-700 text-sm">Dịch vụ bổ sung</h3>
          {extraBaggage > 0 && (
            <div className="flex justify-between text-sm items-center">
              <span className="flex items-center gap-1">
                <Luggage className="w-4 h-4" />
                Hành lý thêm ({extraBaggage} kiện)
              </span>
              <span className="font-medium">
                {baggageTotal.toLocaleString("vi-VN")} đ
              </span>
            </div>
          )}
          {insurance && (
            <div className="flex justify-between text-sm items-center">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Bảo hiểm ({numTickets} người)
              </span>
              <span className="font-medium">
                {insuranceTotal.toLocaleString("vi-VN")} đ
              </span>
            </div>
          )}
          {prioritySeat && (
            <div className="flex justify-between text-sm items-center">
              <span className="flex items-center gap-1">
                <Armchair className="w-4 h-4" />
                Chỗ ngồi ưu tiên ({numTickets} người)
              </span>
              <span className="font-medium">
                {prioritySeatTotal.toLocaleString("vi-VN")} đ
              </span>
            </div>
          )}
        </div>
      )}

      {/* Totals */}
      <div className="border-t border-sky-200 pt-3 space-y-2">
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

        <div className="flex justify-between text-lg font-bold text-sky-600 border-t border-sky-200 pt-2">
          <span>Tổng tiền:</span>
          <span>{finalTotal.toLocaleString("vi-VN")} đ</span>
        </div>
      </div>
    </div>
  );
}
