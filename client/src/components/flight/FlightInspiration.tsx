"use client";

import { useState, useEffect } from "react";
import { airportService, FlightDestination } from "@/services/airportService";
import Image from "next/image";

// Map IATA code to city name and image
const cityInfo: Record<
  string,
  { name: string; country: string; image: string }
> = {
  // Vietnam
  SGN: {
    name: "Hồ Chí Minh",
    country: "Việt Nam",
    image: "/images/destinations/hcm.jpg"
  },
  HAN: {
    name: "Hà Nội",
    country: "Việt Nam",
    image: "/images/destinations/hanoi.jpg"
  },
  DAD: {
    name: "Đà Nẵng",
    country: "Việt Nam",
    image: "/images/destinations/danang.jpg"
  },
  CXR: {
    name: "Nha Trang",
    country: "Việt Nam",
    image: "/images/destinations/nhatrang.jpg"
  },
  PQC: {
    name: "Phú Quốc",
    country: "Việt Nam",
    image: "/images/destinations/phuquoc.jpg"
  },
  DLI: {
    name: "Đà Lạt",
    country: "Việt Nam",
    image: "/images/destinations/dalat.jpg"
  },
  HPH: {
    name: "Hải Phòng",
    country: "Việt Nam",
    image: "/images/destinations/haiphong.jpg"
  },
  HUI: {
    name: "Huế",
    country: "Việt Nam",
    image: "/images/destinations/hue.jpg"
  },
  VCA: {
    name: "Cần Thơ",
    country: "Việt Nam",
    image: "/images/destinations/cantho.jpg"
  },
  VII: {
    name: "Vinh",
    country: "Việt Nam",
    image: "/images/destinations/vinh.jpg"
  },
  // International
  BKK: {
    name: "Bangkok",
    country: "Thái Lan",
    image: "/images/destinations/bangkok.jpg"
  },
  SIN: {
    name: "Singapore",
    country: "Singapore",
    image: "/images/destinations/singapore.jpg"
  },
  HKG: {
    name: "Hong Kong",
    country: "Trung Quốc",
    image: "/images/destinations/hongkong.jpg"
  },
  TPE: {
    name: "Đài Bắc",
    country: "Đài Loan",
    image: "/images/destinations/taipei.jpg"
  },
  KUL: {
    name: "Kuala Lumpur",
    country: "Malaysia",
    image: "/images/destinations/kualalumpur.jpg"
  },
  NRT: {
    name: "Tokyo",
    country: "Nhật Bản",
    image: "/images/destinations/tokyo.jpg"
  },
  ICN: {
    name: "Seoul",
    country: "Hàn Quốc",
    image: "/images/destinations/seoul.jpg"
  },
  PNH: {
    name: "Phnom Penh",
    country: "Campuchia",
    image: "/images/destinations/phnompenh.jpg"
  },
  REP: {
    name: "Siem Reap",
    country: "Campuchia",
    image: "/images/destinations/siemreap.jpg"
  },
  VTE: {
    name: "Vientiane",
    country: "Lào",
    image: "/images/destinations/vientiane.jpg"
  }
};

// Default image for unknown destinations
const defaultImage =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop";

interface Props {
  origin: string;
  onSelectDestination?: (destination: string, departureDate: string) => void;
}

export default function FlightInspiration({
  origin,
  onSelectDestination
}: Props) {
  const [destinations, setDestinations] = useState<FlightDestination[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInspiration = async () => {
      if (!origin || origin.length < 3) return;

      setLoading(true);
      setError(null);

      try {
        const result = await airportService.getFlightInspiration({
          origin: origin.toUpperCase(),
          currency: "VND",
          nonStop: false
        });

        if (result.data && result.data.length > 0) {
          // Sort by price and take top 8
          const sorted = result.data
            .sort(
              (a, b) => parseFloat(a.price.total) - parseFloat(b.price.total)
            )
            .slice(0, 8);
          setDestinations(sorted);
        } else {
          setDestinations([]);
        }
      } catch (err) {
        console.error("Error fetching flight inspiration:", err);
        setError("Không thể tải gợi ý điểm đến");
      } finally {
        setLoading(false);
      }
    };

    fetchInspiration();
  }, [origin]);

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    return num.toLocaleString("vi-VN");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit"
    });
  };

  const getCityInfo = (iataCode: string) => {
    return (
      cityInfo[iataCode] || {
        name: iataCode,
        country: "Quốc tế",
        image: defaultImage
      }
    );
  };

  if (!origin || origin.length < 3) return null;

  if (loading) {
    return (
      <div className="mt-8 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          Đang tìm điểm đến giá tốt từ {origin}...
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-xl h-48 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || destinations.length === 0) return null;

  return (
    <div className="mt-8 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        Gợi ý điểm đến giá tốt từ {origin}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {destinations.map((dest, idx) => {
          const info = getCityInfo(dest.destination);
          return (
            <div
              key={`${dest.destination}-${idx}`}
              className="relative group rounded-xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() =>
                onSelectDestination?.(dest.destination, dest.departureDate)
              }
            >
              {/* Background Image */}
              <div className="relative h-48">
                <img
                  src={info.image}
                  alt={info.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultImage;
                  }}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h4 className="font-bold text-lg">{info.name}</h4>
                <p className="text-sm text-gray-200">{info.country}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-300">
                    {formatDate(dest.departureDate)}
                    {dest.returnDate && ` - ${formatDate(dest.returnDate)}`}
                  </span>
                  <span className="bg-sky-600 px-2 py-1 rounded-full text-sm font-bold">
                    {formatPrice(dest.price.total)}đ
                  </span>
                </div>
              </div>

              {/* Badge */}
              {idx === 0 && (
                <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Giá tốt nhất
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
