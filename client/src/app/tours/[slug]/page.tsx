"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Fragment
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";
import { tourService, Tour } from "@/services/tourService";
import { destinationService, Destination } from "@/services/destinationService";
import { toast } from "sonner";
import { Star, MapPin, Calendar, Backpack } from "lucide-react";

// Define props interface for TourCard component
interface TourCardProps {
  tour: Tour;
  isVisible: boolean;
  index: number;
  destinationImage: string;
}

// Create a memoized TourCard component to prevent unnecessary re-renders
const TourCard = ({
  tour,
  isVisible,
  index,
  destinationImage
}: TourCardProps) => {
  const discountedPrice = useMemo(
    () => tourService.getDiscountedPrice(tour.price, tour.discount),
    [tour.price, tour.discount]
  );

  const availabilityPercentage = useMemo(
    () => (tour.availableSeats / tour.seats) * 100,
    [tour.availableSeats, tour.seats]
  );

  return (
    <div
      className={`card-surface rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } border border-white/20`}
      style={{
        transitionDelay: `${Math.min(index * 50, 300)}ms`,
        willChange: "transform, opacity"
      }}
    >
      <div className="relative h-48">
        <div className="w-full h-full bg-gray-200">
          {tour.images && tour.images[0] ? (
            <Image
              src={tour.images[0]}
              alt={tour.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              {...(index < 3 ? { priority: true } : { loading: "lazy" })}
            />
          ) : destinationImage ? (
            <Image
              src={destinationImage}
              alt="Destination"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        {tour.isFeatured && (
          <div className="absolute top-3 left-3 bg-yellow-500 text-yellow-900 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-900" />
            Nổi bật
          </div>
        )}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {tour.duration}
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
            {tour.title}
          </h3>
          {tour.rating && tour.rating > 0 && (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm text-gray-600 ml-1">{tour.rating}</span>
            </div>
          )}
        </div>

        <p className="text-gray-600 mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Khởi hành từ: {tour.departureLocation.name}
        </p>
        <p className="text-gray-600 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {new Date(tour.startDate).toLocaleDateString("vi-VN")} -{" "}
          {new Date(tour.endDate).toLocaleDateString("vi-VN")}
        </p>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Còn {tour.availableSeats} chỗ</span>
            <span>{tour.seats} chỗ tối đa</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${availabilityPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            {tour.discount > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {tourService.formatPrice(tour.price)}
              </span>
            )}
            <div className="text-2xl font-bold text-green-600">
              {tourService.formatPrice(discountedPrice)}
            </div>
            <span className="text-gray-500 text-sm">/người lớn</span>
            {tour.discount > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">
                -{tour.discount}%
              </span>
            )}
          </div>
          <Link
            href={`/tours/detail/${tour.slug}`}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

// Add sort options interface
interface SortOption {
  value: string;
  label: string;
}

const sortOptions: SortOption[] = [
  { value: "default", label: "Mặc định" },
  { value: "featured", label: "Nổi bật" },
  { value: "price-asc", label: "Giá: Thấp → Cao" },
  { value: "price-desc", label: "Giá: Cao → Thấp" },
  { value: "name-asc", label: "Tên: A → Z" },
  { value: "name-desc", label: "Tên: Z → A" },
  { value: "rating", label: "Đánh giá cao nhất" },
  { value: "newest", label: "Mới nhất" }
];

export default function ToursByDestinationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();

  const [tours, setTours] = useState<Tour[]>([]);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>("default");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>(slug);
  const [startDate, setStartDate] = useState<string>(""); // dùng cho API
  const [endDate, setEndDate] = useState<string>(""); // dùng cho API
  const [searchStartDate, setSearchStartDate] = useState<string>(""); // dùng cho input
  const [searchEndDate, setSearchEndDate] = useState<string>(""); // dùng cho input
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  // Use intersection observer for better scroll performance
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  // Setup intersection observer for lazy loading and animations
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleItems((prev) => new Set(prev).add(entry.target.id));
        }
      });
    };

    const obs = new IntersectionObserver(handleIntersect, options);
    setObserver(obs);

    return () => {
      if (obs) {
        obs.disconnect();
      }
    };
  }, []);

  // Khi mount, lấy ngày từ query để truyền vào API, đồng thời set cho input
  useEffect(() => {
    if (searchParams) {
      const start = searchParams.get("start") || "";
      const end = searchParams.get("end") || "";
      setStartDate(start);
      setEndDate(end);
      setSearchStartDate(start);
      setSearchEndDate(end);
    }
  }, [searchParams]);

  // Load tours data
  const today = new Date().toISOString().split("T")[0];

  const loadToursAndDestination = useCallback(async () => {
    try {
      setIsLoading(true); // Luôn set loading khi gọi API

      // Load destination info first
      const destResponse = await destinationService.getDestinationBySlug(slug);

      if (destResponse.success) {
        setDestination(destResponse.data);

        // Sửa dòng này: ép kiểu object truyền vào cho phép các trường động
        const toursResponse = await tourService.getTours({
          destination: destResponse.data._id,
          page: currentPage,
          limit: 9,
          start: startDate || today, // Always filter from today onwards
          ...(endDate ? { end: endDate } : {})
        } as any); // ép kiểu any để tránh lỗi TS

        if (toursResponse.success) {
          setTours(toursResponse.data.tours);
          setTotalPages(toursResponse.data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error("Error loading tours and destination:", error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [slug, currentPage, startDate, endDate, today]);

  useEffect(() => {
    if (slug) {
      loadToursAndDestination();
    }
  }, [loadToursAndDestination]);

  // Load destinations for search
  useEffect(() => {
    destinationService.getDestinations({ limit: 100 }).then((res) => {
      if (res.success) setDestinations(res.data.destinations);
    });
  }, []);

  // Handle pagination without full page reload
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setIsVisible(false); // Reset visibility for animation
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Sort tours based on selected option
  const sortedTours = useMemo(() => {
    if (!tours || tours.length === 0) return [];

    const toursCopy = [...tours];

    switch (sortBy) {
      case "featured":
        return toursCopy.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return 0;
        });

      case "price-asc":
        return toursCopy.sort((a, b) => {
          const priceA = tourService.getDiscountedPrice(a.price, a.discount);
          const priceB = tourService.getDiscountedPrice(b.price, b.discount);
          return priceA - priceB;
        });

      case "price-desc":
        return toursCopy.sort((a, b) => {
          const priceA = tourService.getDiscountedPrice(a.price, a.discount);
          const priceB = tourService.getDiscountedPrice(b.price, b.discount);
          return priceB - priceA;
        });

      case "name-asc":
        return toursCopy.sort((a, b) =>
          a.title.localeCompare(b.title, "vi", { sensitivity: "base" })
        );

      case "name-desc":
        return toursCopy.sort((a, b) =>
          b.title.localeCompare(a.title, "vi", { sensitivity: "base" })
        );

      case "rating":
        return toursCopy.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        });

      case "newest":
        return toursCopy.sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
        );

      default:
        return toursCopy.sort((a, b) => {
          // Default sort: featured first, then by creation date
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return (
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
          );
        });
    }
  }, [tours, sortBy]);

  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page when sorting
    setIsVisible(false); // Reset visibility for animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDestination) {
      toast.error("Vui lòng chọn địa điểm trước khi tìm kiếm!");
      return;
    }
    let url = `/tours/${selectedDestination}`;
    const params: string[] = [];
    if (searchStartDate) params.push(`start=${searchStartDate}`);
    if (searchEndDate) params.push(`end=${searchEndDate}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    window.location.href = url;
  };

  // If loading show spinner (chỉ lần đầu)
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

  // If destination not found
  if (!destination) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Không tìm thấy địa điểm
          </h1>
          <Link
            href="/destinations"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Quay lại danh sách địa điểm
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
      <Header />
      {/* Breadcrumb */}
      <div className="pt-24 pb-4">
        <div className="container mx-auto px-4">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">
              Trang chủ
            </Link>
            <span className="mx-2">›</span>
            <Link href="/destinations" className="hover:text-blue-600">
              VIỆT NAM
            </Link>
            <span className="mx-2">›</span>
            <Link href="/tours" className="hover:text-blue-600">
              Tours
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">
              {destination.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Section with optimized background */}
      <section className="relative py-16 px-4 overflow-visible flex flex-col items-center">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gray-800">
            <Image
              src={destination.image}
              alt={destination.name}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
              style={{ filter: "brightness(0.3)" }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 via-teal-900/40 to-blue-900/50" />
        </div>

        <div className="container mx-auto relative z-10 overflow-visible">
          <div
            className={`text-center ${
              isVisible ? "opacity-100" : "opacity-0"
            } transition-opacity duration-500`}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
              Tour Du Lịch{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {destination.name}
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-4 drop-shadow-lg">
              {destination.description
                ? destination.description
                : "Khám phá vẻ đẹp tuyệt vời"}
            </p>
            <div className="flex justify-center items-center space-x-4 text-white/80 text-sm mb-6">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {destination.region}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {tours.length} tour có sẵn
              </span>
            </div>
            {/* Search Component */}
            <form
              onSubmit={handleSearch}
              className="mx-auto flex flex-col md:flex-row items-end justify-center gap-6 bg-white rounded-3xl shadow-lg px-4 md:px-8 py-6 w-full max-w-4xl z-50 overflow-visible"
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
                    value={searchStartDate}
                    onChange={(e) => setSearchStartDate(e.target.value)}
                    min={today}
                  />
                  <span className="px-1 text-gray-600 flex items-center">
                    -
                  </span>
                  <input
                    type="date"
                    className="flex-1 border border-gray-400 rounded-lg px-3 py-3 text-gray-800 bg-white text-base"
                    value={searchEndDate}
                    onChange={(e) => setSearchEndDate(e.target.value)}
                    min={searchStartDate || today}
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
        </div>
      </section>

      {/* Tours Grid - Optimized */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {tours.length > 0 ? (
            <>
              {/* Sort Controls */}
              <div
                className={`mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                } transition-all duration-500`}
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {sortedTours.length} tour tìm thấy
                  </h2>
                  {destination.region && (
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                      {destination.region}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label
                    htmlFor="sort-select"
                    className="text-sm font-medium text-gray-700 whitespace-nowrap"
                  >
                    Sắp xếp theo:
                  </label>
                  <div className="relative">
                    <select
                      id="sort-select"
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 hover:border-gray-300 shadow-sm min-w-[180px]"
                    >
                      {sortOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className="py-1"
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Sort indicator */}
              {sortBy !== "default" && (
                <div
                  className={`mb-6 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  } transition-all duration-500 delay-100`}
                >
                  <div className="flex items-center gap-2 text-blue-700">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      Đã sắp xếp theo:{" "}
                      {sortOptions.find((opt) => opt.value === sortBy)?.label}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSortChange("default")}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedTours.map((tour, index) => (
                  <div
                    key={tour._id}
                    id={`tour-${tour._id}`}
                    ref={(el) => {
                      if (el && observer) {
                        observer.observe(el);
                      }
                    }}
                  >
                    <TourCard
                      tour={tour}
                      isVisible={
                        isVisible &&
                        (visibleItems.has(`tour-${tour._id}`) || index < 6)
                      }
                      index={index}
                      destinationImage={destination.image}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination - Optimized */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex space-x-2">
                    {currentPage > 1 && (
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="px-3 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
                        aria-label="Previous page"
                      >
                        ←
                      </button>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, i, arr) => (
                        <React.Fragment key={page}>
                          {i > 0 && arr[i - 1] !== page - 1 && (
                            <span className="px-3 py-2">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-lg transition-all ${
                              page === currentPage
                                ? "bg-blue-600 text-white"
                                : "bg-white hover:shadow-md"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}

                    {currentPage < totalPages && (
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="px-3 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
                        aria-label="Next page"
                      >
                        →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                <Backpack className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Chưa có tour nào
              </h3>
              <p className="text-gray-600 mb-8">
                Hiện tại chưa có tour nào cho địa điểm {destination.name}. Vui
                lòng quay lại sau hoặc khám phá các địa điểm khác.
              </p>
              <Link
                href="/tours"
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Xem tất cả tour
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
