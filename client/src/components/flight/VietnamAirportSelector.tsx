"use client";

import { useState, useEffect, useRef } from "react";
import { airportService, AmadeusAirport } from "@/services/airportService";

// Vietnam airports from local JSON for faster initial load
const vietnamAirports = [
  { iata: "SGN", name: "Tân Sơn Nhất", city: "Hồ Chí Minh" },
  { iata: "HAN", name: "Nội Bài", city: "Hà Nội" },
  { iata: "DAD", name: "Đà Nẵng", city: "Đà Nẵng" },
  { iata: "CXR", name: "Cam Ranh", city: "Nha Trang" },
  { iata: "PQC", name: "Phú Quốc", city: "Phú Quốc" },
  { iata: "DLI", name: "Liên Khương", city: "Đà Lạt" },
  { iata: "VCA", name: "Cần Thơ", city: "Cần Thơ" },
  { iata: "HPH", name: "Cát Bi", city: "Hải Phòng" },
  { iata: "HUI", name: "Phú Bài", city: "Huế" },
  { iata: "VII", name: "Vinh", city: "Vinh" },
  { iata: "UIH", name: "Phù Cát", city: "Quy Nhơn" },
  { iata: "VDH", name: "Đồng Hới", city: "Đồng Hới" },
  { iata: "THD", name: "Thọ Xuân", city: "Thanh Hóa" },
  { iata: "VCS", name: "Côn Đảo", city: "Côn Đảo" },
  { iata: "BMV", name: "Buôn Ma Thuột", city: "Buôn Ma Thuột" },
  { iata: "TBB", name: "Tuy Hòa", city: "Phú Yên" },
  { iata: "PXU", name: "Pleiku", city: "Gia Lai" },
  { iata: "VKG", name: "Rạch Giá", city: "Kiên Giang" },
  { iata: "CAH", name: "Cà Mau", city: "Cà Mau" },
  { iata: "DIN", name: "Điện Biên Phủ", city: "Điện Biên" }
];

interface Props {
  value: string;
  onChange: (iataCode: string, name: string) => void;
  placeholder?: string;
  label?: string;
  excludeCode?: string; // Exclude this code from suggestions (e.g., if selecting arrival, exclude departure)
  useAmadeusSearch?: boolean;
  className?: string;
}

export default function VietnamAirportSelector({
  value,
  onChange,
  placeholder = "Chọn sân bay",
  label,
  excludeCode,
  useAmadeusSearch = false,
  className = ""
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [amadeusResults, setAmadeusResults] = useState<AmadeusAirport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<{
    iata: string;
    name: string;
    city: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize selected airport from value
  useEffect(() => {
    if (value) {
      const found = vietnamAirports.find((a) => a.iata === value.toUpperCase());
      if (found) {
        setSelectedAirport(found);
      }
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Amadeus API when typing
  useEffect(() => {
    if (!useAmadeusSearch || !searchQuery.trim() || searchQuery.length < 2) {
      setAmadeusResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await airportService.searchAmadeusAirports(
          searchQuery,
          "VN"
        );
        setAmadeusResults(results);
      } catch (err) {
        console.error("Error searching airports:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, useAmadeusSearch]);

  // Filter local airports based on search query
  const filteredLocalAirports = vietnamAirports.filter((airport) => {
    if (excludeCode && airport.iata === excludeCode) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      airport.iata.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query)
    );
  });

  // Combine and dedupe results
  const displayAirports =
    useAmadeusSearch && amadeusResults.length > 0
      ? amadeusResults.map((a) => ({
          iata: a.iataCode,
          name: a.name,
          city: a.address?.cityName || a.iataCode
        }))
      : filteredLocalAirports;

  const handleSelect = (airport: {
    iata: string;
    name: string;
    city: string;
  }) => {
    setSelectedAirport(airport);
    onChange(airport.iata, `${airport.city} (${airport.iata})`);
    setIsOpen(false);
    setSearchQuery("");
  };

  const displayValue = selectedAirport
    ? `${selectedAirport.city} (${selectedAirport.iata})`
    : "";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Selected Value Display / Input */}
      <div
        className="relative flex items-center rounded-xl border border-gray-300 bg-white cursor-pointer hover:border-sky-500 transition-colors"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <span className="pl-4 pr-2 py-3 text-sky-600">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </span>
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 py-3 pr-4 outline-none text-base"
          />
        ) : (
          <span
            className={`flex-1 py-3 pr-4 text-base ${
              displayValue ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {displayValue || placeholder}
          </span>
        )}
        {/* Clear button */}
        {selectedAirport && !isOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAirport(null);
              onChange("", "");
            }}
            className="absolute right-3 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600"></div>
            </div>
          ) : displayAirports.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              {searchQuery ? "Không tìm thấy sân bay" : "Nhập để tìm kiếm"}
            </div>
          ) : (
            <>
              {/* Popular header if no search */}
              {!searchQuery && (
                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sân bay phổ biến
                </div>
              )}
              {displayAirports.map((airport, idx) => (
                <button
                  key={`${airport.iata}-${idx}`}
                  onClick={() => handleSelect(airport)}
                  className={`
                    w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-sky-50 transition-colors
                    ${selectedAirport?.iata === airport.iata ? "bg-sky-50" : ""}
                  `}
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm">
                    {airport.iata}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {airport.city}
                    </div>
                    <div className="text-sm text-gray-500">{airport.name}</div>
                  </div>
                  {selectedAirport?.iata === airport.iata && (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
