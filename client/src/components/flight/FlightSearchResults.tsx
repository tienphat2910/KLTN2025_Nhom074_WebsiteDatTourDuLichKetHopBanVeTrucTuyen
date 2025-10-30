"use client";

import { useState } from "react";
import { Flight } from "@/services/flightService";
import Link from "next/link";
import { Plane } from "lucide-react";

interface SearchParams {
  from: string;
  to: string;
  date: string;
  passengers: number;
  seatClass: string;
}

interface Props {
  results: Flight[];
  loading: boolean;
  error: string | null;
  searchParams: SearchParams;
}

export default function FlightSearchResults({
  results,
  loading,
  error,
  searchParams
}: Props) {
  const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">(
    "price"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(5000000);
  const [selectedStops, setSelectedStops] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort results
  const filteredResults = results
    .filter((flight) => {
      // Airline filter
      if (
        selectedAirlines.length > 0 &&
        !selectedAirlines.includes(flight.airlineId._id)
      ) {
        return false;
      }

      // Price filter
      const cheapestClass = flight.classes?.sort(
        (a, b) => a.price - b.price
      )[0];
      if (cheapestClass && cheapestClass.price > maxPrice) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case "price":
          const aCheapest =
            a.classes?.sort((c, d) => c.price - d.price)[0]?.price || 0;
          const bCheapest =
            b.classes?.sort((c, d) => c.price - d.price)[0]?.price || 0;
          aValue = aCheapest;
          bValue = bCheapest;
          break;
        case "duration":
          aValue = a.durationMinutes;
          bValue = b.durationMinutes;
          break;
        case "departure":
          aValue = new Date(
            a.schedule?.departureDate || a.departureTime
          ).getTime();
          bValue = new Date(
            b.schedule?.departureDate || b.departureTime
          ).getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      {/* Search Summary */}
      <div className="mb-6 px-4 md:px-0">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
          Kết quả tìm kiếm chuyến bay
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          {searchParams.from} → {searchParams.to} •{" "}
          {formatDate(searchParams.date)} • {searchParams.passengers} hành khách
        </p>
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
          className={`lg:w-80 lg:flex-shrink-0 ${
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
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="sort"
                      value={option.value}
                      checked={sortBy === option.value}
                      onChange={(e) =>
                        setSortBy(e.target.value as typeof sortBy)
                      }
                      className="mr-2"
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
                {Array.from(new Set(results.map((f) => f.airlineId._id)))
                  .map((airlineId) => {
                    const airline = results.find(
                      (f) => f.airlineId._id === airlineId
                    )?.airlineId;
                    return airline;
                  })
                  .filter(Boolean)
                  .map((airline) => (
                    <label key={airline!._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAirlines.includes(airline!._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAirlines([
                              ...selectedAirlines,
                              airline!._id
                            ]);
                          } else {
                            setSelectedAirlines(
                              selectedAirlines.filter(
                                (id) => id !== airline!._id
                              )
                            );
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{airline!.name}</span>
                    </label>
                  ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">
                Giá tối đa: {new Intl.NumberFormat("vi-VN").format(maxPrice)}đ
              </h4>
              <input
                type="range"
                min="500000"
                max="10000000"
                step="100000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {filteredResults.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-700 mb-4">
                Không tìm thấy chuyến bay phù hợp
              </p>
              <p className="text-gray-600">
                Vui lòng thử lại với tiêu chí khác hoặc liên hệ hotline để được
                hỗ trợ.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((flight, index) => {
                const cheapestClass = flight.classes?.sort(
                  (a, b) => a.price - b.price
                )[0];
                const selectedClass =
                  flight.classes?.find((c) =>
                    c.className.toLowerCase().includes(searchParams.seatClass)
                  ) || cheapestClass;

                return (
                  <div
                    key={`${flight._id}-${index}`}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-4 md:p-6">
                      {/* Header with airline and price */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              flight.airlineId.logo ||
                              "/images/logo-placeholder.png"
                            }
                            alt={flight.airlineId.name}
                            className="w-8 h-8 object-contain"
                          />
                          <div>
                            <h3 className="font-bold text-gray-800">
                              {flight.airlineId.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {flight.flightCode}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xl md:text-2xl font-bold text-sky-600">
                            {selectedClass
                              ? new Intl.NumberFormat("vi-VN").format(
                                  selectedClass.price
                                )
                              : "N/A"}
                            đ
                          </div>
                          <div className="text-sm text-gray-500">
                            {selectedClass?.className || "Economy"}
                          </div>
                        </div>
                      </div>

                      {/* Flight times and route */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                        {/* Departure */}
                        <div className="text-center md:text-left">
                          <div className="text-lg font-bold text-gray-800">
                            {formatTime(
                              flight.schedule?.departureDate ||
                                flight.departureTime
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {flight.departureAirportId.iata}
                          </div>
                          <div className="text-xs text-gray-500">
                            {flight.departureAirportId.city}
                          </div>
                        </div>

                        {/* Flight duration and plane icon */}
                        <div className="flex-1 flex flex-col items-center px-4">
                          <div className="text-sm text-gray-500 mb-1">
                            {formatDuration(flight.durationMinutes)}
                          </div>
                          <div className="flex items-center justify-center w-full">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <div className="px-2">
                              <Plane className="w-5 h-5 text-sky-500" />
                            </div>
                            <div className="flex-1 border-t border-gray-300"></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Bay thẳng
                          </div>
                        </div>

                        {/* Arrival */}
                        <div className="text-center md:text-right">
                          <div className="text-lg font-bold text-gray-800">
                            {formatTime(
                              flight.schedule?.arrivalDate || flight.arrivalTime
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {flight.arrivalAirportId.iata}
                          </div>
                          <div className="text-xs text-gray-500">
                            {flight.arrivalAirportId.city}
                          </div>
                        </div>
                      </div>

                      {/* Footer with seats and buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          {selectedClass
                            ? `Còn ${selectedClass.availableSeats} ghế ${selectedClass.className}`
                            : flight.classes && flight.classes.length > 0
                            ? `Còn ${Math.min(
                                ...flight.classes.map((c) => c.availableSeats)
                              )} ghế`
                            : `${
                                flight.schedule?.remainingSeats ||
                                flight.availableSeats
                              } ghế trống`}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link
                            href={`/flights/detail/${flight._id}`}
                            className="px-4 py-2 border border-sky-500 text-sky-600 rounded-lg hover:bg-sky-50 transition-colors text-center"
                          >
                            Chi tiết
                          </Link>
                          <Link
                            href={`/bookingflight?flightId=${flight._id}&adults=${searchParams.passengers}&children=0&infants=0&seatClass=${searchParams.seatClass}`}
                            className="px-6 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all text-center"
                          >
                            Đặt vé
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
