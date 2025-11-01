"use client";

import { Discount } from "@/types/discount";
import { Luggage, Shield, Armchair } from "lucide-react";

interface FlightPriceSummaryProps {
  adults: number;
  children: number;
  infants: number;
  baseTicketPrice: number;
  returnBaseTicketPrice?: number;
  isRoundTrip?: boolean;
  extraBaggage: number;
  insurance: boolean;
  prioritySeat: boolean;
  // Round trip add-ons
  outboundExtraBaggage?: number;
  outboundInsurance?: boolean;
  outboundSelectedSeats?: string[];
  returnExtraBaggage?: number;
  returnInsurance?: boolean;
  returnSelectedSeats?: string[];
  // One-way selected seats
  selectedSeats?: string[];
  EXTRA_BAGGAGE_PRICE: number;
  INSURANCE_PRICE: number;
  PRIORITY_SEAT_PRICE: number;
  appliedDiscount: Discount | null;
  calculateDiscountAmount: (subtotal: number) => number;
  getSeatPrice?: (seat: string) => number; // Add getSeatPrice function
}

export default function FlightPriceSummary({
  adults,
  children,
  infants,
  baseTicketPrice,
  returnBaseTicketPrice = 0,
  isRoundTrip = false,
  extraBaggage,
  insurance,
  prioritySeat,
  outboundExtraBaggage = 0,
  outboundInsurance = false,
  outboundSelectedSeats = [],
  returnExtraBaggage = 0,
  returnInsurance = false,
  returnSelectedSeats = [],
  selectedSeats = [],
  EXTRA_BAGGAGE_PRICE,
  INSURANCE_PRICE,
  PRIORITY_SEAT_PRICE,
  appliedDiscount,
  calculateDiscountAmount,
  getSeatPrice
}: FlightPriceSummaryProps) {
  // Default getSeatPrice function if not provided
  const calculateSeatPrice =
    getSeatPrice ||
    ((seat: string): number => {
      const rowNum = parseInt(seat.match(/\d+/)?.[0] || "0");
      const seatLetter = seat.match(/[A-Z]+/)?.[0] || "";

      if ([1, 12, 13].includes(rowNum)) return 300000;
      if (rowNum <= 5) return 200000;
      if (["A", "F", "K"].includes(seatLetter)) return 150000;
      if (["C", "D", "H", "J"].includes(seatLetter)) return 120000;
      return 100000;
    });
  const adultsPrice = baseTicketPrice;
  const childrenPrice = baseTicketPrice * 0.9;
  const infantsPrice = baseTicketPrice * 0.1;

  const outboundAdultsTotal = adults * adultsPrice;
  const outboundChildrenTotal = children * childrenPrice;
  const outboundInfantsTotal = infants * infantsPrice;
  const outboundFlightPrice =
    outboundAdultsTotal + outboundChildrenTotal + outboundInfantsTotal;

  // Calculate return flight prices if round trip
  let returnFlightPrice = 0;
  let returnAdultsTotal = 0;
  let returnChildrenTotal = 0;
  let returnInfantsTotal = 0;

  if (isRoundTrip && returnBaseTicketPrice > 0) {
    const returnAdultsPrice = returnBaseTicketPrice;
    const returnChildrenPrice = returnBaseTicketPrice * 0.9;
    const returnInfantsPrice = returnBaseTicketPrice * 0.1;

    returnAdultsTotal = adults * returnAdultsPrice;
    returnChildrenTotal = children * returnChildrenPrice;
    returnInfantsTotal = infants * returnInfantsPrice;
    returnFlightPrice =
      returnAdultsTotal + returnChildrenTotal + returnInfantsTotal;
  }

  const totalFlightPrice = outboundFlightPrice + returnFlightPrice;

  const numTickets = adults + children + infants;

  // Calculate add-ons based on trip type
  let baggageTotal = 0;
  let insuranceTotal = 0;
  let seatTotal = 0;

  if (isRoundTrip) {
    // For round trip, use separate values for each leg
    baggageTotal =
      (outboundExtraBaggage + returnExtraBaggage) * EXTRA_BAGGAGE_PRICE;
    insuranceTotal =
      outboundInsurance || returnInsurance ? numTickets * INSURANCE_PRICE : 0;
    seatTotal = [
      ...(outboundSelectedSeats || []),
      ...(returnSelectedSeats || [])
    ].reduce((total, seat) => total + calculateSeatPrice(seat), 0);
  } else {
    // For one-way, use the single values
    baggageTotal = extraBaggage * EXTRA_BAGGAGE_PRICE;
    insuranceTotal = insurance ? numTickets * INSURANCE_PRICE : 0;
    seatTotal = (selectedSeats || []).reduce(
      (total, seat) => total + calculateSeatPrice(seat),
      0
    );
  }

  const prioritySeatTotal = prioritySeat ? numTickets * PRIORITY_SEAT_PRICE : 0;
  const addOnsTotal =
    baggageTotal + insuranceTotal + prioritySeatTotal + seatTotal;

  const subtotal = totalFlightPrice + addOnsTotal;
  const discountAmount = calculateDiscountAmount(subtotal);
  const finalTotal = subtotal - discountAmount;

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-6 rounded-lg border border-sky-200 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Chi tiết giá</h2>

      {/* Flight Tickets */}
      <div className="space-y-3 mb-4">
        <h3 className="font-medium text-gray-700 text-sm">
          {isRoundTrip ? "Vé máy bay - Chuyến đi" : "Vé máy bay"}
        </h3>
        {adults > 0 && (
          <div className="flex justify-between text-sm">
            <span>
              Người lớn ({adults} x {adultsPrice.toLocaleString("vi-VN")} đ)
            </span>
            <span className="font-medium">
              {outboundAdultsTotal.toLocaleString("vi-VN")} đ
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
              {outboundChildrenTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
        {infants > 0 && (
          <div className="flex justify-between text-sm">
            <span>
              Em bé ({infants} x {infantsPrice.toLocaleString("vi-VN")} đ - 10%)
            </span>
            <span className="font-medium">
              {outboundInfantsTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        )}
      </div>

      {/* Return Flight Tickets - Only for Round Trip */}
      {isRoundTrip && returnFlightPrice > 0 && (
        <div className="space-y-3 mb-4 border-t border-sky-200 pt-4">
          <h3 className="font-medium text-gray-700 text-sm">
            Vé máy bay - Chuyến về
          </h3>
          {adults > 0 && (
            <div className="flex justify-between text-sm">
              <span>
                Người lớn ({adults} x{" "}
                {returnBaseTicketPrice.toLocaleString("vi-VN")} đ)
              </span>
              <span className="font-medium">
                {returnAdultsTotal.toLocaleString("vi-VN")} đ
              </span>
            </div>
          )}
          {children > 0 && (
            <div className="flex justify-between text-sm">
              <span>
                Trẻ em ({children} x{" "}
                {(returnBaseTicketPrice * 0.9).toLocaleString("vi-VN")} đ - 90%)
              </span>
              <span className="font-medium">
                {returnChildrenTotal.toLocaleString("vi-VN")} đ
              </span>
            </div>
          )}
          {infants > 0 && (
            <div className="flex justify-between text-sm">
              <span>
                Em bé ({infants} x{" "}
                {(returnBaseTicketPrice * 0.1).toLocaleString("vi-VN")} đ - 10%)
              </span>
              <span className="font-medium">
                {returnInfantsTotal.toLocaleString("vi-VN")} đ
              </span>
            </div>
          )}
        </div>
      )}

      {/* Add-ons */}
      {addOnsTotal > 0 && (
        <div className="space-y-3 mb-4 border-t border-sky-200 pt-4">
          <h3 className="font-medium text-gray-700 text-sm">Dịch vụ bổ sung</h3>

          {/* Baggage - Show separately for round trip */}
          {isRoundTrip ? (
            <>
              {outboundExtraBaggage > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-1">
                    <Luggage className="w-4 h-4" />
                    Hành lý thêm - Chuyến đi ({outboundExtraBaggage} kiện)
                  </span>
                  <span className="font-medium">
                    {(
                      outboundExtraBaggage * EXTRA_BAGGAGE_PRICE
                    ).toLocaleString("vi-VN")}{" "}
                    đ
                  </span>
                </div>
              )}
              {returnExtraBaggage > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-1">
                    <Luggage className="w-4 h-4" />
                    Hành lý thêm - Chuyến về ({returnExtraBaggage} kiện)
                  </span>
                  <span className="font-medium">
                    {(returnExtraBaggage * EXTRA_BAGGAGE_PRICE).toLocaleString(
                      "vi-VN"
                    )}{" "}
                    đ
                  </span>
                </div>
              )}
            </>
          ) : (
            extraBaggage > 0 && (
              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-1">
                  <Luggage className="w-4 h-4" />
                  Hành lý thêm ({extraBaggage} kiện)
                </span>
                <span className="font-medium">
                  {baggageTotal.toLocaleString("vi-VN")} đ
                </span>
              </div>
            )
          )}

          {/* Insurance - Show separately for round trip */}
          {isRoundTrip ? (
            <>
              {outboundInsurance && (
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Bảo hiểm - Chuyến đi ({numTickets} người)
                  </span>
                  <span className="font-medium">
                    {(numTickets * INSURANCE_PRICE).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              )}
              {returnInsurance && (
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Bảo hiểm - Chuyến về ({numTickets} người)
                  </span>
                  <span className="font-medium">
                    {(numTickets * INSURANCE_PRICE).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              )}
            </>
          ) : (
            insurance && (
              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Bảo hiểm ({numTickets} người)
                </span>
                <span className="font-medium">
                  {insuranceTotal.toLocaleString("vi-VN")} đ
                </span>
              </div>
            )
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

          {/* Selected Seats - Show with prices */}
          {isRoundTrip ? (
            <>
              {outboundSelectedSeats && outboundSelectedSeats.length > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-1">
                    <Armchair className="w-4 h-4" />
                    Ghế đã chọn - Chuyến đi: {outboundSelectedSeats.join(", ")}
                  </span>
                  <span className="font-medium">
                    {outboundSelectedSeats
                      .reduce(
                        (total, seat) => total + calculateSeatPrice(seat),
                        0
                      )
                      .toLocaleString("vi-VN")}{" "}
                    đ
                  </span>
                </div>
              )}
              {returnSelectedSeats && returnSelectedSeats.length > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-1">
                    <Armchair className="w-4 h-4" />
                    Ghế đã chọn - Chuyến về: {returnSelectedSeats.join(", ")}
                  </span>
                  <span className="font-medium">
                    {returnSelectedSeats
                      .reduce(
                        (total, seat) => total + calculateSeatPrice(seat),
                        0
                      )
                      .toLocaleString("vi-VN")}{" "}
                    đ
                  </span>
                </div>
              )}
            </>
          ) : (
            selectedSeats &&
            selectedSeats.length > 0 && (
              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-1">
                  <Armchair className="w-4 h-4" />
                  Ghế đã chọn: {selectedSeats.join(", ")}
                </span>
                <span className="font-medium">
                  {selectedSeats
                    .reduce(
                      (total, seat) => total + calculateSeatPrice(seat),
                      0
                    )
                    .toLocaleString("vi-VN")}{" "}
                  đ
                </span>
              </div>
            )
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
