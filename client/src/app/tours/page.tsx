"use client";

import { useState, useEffect, Fragment } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LoadingSpinner } from "@/components/Loading";
import { destinationService, Destination } from "@/services/destinationService";
import { tourService, Tour } from "@/services/tourService";
import { toast } from "sonner";

export default function Tours() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
      setIsVisible(true);
    }, 1500);

    // Load destinations for search
    destinationService.getDestinations({ limit: 100 }).then((res) => {
      if (res.success) setDestinations(res.data.destinations);
    });

    // Load tours from API with filter for departure dates from today onwards
    const today = new Date().toISOString().split("T")[0];
    tourService
      .getTours({ limit: 12, start: today, end: "2099-12-31" })
      .then((res) => {
        if (res.success) setTours(res.data.tours);
        setIsLoading(false);
        setIsVisible(true);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDestination) {
      toast.error("Vui lòng chọn địa điểm trước khi tìm kiếm!");
      return;
    }
    // Chuẩn hóa truyền ngày search
    let url = `/tours/${selectedDestination}`;
    const params: string[] = [];
    if (startDate) params.push(`start=${startDate}`);
    if (endDate) params.push(`end=${endDate}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    window.location.href = url;
  };

  // Xử lý đặt tour: chuyển sang trang chi tiết tour để đặt
  const handleBookTour = (slug: string) => {
    window.location.href = `/tours/detail/${slug}`;
  };

  // Helper function to calculate duration from startDate and endDate
  const calculateDuration = (
    startDate: string | undefined,
    endDate: string | undefined
  ) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 0) return null;
    const nights = days - 1;
    return `${days} ngày ${nights} đêm`;
  };

  const today = new Date().toISOString().split("T")[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100 flex items-center justify-center">
        <LoadingSpinner
          type="travel"
          size="xl"
          text="Đang tải danh sách tour..."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
      <Header />
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-[15s] ease-out"
            style={{
              backgroundImage: "url('/images/banner-tour.jpg')",
              filter: "brightness(0.4)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 via-teal-900/40 to-blue-900/50" />
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center transition-all duration-1000 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
              Tour Du Lịch{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Việt Nam
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 drop-shadow-lg">
              Khám phá vẻ đẹp thiên nhiên và văn hóa Việt Nam
            </p>
          </div>
          {/* Search Component */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-4 flex flex-col md:flex-row items-end justify-center gap-6 bg-white rounded-3xl shadow-lg px-4 md:px-8 py-6 w-full max-w-4xl"
            style={{ fontFamily: "inherit" }}
          >
            {/* Địa điểm */}
            <div className="flex flex-col flex-1 items-start w-full">
              <label className="font-bold text-gray-800 mb-1 text-sm">
                Bạn muốn đi đâu <span className="text-red-500">(*)</span>
              </label>
              <div className="relative w-full">
                <button
                  type="button"
                  className="w-full border border-gray-400 rounded-lg px-4 py-3 text-base font-semibold text-gray-800 bg-white text-left"
                  onClick={() => setShowDestinationDropdown((v) => !v)}
                >
                  {selectedDestination
                    ? destinations.find((d) => d.slug === selectedDestination)
                        ?.name
                    : "Chọn địa điểm"}
                </button>
                {showDestinationDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
                    {destinations.map((d) => (
                      <button
                        key={d._id}
                        type="button"
                        className="block w-full text-left px-4 py-3 text-gray-800 hover:bg-blue-50 text-base font-semibold"
                        onClick={() => {
                          setSelectedDestination(d.slug);
                          setShowDestinationDropdown(false);
                        }}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ngày khởi hành */}
            <div className="flex flex-col flex-1 items-start w-full">
              <label className="font-semibold text-gray-800 mb-1 text-sm">
                Ngày khởi hành
              </label>
              <div className="flex gap-2 w-full">
                <input
                  type="date"
                  className="flex-1 border border-gray-400 rounded-lg px-3 py-3 text-gray-800 bg-white text-base"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                />
                <span className="px-1 text-gray-600 flex items-center">-</span>
                <input
                  type="date"
                  className="flex-1 border border-gray-400 rounded-lg px-3 py-3 text-gray-800 bg-white text-base"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                />
              </div>
            </div>

            {/* Nút tìm kiếm */}
            <div className="self-stretch flex items-center mt-5 w-full md:w-auto">
              <button
                type="submit"
                className="flex items-center gap-2 bg-[#1664F6] text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all text-base whitespace-nowrap w-full md:w-auto justify-center"
                style={{ minWidth: 140 }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Tours Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour, index) => (
              <div
                key={tour._id}
                className={`card-surface rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 delay-${
                  index * 100
                } ${
                  isVisible ? "animate-slide-up" : "opacity-0"
                } border border-white/20`}
              >
                <div
                  className="h-48 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${
                      tour.images?.[0] || "/tour1.jpg"
                    }')`
                  }}
                ></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {tour.title}
                    </h3>
                    <div className="flex items-center">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm text-gray-600 ml-1">
                        {tour.rating}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">
                    📍 {tour.departureLocation?.name || "Đang cập nhật"}
                  </p>
                  <p className="text-gray-600 mb-4">
                    ⏰{" "}
                    {tour.duration
                      ? typeof tour.duration === "string"
                        ? tour.duration
                        : `${tour.duration} ngày`
                      : calculateDuration(tour.startDate, tour.endDate) ||
                        "Đang cập nhật"}
                  </p>
                  {/* Điểm nổi bật nếu có */}
                  {tour.category && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Thể loại:
                      </h4>
                      <span className="text-sm text-gray-600">
                        {tour.category}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        {tourService.formatPrice(
                          tourService.getDiscountedPrice(
                            tour.price,
                            tour.discount
                          )
                        )}
                      </span>
                      <span className="text-gray-500 text-sm">/người</span>
                    </div>
                    <button
                      className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      onClick={() => handleBookTour(tour.slug)}
                    >
                      Đặt Tour
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
