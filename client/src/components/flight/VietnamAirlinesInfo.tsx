"use client";

import { useState, useEffect } from "react";
import { airportService, AmadeusAirline } from "@/services/airportService";

// Logo URLs for Vietnam airlines (can be replaced with actual logo files)
const airlineLogos: Record<string, string> = {
  VN: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Vietnam_Airlines_logo_with_text.svg/1280px-Vietnam_Airlines_logo_with_text.svg.png",
  VJ: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/VietJet_Air_logo.svg/1200px-VietJet_Air_logo.svg.png",
  QH: "https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Bamboo_Airways_logo.svg/1200px-Bamboo_Airways_logo.svg.png",
  BL: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Pacific_Airlines_logo.svg/220px-Pacific_Airlines_logo.svg.png",
  OV: "https://upload.wikimedia.org/wikipedia/vi/thumb/b/be/Vietravel_airlines_logo.png/250px-Vietravel_airlines_logo.png"
};

const airlineDescriptions: Record<string, string> = {
  VN: "Hãng hàng không quốc gia Việt Nam, thành viên SkyTeam",
  VJ: "Hãng hàng không giá rẻ lớn nhất Việt Nam",
  QH: "Hãng hàng không tư nhân với dịch vụ 5 sao",
  BL: "Hãng hàng không giá rẻ, thuộc Vietnam Airlines Group",
  OV: "Hãng hàng không du lịch Vietravel"
};

interface Props {
  onSelectAirline?: (airlineCode: string) => void;
  selectedAirline?: string;
  className?: string;
}

export default function VietnamAirlinesInfo({
  onSelectAirline,
  selectedAirline,
  className = ""
}: Props) {
  const [airlines, setAirlines] = useState<AmadeusAirline[]>([]);
  const [loading, setLoading] = useState(true);
  const [vietnamAirlineCodes, setVietnamAirlineCodes] = useState<string[]>([]);

  useEffect(() => {
    const fetchAirlines = async () => {
      setLoading(true);
      try {
        const result = await airportService.getVietnamAirlines();
        setAirlines(result.data);
        setVietnamAirlineCodes(result.vietnamAirlines);
      } catch (err) {
        console.error("Error fetching Vietnam airlines:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAirlines();
  }, []);

  // Fallback data if API fails
  const displayAirlines =
    airlines.length > 0
      ? airlines
      : ([
          { iataCode: "VN", businessName: "Vietnam Airlines" },
          { iataCode: "VJ", businessName: "VietJet Air" },
          { iataCode: "QH", businessName: "Bamboo Airways" },
          { iataCode: "BL", businessName: "Pacific Airlines" },
          { iataCode: "OV", businessName: "Vietravel Airlines" }
        ] as AmadeusAirline[]);

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <svg
          className="w-6 h-6 text-sky-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
        Các hãng hàng không Việt Nam
      </h3>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {displayAirlines.map((airline) => {
            const isSelected = selectedAirline === airline.iataCode;
            return (
              <button
                key={airline.iataCode}
                onClick={() => onSelectAirline?.(airline.iataCode)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200
                  hover:shadow-lg hover:-translate-y-1
                  ${
                    isSelected
                      ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200"
                      : "border-gray-200 hover:border-sky-300"
                  }
                `}
              >
                {/* Airline Logo */}
                <div className="h-12 flex items-center justify-center mb-2">
                  {airlineLogos[airline.iataCode] ? (
                    <img
                      src={airlineLogos[airline.iataCode]}
                      alt={airline.businessName}
                      className="max-h-10 max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-sky-600">
                      {airline.iataCode}
                    </span>
                  )}
                </div>

                {/* Airline Info */}
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {airline.businessName || airline.commonName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {airline.iataCode}
                  </p>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <svg
                      className="w-5 h-5 text-sky-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
                  {airlineDescriptions[airline.iataCode] ||
                    airline.businessName}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Click để lọc chuyến bay theo hãng
      </div>
    </div>
  );
}
