import { Tour } from "@/services/tourService";
import { Info } from "lucide-react";
import { useMemo } from "react";

interface ItineraryDay {
  title: string;
  description: string;
}

interface TourItineraryProps {
  tour: Tour;
  isVisible: boolean;
}

export default function TourItinerary({ tour, isVisible }: TourItineraryProps) {
  // Parse itinerary from new structure - memoized for performance
  const itineraryDays = useMemo((): ItineraryDay[] => {
    if (!tour?.itinerary) {
      return [];
    }

    const itinerary = tour.itinerary;

    // Handle object-based itinerary (new format)
    if (
      typeof itinerary === "object" &&
      !Array.isArray(itinerary) &&
      itinerary !== null
    ) {
      const days: ItineraryDay[] = [];

      // Get all keys and filter for day keys
      const allKeys = Object.keys(itinerary);

      // Find day keys (day1, day2, etc.)
      const dayKeys = allKeys.filter((key) => /^day\d+$/i.test(key));

      if (dayKeys.length === 0) {
        return [];
      }

      // Sort day keys by number
      const sortedDayKeys = dayKeys.sort((a, b) => {
        const numA = parseInt(a.replace(/day/i, "")) || 0;
        const numB = parseInt(b.replace(/day/i, "")) || 0;
        return numA - numB;
      });

      // Process each day
      sortedDayKeys.forEach((dayKey, index) => {
        const dayData = itinerary[dayKey];

        if (dayData && typeof dayData === "object") {
          // Extract title and description
          const title = dayData.title || `Ngày ${index + 1}`;
          const description = dayData.description || "";

          if (title && description) {
            days.push({ title, description });
          }
        }
      });

      return days;
    }

    // Handle array-based itinerary (legacy format)
    if (Array.isArray(itinerary)) {
      return itinerary.map(
        (item, index): ItineraryDay => ({
          title: `Ngày ${index + 1}`,
          description:
            typeof item === "string"
              ? item
              : item?.description || JSON.stringify(item)
        })
      );
    }

    return [];
  }, [tour?.itinerary]);

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg p-6 mb-8 transition-all duration-1000 delay-500 ${
        isVisible ? "animate-slide-up" : "opacity-0"
      }`}
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Lịch trình tour
      </h3>

      {itineraryDays.length > 0 ? (
        <div className="space-y-8">
          {itineraryDays.map((day, index) => (
            <div key={index} className="relative">
              {/* Timeline line */}
              {index !== itineraryDays.length - 1 && (
                <div className="absolute left-5 top-12 w-0.5 h-full bg-gradient-to-b from-blue-300 to-blue-100"></div>
              )}

              <div className="flex space-x-4">
                {/* Day number circle */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg relative z-10">
                  {index + 1}
                </div>

                <div className="flex-1 pb-4">
                  {/* Day title */}
                  <div className="mb-3">
                    <h4 className="text-lg font-bold text-gray-800 mb-1">
                      {day.title}
                    </h4>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
                  </div>

                  {/* Day description */}
                  <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border-l-4 border-blue-400 shadow-sm">
                    <div className="text-gray-700 leading-relaxed space-y-3">
                      {day.description
                        .split("\n")
                        .map((paragraph, paragraphIndex) => {
                          if (!paragraph.trim()) return null;

                          return (
                            <div key={paragraphIndex}>
                              {paragraph.trim().startsWith("Lựa chọn") ? (
                                <div className="font-semibold text-blue-700 bg-blue-100 px-3 py-2 rounded-lg mb-2 flex items-center gap-2">
                                  <Info className="w-4 h-4 flex-shrink-0" />
                                  <span>{paragraph.trim()}</span>
                                </div>
                              ) : paragraph.trim().includes(":") &&
                                paragraph.length < 100 ? (
                                <h5 className="font-semibold text-gray-800 mt-4 mb-2 flex items-center">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                  {paragraph.trim()}
                                </h5>
                              ) : (
                                <div className="text-gray-600 leading-relaxed">
                                  <p className="mb-2">{paragraph.trim()}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* Add detailed breakdown for complex activities */}
                    {day.description.includes("Lựa chọn") && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h6 className="font-semibold text-yellow-800 mb-2 flex items-center">
                          <span className="mr-2">⚡</span>
                          Hoạt động tùy chọn
                        </h6>
                        <p className="text-sm text-yellow-700">
                          Tour cung cấp nhiều lựa chọn hoạt động để bạn có thể
                          tùy chỉnh trải nghiệm theo sở thích. Chi phí cho các
                          hoạt động tự túc sẽ được hướng dẫn viên thông báo cụ
                          thể.
                        </p>
                      </div>
                    )}

                    {/* Time indicators */}
                    {(day.description.includes("sáng") ||
                      day.description.includes("chiều") ||
                      day.description.includes("tối")) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {day.description.includes("sáng") && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            🌅 Buổi sáng
                          </span>
                        )}
                        {day.description.includes("trưa") && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            ☀️ Buổi trưa
                          </span>
                        )}
                        {day.description.includes("chiều") && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            ☀️ Buổi chiều
                          </span>
                        )}
                        {day.description.includes("tối") && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            🌙 Buổi tối
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01"
              />
            </svg>
          </div>
          <h4 className="text-lg font-medium mb-2">
            Lịch trình đang được cập nhật
          </h4>
          <p className="text-sm">
            Thông tin chi tiết lịch trình tour sẽ được cập nhật sớm nhất.
          </p>
        </div>
      )}
    </div>
  );
}
