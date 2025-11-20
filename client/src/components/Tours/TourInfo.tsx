import { Tour } from "@/services/tourService";

interface TourInfoProps {
  tour: Tour;
  isVisible: boolean;
  checkTitleContainsDeparture?: (
    title: string | undefined,
    departureName: string | undefined
  ) => boolean;
}

export default function TourInfo({ tour, isVisible }: TourInfoProps) {
  return (
    <div
      className={`bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 transition-all duration-1000 delay-300 ${
        isVisible ? "animate-slide-up" : "opacity-0"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 md:mb-6">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4 break-words leading-tight">
            {tour?.title || "Đang tải..."}
          </h1>

          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
            <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
              <svg
                className="w-4 h-4 mr-1 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
              <span className="font-medium">Khởi hành từ:</span>
              <span className="ml-1 text-blue-700">
                {tour?.departureLocation?.name || "Đang cập nhật"}
              </span>
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Thời gian: {tour?.duration || "Đang cập nhật"}</span>
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {tour?.startDate && tour?.endDate ? (
                <>
                  {new Date(tour.startDate).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(tour.endDate).toLocaleDateString("vi-VN")}
                </>
              ) : (
                "Ngày khởi hành: Đang cập nhật"
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 md:mt-0 flex-shrink-0">
          {tour?.isFeatured && (
            <span className="inline-block bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-md text-xs font-medium">
              ⭐ Nổi bật
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 md:mb-3">
          Mô tả tour
        </h3>
        {/* Show warning if the title doesn't match the departure location */}
        {tour?.title && tour?.departureLocation && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <div className="flex items-start">
              <div className="text-yellow-600 mr-2">⚠️</div>
              <div>
                <h5 className="font-medium text-yellow-800">
                  Lưu ý về điểm khởi hành
                </h5>
                <p className="text-sm text-yellow-700">
                  Tour này sẽ khởi hành từ{" "}
                  <strong>{tour.departureLocation.name}</strong>. Vui lòng kiểm
                  tra thông tin chi tiết với nhân viên tư vấn.
                </p>
              </div>
            </div>
          </div>
        )}
        <p className="text-gray-600 leading-relaxed">
          {tour?.description || "Mô tả tour đang được cập nhật..."}
        </p>
      </div>

      {/* Availability */}
      <div className="mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 md:mb-3">
          Tình trạng chỗ
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-4">
            <span className="text-green-600 font-medium">
              Còn {tour?.availableSeats || 0} chỗ trống
            </span>
            <span className="text-gray-500">
              / {tour?.seats || 0} chỗ tối đa
            </span>
          </div>
          <div className="w-full sm:w-48">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    tour?.seats
                      ? ((tour.availableSeats || 0) / tour.seats) * 100
                      : 0
                  }%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
