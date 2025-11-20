"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";
import { tourService, Tour } from "@/services/tourService";
import { destinationService, Destination } from "@/services/destinationService";

// Lazy load components for better bundle splitting
const TourCard = lazy(() => import("@/components/Tours/TourCard"));
const SearchForm = lazy(() => import("@/components/Tours/SearchForm"));
const SortControls = lazy(() => import("@/components/Tours/SortControls"));
const Pagination = lazy(() => import("@/components/Tours/Pagination"));
const EmptyState = lazy(() => import("@/components/Tours/EmptyState"));

export default function ToursByDestinationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();

  // Memoize today date to avoid recalculation on every render
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [tours, setTours] = useState<Tour[]>([]);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>("default");
  const [selectedDestination, setSelectedDestination] = useState<string>(slug);
  const [startDate, setStartDate] = useState<string>(""); // dùng cho API
  const [endDate, setEndDate] = useState<string>(""); // dùng cho API
  const [searchStartDate, setSearchStartDate] = useState<string>(""); // dùng cho input
  const [searchEndDate, setSearchEndDate] = useState<string>(""); // dùng cho input

  // Use intersection observer for better scroll performance
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

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
      // Error handled silently
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
            <Suspense
              fallback={
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="md" />
                </div>
              }
            >
              <SearchForm
                selectedDestination={selectedDestination}
                searchStartDate={searchStartDate}
                searchEndDate={searchEndDate}
                onDestinationChange={setSelectedDestination}
                onStartDateChange={setSearchStartDate}
                onEndDateChange={setSearchEndDate}
                onSearch={(url) => (window.location.href = url)}
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Tours Grid - Optimized */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {tours.length > 0 ? (
            <>
              {/* Sort Controls */}
              <Suspense
                fallback={
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="md" />
                  </div>
                }
              >
                <SortControls
                  sortBy={sortBy}
                  totalTours={sortedTours.length}
                  destinationRegion={destination.region}
                  isVisible={isVisible}
                  onSortChange={handleSortChange}
                />
              </Suspense>

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
                    <Suspense
                      fallback={
                        <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                          <div className="h-48 bg-gray-200 rounded"></div>
                        </div>
                      }
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
                    </Suspense>
                  </div>
                ))}
              </div>

              {/* Pagination - Optimized */}
              <Suspense
                fallback={
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="md" />
                  </div>
                }
              >
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </Suspense>
            </>
          ) : (
            <Suspense
              fallback={
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="md" />
                </div>
              }
            >
              <EmptyState destinationName={destination.name} />
            </Suspense>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
