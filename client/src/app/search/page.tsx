"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";
import { tourService, Tour } from "@/services/tourService";
import { destinationService, Destination } from "@/services/destinationService";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    tours: Tour[];
    destinations: Destination[];
  }>({
    tours: [],
    destinations: []
  });
  const [activeTab, setActiveTab] = useState("all");
  const [sectionLoading, setSectionLoading] = useState({
    tours: true,
    destinations: true
  });

  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      setSectionLoading({
        tours: true,
        destinations: true
      });

      try {
        // Use Promise.allSettled to handle multiple API calls independently
        const [toursResult, destinationsResult] = await Promise.allSettled([
          // Use parameters that match the defined interface
          tourService.getTours({
            // Use title parameter which should be supported by the API
            title: query,
            limit: 20
          }),
          // For destinations, use the correct parameter according to its interface
          destinationService.getDestinations({
            search: query, // Use 'search' instead of 'name' which isn't in the interface
            limit: 20
          })
        ]);

        // Process tours response
        const tours =
          toursResult.status === "fulfilled" && toursResult.value.success
            ? toursResult.value.data.tours
            : [];
        setSectionLoading((prev) => ({ ...prev, tours: false }));

        // Process destinations response
        const destinations =
          destinationsResult.status === "fulfilled" &&
          destinationsResult.value.success
            ? destinationsResult.value.data.destinations
            : [];
        setSectionLoading((prev) => ({ ...prev, destinations: false }));

        setSearchResults({
          tours,
          destinations
        });
      } catch (error) {
        console.error("Search error:", error);
        // Set all sections as loaded even in case of error
        setSectionLoading({
          tours: false,
          destinations: false
        });
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 100);
      }
    };

    if (query) {
      performSearch();
    } else {
      setIsLoading(false);
      setSectionLoading({
        tours: false,
        destinations: false
      });
      setIsVisible(true);
    }
  }, [query]);

  // Calculate total results
  const totalResults =
    searchResults.tours.length + searchResults.destinations.length;

  // Filter results based on active tab
  const getFilteredResults = () => {
    if (activeTab === "all") {
      return {
        tours: searchResults.tours.slice(0, 10),
        destinations: searchResults.destinations.slice(0, 10)
      };
    }

    return {
      tours: activeTab === "tours" ? searchResults.tours : [],
      destinations:
        activeTab === "destinations" ? searchResults.destinations : []
    };
  };

  const filteredResults = getFilteredResults();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <LoadingSpinner
          type="dots"
          size="xl"
          text={`Đang tìm kiếm "${query}"...`}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />

      {/* Search Header */}
      <div className="pt-24 pb-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col space-y-4">
            {/* Search query display */}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Kết quả tìm kiếm: {query}
              </h1>
              <p className="text-gray-600">
                {totalResults} kết quả được tìm thấy
              </p>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200">
              <button
                className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "all"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
                onClick={() => setActiveTab("all")}
              >
                Tất cả ({totalResults})
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "tours"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
                onClick={() => setActiveTab("tours")}
              >
                Tours ({searchResults.tours.length})
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "destinations"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
                onClick={() => setActiveTab("destinations")}
              >
                Điểm đến ({searchResults.destinations.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="container mx-auto px-4 py-8">
        {totalResults === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Không tìm thấy kết quả nào
            </h3>
            <p className="text-gray-600 mb-8">
              Không tìm thấy kết quả nào cho từ khóa "{query}". Vui lòng thử lại
              với từ khóa khác.
            </p>
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Về trang chủ
            </Link>
          </div>
        ) : (
          <div
            className={`transition-opacity duration-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Tours Section */}
            {(activeTab === "all" || activeTab === "tours") && (
              <div className="mb-12">
                {/* Section header */}
                {activeTab !== "tours" && (
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Tours</h2>
                    {searchResults.tours.length >
                      filteredResults.tours.length && (
                      <button
                        onClick={() => setActiveTab("tours")}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Xem tất cả ({searchResults.tours.length})
                      </button>
                    )}
                  </div>
                )}

                {/* Loading state for tours section */}
                {sectionLoading.tours ? (
                  <div className="py-8 text-center">
                    <LoadingSpinner
                      type="dots"
                      size="md"
                      text="Đang tìm kiếm tours..."
                    />
                  </div>
                ) : filteredResults.tours.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      Không tìm thấy tour nào phù hợp
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResults.tours.map((tour) => (
                      <Link
                        key={tour._id}
                        href={`/tours/detail/${tour.slug}`}
                        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col h-full"
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
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <span className="text-gray-400">No image</span>
                              </div>
                            )}
                          </div>
                          {tour.discount > 0 && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                              -{tour.discount}%
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                            {tour.title}
                          </h3>
                          <div className="text-sm text-gray-600 mb-2">
                            📍 {tour.departureLocation?.name || "Đang cập nhật"}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            ⏱️ {tour.duration || "Đang cập nhật"}
                          </div>

                          <div className="mt-auto pt-4">
                            <div className="font-bold text-green-600">
                              {tourService.formatPrice(
                                tourService.getDiscountedPrice(
                                  tour.price,
                                  tour.discount
                                )
                              )}
                              <span className="text-sm text-gray-500 font-normal ml-1">
                                /người
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Destinations Section */}
            {(activeTab === "all" || activeTab === "destinations") && (
              <div className="mb-12">
                {activeTab !== "destinations" && (
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      Điểm đến
                    </h2>
                    {searchResults.destinations.length >
                      filteredResults.destinations.length && (
                      <button
                        onClick={() => setActiveTab("destinations")}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Xem tất cả ({searchResults.destinations.length})
                      </button>
                    )}
                  </div>
                )}

                {/* Loading state for destinations section */}
                {sectionLoading.destinations ? (
                  <div className="py-8 text-center">
                    <LoadingSpinner
                      type="dots"
                      size="md"
                      text="Đang tìm kiếm điểm đến..."
                    />
                  </div>
                ) : filteredResults.destinations.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      Không tìm thấy điểm đến nào phù hợp
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResults.destinations.map((destination) => (
                      <Link
                        key={destination._id}
                        href={`/destinations/${destination.slug}`}
                        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                      >
                        <div className="relative h-48">
                          <div className="w-full h-full bg-gray-200">
                            {destination.image ? (
                              <Image
                                src={destination.image}
                                alt={destination.name}
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
                          </div>
                          {destination.popular && (
                            <div className="absolute top-3 left-3 bg-yellow-500 text-yellow-900 px-2 py-1 rounded-md text-xs font-bold">
                              ⭐ Phổ biến
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {destination.name}
                          </h3>
                          <div className="text-sm text-gray-600 mb-2">
                            📍 {destination.region || "Việt Nam"}
                          </div>
                          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                            {destination.description ||
                              "Đang cập nhật thông tin..."}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
