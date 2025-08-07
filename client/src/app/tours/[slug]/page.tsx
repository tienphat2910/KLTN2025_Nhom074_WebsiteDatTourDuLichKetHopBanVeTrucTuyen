"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";
import { tourService, Tour } from "@/services/tourService";
import { destinationService, Destination } from "@/services/destinationService";

export default function ToursByDestinationPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [tours, setTours] = useState<Tour[]>([]);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadToursAndDestination = async () => {
      try {
        console.log("🔍 Loading destination with slug:", slug);

        // Load destination info first
        const destResponse = await destinationService.getDestinationBySlug(
          slug
        );
        console.log("🎯 Destination response:", destResponse);

        if (destResponse.success) {
          setDestination(destResponse.data);

          console.log(
            "🔍 Loading tours for destination ID:",
            destResponse.data._id
          );
          console.log("🔍 Destination details:", {
            _id: destResponse.data._id,
            name: destResponse.data.name,
            slug: destResponse.data.slug
          });

          // Load tours for this destination using destinationId
          const toursResponse = await tourService.getTours({
            destination: destResponse.data._id, // Use the destination ID from database
            page: currentPage,
            limit: 9
          });

          console.log("🎯 Tours response:", toursResponse);
          console.log(
            "🎯 API URL called:",
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/tours?destination=${destResponse.data._id}&page=${currentPage}&limit=9`
          );

          if (toursResponse.success) {
            setTours(toursResponse.data.tours);
            setTotalPages(toursResponse.data.pagination.totalPages);
            console.log("✅ Loaded tours:", toursResponse.data.tours.length);
            console.log(
              "🎯 Tours found:",
              toursResponse.data.tours.map((t) => ({
                title: t.title,
                destinationId: t.destinationId
              }))
            );
          } else {
            console.log("❌ Failed to load tours:", toursResponse.message);
          }
        } else {
          console.log("❌ Failed to load destination:", destResponse.message);
        }
      } catch (error) {
        console.error("❌ Error loading tours and destination:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 100);
      }
    };

    if (slug) {
      loadToursAndDestination();
    }
  }, [slug, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${destination.image}')`,
              filter: "brightness(0.3)"
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
                {destination.name}
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-4 drop-shadow-lg">
              {destination.description.slice(0, 120)}...
            </p>
            <div className="flex justify-center items-center space-x-4 text-white/80 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {destination.region}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {tours.length} tour có sẵn
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {tours.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tours.map((tour, index) => (
                  <div
                    key={tour._id}
                    className={`card-surface rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 ${
                      isVisible ? "animate-slide-up" : "opacity-0"
                    } border border-white/20`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="relative h-48">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url('${
                            tour.images[0] || destination.image
                          }')`
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {tour.isFeatured && (
                        <div className="absolute top-3 left-3 bg-yellow-500 text-yellow-900 px-2 py-1 rounded-md text-xs font-bold">
                          ⭐ Nổi bật
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
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-sm text-gray-600 ml-1">
                              {tour.rating}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 mb-2">
                        📍 Khởi hành từ: {tour.departureLocation.name}
                      </p>
                      <p className="text-gray-600 mb-4">
                        🗓️{" "}
                        {new Date(tour.startDate).toLocaleDateString("vi-VN")} -{" "}
                        {new Date(tour.endDate).toLocaleDateString("vi-VN")}
                      </p>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Còn {tour.availableSeats} chỗ</span>
                          <span>{tour.seats} chỗ tối đa</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${
                                (tour.availableSeats / tour.seats) * 100
                              }%`
                            }}
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
                            {tourService.formatPrice(
                              tourService.getDiscountedPrice(
                                tour.price,
                                tour.discount
                              )
                            )}
                          </div>
                          <span className="text-gray-500 text-sm">
                            /người lớn
                          </span>
                          {tour.discount > 0 && (
                            <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">
                              -{tour.discount}%
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/tours/detail/${tour.slug}`}
                          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex space-x-2">
                    {currentPage > 1 && (
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="px-3 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
                      >
                        ←
                      </button>
                    )}

                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg transition-all ${
                            page === currentPage
                              ? "bg-blue-600 text-white"
                              : "bg-white hover:shadow-md"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {currentPage < totalPages && (
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="px-3 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
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
              <div className="text-6xl mb-4">🎒</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Chưa có tour nào
              </h3>
              <p className="text-gray-600 mb-8">
                Hiện tại chưa có tour nào cho địa điểm {destination.name} (ID:{" "}
                {destination._id}). Vui lòng quay lại sau hoặc khám phá các địa
                điểm khác.
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
