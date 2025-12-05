"use client";

import { useState, useEffect } from "react";
import { airportService, CheapestDate } from "@/services/airportService";
import {
  format,
  parseISO,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths
} from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
  origin: string;
  destination: string;
  onSelectDate?: (date: string) => void;
  selectedDate?: string;
}

interface DayPrice {
  date: string;
  price: number;
  isLowest?: boolean;
}

export default function CheapestDatesCalendar({
  origin,
  destination,
  onSelectDate,
  selectedDate
}: Props) {
  const [cheapestDates, setCheapestDates] = useState<CheapestDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchCheapestDates = async () => {
      if (
        !origin ||
        !destination ||
        origin.length < 3 ||
        destination.length < 3
      )
        return;

      setLoading(true);
      setError(null);

      try {
        const result = await airportService.getCheapestFlightDates({
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          currency: "VND"
        });

        if (result.data && result.data.length > 0) {
          setCheapestDates(result.data);
        } else {
          setCheapestDates([]);
        }
      } catch (err) {
        console.error("Error fetching cheapest dates:", err);
        setError("Không thể tải thông tin giá");
      } finally {
        setLoading(false);
      }
    };

    fetchCheapestDates();
  }, [origin, destination]);

  // Convert cheapest dates to price map
  const priceMap = new Map<string, number>();
  let lowestPrice = Infinity;
  let lowestDate = "";

  cheapestDates.forEach((item) => {
    const price = parseFloat(item.price.total);
    priceMap.set(item.departureDate, price);
    if (price < lowestPrice) {
      lowestPrice = price;
      lowestDate = item.departureDate;
    }
  });

  // Get days in current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    return (price / 1000).toFixed(0) + "K";
  };

  const getPriceColor = (price: number) => {
    if (price === lowestPrice) return "bg-green-500 text-white";
    const ratio = (price - lowestPrice) / (lowestPrice * 0.5);
    if (ratio < 0.2) return "bg-green-100 text-green-800";
    if (ratio < 0.5) return "bg-yellow-100 text-yellow-800";
    return "bg-orange-100 text-orange-800";
  };

  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  if (!origin || !destination || origin.length < 3 || destination.length < 3)
    return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-sky-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Ngày bay giá rẻ {origin} → {destination}
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      ) : error ? (
        <p className="text-red-500 text-center py-4">{error}</p>
      ) : cheapestDates.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          Không có dữ liệu giá cho tuyến này
        </p>
      ) : (
        <>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h4 className="text-base font-semibold text-gray-700">
              {format(currentMonth, "MMMM yyyy", { locale: vi })}
            </h4>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16" />
            ))}

            {/* Days with prices */}
            {daysInMonth.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const price = priceMap.get(dateStr);
              const isSelected = selectedDate === dateStr;
              const isLowest = dateStr === lowestDate;
              const isPast = day < new Date();

              return (
                <button
                  key={dateStr}
                  onClick={() => price && !isPast && onSelectDate?.(dateStr)}
                  disabled={!price || isPast}
                  className={`
                    h-16 rounded-lg flex flex-col items-center justify-center text-xs transition-all
                    ${isPast ? "opacity-40 cursor-not-allowed" : ""}
                    ${isSelected ? "ring-2 ring-sky-600" : ""}
                    ${
                      price && !isPast
                        ? "cursor-pointer hover:shadow-md"
                        : "cursor-default"
                    }
                    ${price ? getPriceColor(price) : "bg-gray-50 text-gray-400"}
                  `}
                >
                  <span
                    className={`font-medium ${
                      isSelected ? "text-sky-600" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {price && (
                    <span className="text-[10px] mt-0.5 font-bold">
                      {formatPrice(price)}đ
                    </span>
                  )}
                  {isLowest && !isPast && (
                    <span className="text-[8px] mt-0.5">⭐</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Giá thấp nhất</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100"></div>
              <span>Giá tốt</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-100"></div>
              <span>Giá trung bình</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-100"></div>
              <span>Giá cao</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
