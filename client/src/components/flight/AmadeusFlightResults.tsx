"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MappedAmadeusFlight,
  AmadeusFlightOffer
} from "@/services/flightService";
import {
  Plane,
  Clock,
  Users,
  Luggage,
  Wifi,
  Coffee,
  Ticket
} from "lucide-react";

interface Props {
  flights: MappedAmadeusFlight[];
  loading: boolean;
  error: string | null;
  onFlightSelect?: (flight: MappedAmadeusFlight) => void;
  tripType?: "outbound" | "return";
  // Booking params
  adults?: number;
  children?: number;
  infants?: number;
  showBookingButton?: boolean;
}

export default function AmadeusFlightResults({
  flights,
  loading,
  error,
  onFlightSelect,
  tripType = "outbound",
  adults = 1,
  children = 0,
  infants = 0,
  showBookingButton = true
}: Props) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">(
    "price"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(50000000);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null);

  // Get unique airlines from flights
  const uniqueAirlines = Array.from(new Set(flights.map((f) => f.airlineCode)));

  // Filter and sort flights
  const filteredFlights = flights
    .filter((flight) => {
      // Airline filter
      if (
        selectedAirlines.length > 0 &&
        !selectedAirlines.includes(flight.airlineCode)
      ) {
        return false;
      }
      // Price filter
      if (flight.price > maxPrice) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "duration":
          // Parse duration like "2h 15m" to minutes
          const parseDuration = (d: string) => {
            const hMatch = d.match(/(\d+)h/);
            const mMatch = d.match(/(\d+)m/);
            return (
              (hMatch ? parseInt(hMatch[1]) * 60 : 0) +
              (mMatch ? parseInt(mMatch[1]) : 0)
            );
          };
          aValue = parseDuration(a.duration);
          bValue = parseDuration(b.duration);
          break;
        case "departure":
          aValue = parseInt(a.departure.time.replace(":", ""));
          bValue = parseInt(b.departure.time.replace(":", ""));
          break;
        default:
          return 0;
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

  const formatPrice = (price: number, currency: string = "VND") => {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
      }).format(price);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-xl text-sky-700">Đang tìm chuyến bay...</p>
          <p className="text-sm text-gray-500 mt-2">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <p className="text-gray-600">
          Vui lòng thử lại với thông tin tìm kiếm khác.
        </p>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <Plane className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-xl text-gray-700 mb-2">Không tìm thấy chuyến bay</p>
        <p className="text-gray-500">
          Vui lòng thử với ngày khác hoặc tuyến bay khác
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      {/* Info Banner - Amadeus Test Data Notice */}
      <div className="mb-4 bg-sky-50 border border-sky-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-sky-500 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm text-sky-800 font-medium">
              Tìm thấy <strong>{flights.length}</strong> chuyến bay từ{" "}
              <strong>{uniqueAirlines.length}</strong> hãng
            </p>
            <p className="text-xs text-sky-700 mt-1">
              Hãng bay:{" "}
              {uniqueAirlines
                .map((code) => {
                  const flight = flights.find((f) => f.airlineCode === code);
                  return flight?.airline || code;
                })
                .join(", ")}
            </p>
            {uniqueAirlines.length <= 2 && (
              <p className="text-xs text-amber-600 mt-2">
                💡 <strong>Tip:</strong> Thử các tuyến bay quốc tế (VD: SGN →
                BKK, HAN → SIN) để xem nhiều hãng hơn.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full bg-white rounded-lg shadow-md p-4 flex items-center justify-between hover:shadow-lg transition-shadow"
        >
          <span className="font-semibold text-gray-800">Bộ lọc và sắp xếp</span>
          <svg
            className={`w-5 h-5 transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div
          className={`lg:w-80 lg:shrink-0 ${
            showFilters ? "block" : "hidden lg:block"
          }`}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Bộ lọc</h3>

            {/* Sort Options */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Sắp xếp theo</h4>
              <div className="space-y-2">
                {[
                  { value: "price", label: "Giá thấp nhất" },
                  { value: "duration", label: "Thời gian bay" },
                  { value: "departure", label: "Giờ khởi hành" }
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="sort"
                      value={option.value}
                      checked={sortBy === option.value}
                      onChange={(e) =>
                        setSortBy(e.target.value as typeof sortBy)
                      }
                      className="mr-2 accent-sky-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Airlines Filter */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">
                Hãng hàng không
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uniqueAirlines.map((airlineCode) => {
                  const flight = flights.find(
                    (f) => f.airlineCode === airlineCode
                  );
                  return (
                    <label
                      key={airlineCode}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAirlines.includes(airlineCode)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAirlines([
                              ...selectedAirlines,
                              airlineCode
                            ]);
                          } else {
                            setSelectedAirlines(
                              selectedAirlines.filter(
                                (id) => id !== airlineCode
                              )
                            );
                          }
                        }}
                        className="mr-2 accent-sky-600"
                      />
                      <span className="text-sm">
                        {flight?.airline || airlineCode}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">
                Giá tối đa: {formatPrice(maxPrice)}
              </h4>
              <input
                type="range"
                min="500000"
                max="50000000"
                step="500000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              Hiển thị {filteredFlights.length} / {flights.length} chuyến bay
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 space-y-4">
          {filteredFlights.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-lg">
              <p className="text-xl text-gray-700 mb-4">
                Không tìm thấy chuyến bay phù hợp
              </p>
              <p className="text-gray-600">
                Vui lòng thử lại với tiêu chí khác
              </p>
            </div>
          ) : (
            filteredFlights.map((flight) => (
              <div
                key={flight.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Main Flight Card */}
                <div className="p-4 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Airline & Flight Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                        <Plane className="w-6 h-6 text-sky-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {flight.airline}
                        </p>
                        <p className="text-sm text-gray-500">
                          {flight.flightNumber}
                        </p>
                      </div>
                    </div>

                    {/* Flight Times */}
                    <div className="flex items-center gap-4 flex-1 justify-center">
                      {/* Departure */}
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">
                          {flight.departure.time}
                        </p>
                        <p className="text-sm text-gray-500">
                          {flight.departure.airport}
                        </p>
                      </div>

                      {/* Duration & Stops */}
                      <div className="flex-1 px-4 relative">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-sky-600"></div>
                          <div className="flex-1 h-0.5 bg-sky-300 mx-1 relative">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <Plane className="w-4 h-4 text-sky-600" />
                            </div>
                          </div>
                          <div className="w-3 h-3 rounded-full bg-sky-600"></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{flight.duration}</span>
                          <span
                            className={
                              flight.stopsCount === 0
                                ? "text-green-600"
                                : "text-orange-600"
                            }
                          >
                            {flight.stopsText}
                          </span>
                        </div>
                      </div>

                      {/* Arrival */}
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">
                          {flight.arrival.time}
                        </p>
                        <p className="text-sm text-gray-500">
                          {flight.arrival.airport}
                        </p>
                        {flight.departure.date !== flight.arrival.date && (
                          <span className="text-xs text-orange-600">
                            +1 ngày
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="text-center lg:text-right">
                      <p className="text-2xl font-bold text-sky-600">
                        {formatPrice(flight.price, flight.currency)}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">/người</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => onFlightSelect?.(flight)}
                          className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors w-full lg:w-auto"
                        >
                          Chọn
                        </button>
                        {showBookingButton && (
                          <button
                            onClick={() => {
                              // Navigate to booking page with flight data
                              const flightOfferParam = encodeURIComponent(
                                JSON.stringify(flight.raw)
                              );
                              router.push(
                                `/flight-booking?flightOffer=${flightOfferParam}&adults=${adults}&children=${children}&infants=${infants}`
                              );
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors w-full lg:w-auto flex items-center justify-center gap-1"
                          >
                            <Ticket className="w-4 h-4" />
                            Đặt vé
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{flight.duration}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{flight.availableSeats} ghế trống</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Luggage className="w-4 h-4" />
                      <span>{flight.class}</span>
                    </div>
                    {flight.baggage.checkin?.weight && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Luggage className="w-4 h-4" />
                        <span>
                          Hành lý: {flight.baggage.checkin.weight}
                          {flight.baggage.checkin.unit || "kg"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() =>
                      setExpandedFlight(
                        expandedFlight === flight.id ? null : flight.id
                      )
                    }
                    className="text-sky-600 text-sm mt-3 hover:underline"
                  >
                    {expandedFlight === flight.id
                      ? "Ẩn chi tiết"
                      : "Xem chi tiết"}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedFlight === flight.id && (
                  <div className="bg-gray-50 p-4 md:p-6 border-t border-gray-200">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Flight Details */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">
                          Thông tin chuyến bay
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-500">Máy bay:</span>{" "}
                            {flight.aircraft || "N/A"}
                          </p>
                          <p>
                            <span className="text-gray-500">Ngày bay:</span>{" "}
                            {formatDate(flight.departure.date)}
                          </p>
                          {flight.departure.terminal && (
                            <p>
                              <span className="text-gray-500">
                                Terminal đi:
                              </span>{" "}
                              {flight.departure.terminal}
                            </p>
                          )}
                          {flight.arrival.terminal && (
                            <p>
                              <span className="text-gray-500">
                                Terminal đến:
                              </span>{" "}
                              {flight.arrival.terminal}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Baggage */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">
                          Hành lý
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-500">Xách tay:</span>{" "}
                            {flight.baggage.handbag?.weight || 7}
                            {flight.baggage.handbag?.unit || "kg"}
                          </p>
                          <p>
                            <span className="text-gray-500">Ký gửi:</span>{" "}
                            {flight.baggage.checkin?.weight
                              ? `${flight.baggage.checkin.weight}${
                                  flight.baggage.checkin.unit || "kg"
                                }`
                              : flight.baggage.checkin?.pieces
                              ? `${flight.baggage.checkin.pieces} kiện`
                              : "Không bao gồm"}
                          </p>
                        </div>
                      </div>

                      {/* Policies */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">
                          Điều khoản
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p
                            className={
                              flight.policies.cancellable
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {flight.policies.cancellable
                              ? "✓ Có thể hủy"
                              : "✗ Không hoàn tiền"}
                          </p>
                          <p
                            className={
                              flight.policies.changeable
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {flight.policies.changeable
                              ? "✓ Có thể đổi lịch"
                              : "✗ Không đổi lịch"}
                          </p>
                          {flight.policies.refundable && (
                            <p className="text-gray-600">
                              {flight.policies.refundable}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
