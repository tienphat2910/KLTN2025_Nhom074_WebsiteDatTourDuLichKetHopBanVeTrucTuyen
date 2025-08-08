"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { destinationService, Destination } from "@/services/destinationService";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";
import { tourService, Tour } from "@/services/tourService";
import { hotelService, Hotel } from "@/services/hotelService";

const services = [
  {
    title: "Tour Du Lịch",
    description: "Khám phá những điểm đến tuyệt vời tại Việt Nam",
    icon: "🏔️",
    href: "/tours",
    gradient: "from-blue-500 to-purple-600",
    bgColor: "bg-blue-50/80"
  },
  {
    title: "Vé Máy Bay",
    description: "Đặt vé máy bay giá tốt nhất",
    icon: "✈️",
    href: "/flights",
    gradient: "from-green-500 to-blue-500",
    bgColor: "bg-green-50/80"
  },
  {
    title: "Khách Sạn",
    description: "Tìm kiếm và đặt phòng khách sạn",
    icon: "🏨",
    href: "/hotels",
    gradient: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50/80"
  },
  {
    title: "Vé Giải Trí",
    description: "Đặt vé các điểm vui chơi giải trí",
    icon: "🎢",
    href: "/entertainment",
    gradient: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50/80"
  }
];

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>(
    []
  );
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);
  const [popularTours, setPopularTours] = useState<Tour[]>([]);
  const [isLoadingTours, setIsLoadingTours] = useState(true);
  const [topRatedHotels, setTopRatedHotels] = useState<Hotel[]>([]);
  const [isLoadingHotels, setIsLoadingHotels] = useState(true);
  const famousHotels = [
    {
      id: 1,
      name: "Vinpearl Resort Phú Quốc",
      location: "Phú Quốc, Kiên Giang",
      price: "2,500,000",
      rating: 4.8,
      amenities: ["Bể bơi", "Spa", "Nhà hàng", "WiFi miễn phí"]
    },
    {
      id: 2,
      name: "InterContinental Danang",
      location: "Đà Nẵng",
      price: "3,200,000",
      rating: 4.9,
      amenities: ["Bãi biển riêng", "Golf", "Spa", "Phòng gym"]
    },
    {
      id: 3,
      name: "Lotte Hotel Hanoi",
      location: "Hà Nội",
      price: "2,800,000",
      rating: 4.7,
      amenities: ["Trung tâm thành phố", "Sky bar", "Spa", "Meeting rooms"]
    }
  ];
  const popularEntertainments = [
    {
      id: 1,
      name: "Vinpearl Land Nha Trang",
      location: "Nha Trang, Khánh Hòa",
      price: "750,000",
      type: "Công viên giải trí",
      highlights: ["Tàu lượn siêu tốc", "Công viên nước", "Aquarium"]
    },
    {
      id: 2,
      name: "Sun World Bà Nà Hills",
      location: "Đà Nẵng",
      price: "850,000",
      type: "Khu du lịch",
      highlights: ["Cầu Vàng", "Cáp treo", "Làng Pháp"]
    },
    {
      id: 3,
      name: "Công Viên Văn Hóa Đầm Sen",
      location: "TP. Hồ Chí Minh",
      price: "150,000",
      type: "Công viên",
      highlights: ["Trò chơi cảm giác mạnh", "Biểu diễn", "Khu vui chơi trẻ em"]
    }
  ];

  // Load popular destinations from the database
  useEffect(() => {
    const loadPopularDestinations = async () => {
      try {
        setIsLoadingDestinations(true);
        const response = await destinationService.getDestinations({
          popular: true,
          limit: 3 // Limit to 3 destinations for the homepage
        });

        if (response.success) {
          setPopularDestinations(response.data.destinations);
        } else {
          console.error(
            "Failed to load popular destinations:",
            response.message
          );
        }
      } catch (error) {
        console.error("Error loading popular destinations:", error);
      } finally {
        setIsLoadingDestinations(false);
      }
    };

    loadPopularDestinations();
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Load featured/popular tours
  useEffect(() => {
    const loadPopularTours = async () => {
      try {
        setIsLoadingTours(true);

        const response = await tourService.getFeaturedTours(3);
        console.log("Featured tours response:", response);

        if (response.success) {
          setPopularTours(response.data);
        } else {
          console.error("Failed to load featured tours:", response.message);
        }
      } catch (error) {
        console.error("Error loading featured tours:", error);
      } finally {
        setIsLoadingTours(false);
      }
    };

    loadPopularTours();
  }, []);

  // Load top rated hotels from the database
  useEffect(() => {
    const loadTopRatedHotels = async () => {
      try {
        setIsLoadingHotels(true);
        const response = await hotelService.getHotels({
          limit: 3
        });

        if (response.success && response.data) {
          // Sort hotels by rating (highest first) and take top 3
          const sortedHotels = response.data
            .filter((hotel) => hotel.rating && hotel.rating > 0)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3);

          setTopRatedHotels(sortedHotels);
        } else {
          console.error("Failed to load hotels:", response.message);
        }
      } catch (error) {
        console.error("Error loading hotels:", error);
      } finally {
        setIsLoadingHotels(false);
      }
    };

    loadTopRatedHotels();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <Header />

      {/* Hero Section với background */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-out"
            style={{
              backgroundImage:
                "url('https://res.cloudinary.com/de5rurcwt/image/upload/v1754567963/LuTrip/anh-chup-man-hinh-2024-04-01-luc-12-crop-1711950811260_tulfat.png')",
              filter: "brightness(0.7)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-slate-900/40" />
        </div>

        {/* Content */}
        <div className="container mx-auto text-center relative z-10">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
              Khám Phá{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Việt Nam
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-lg">
              Trải nghiệm những chuyến du lịch tuyệt vời với dịch vụ đặt tour,
              vé máy bay, khách sạn và vé giải trí
            </p>
            <Link href="/destinations">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 shadow-xl">
                Bắt Đầu Khám Phá
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 relative">
        <div className="container mx-auto">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-300 ${
              isVisible ? "animate-slide-up" : "opacity-0"
            }`}
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Dịch Vụ Của Chúng Tôi
            </h2>
            <p className="text-slate-600 text-lg">
              Tất cả những gì bạn cần cho chuyến du lịch hoàn hảo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Link
                key={service.title}
                href={service.href}
                className={`group transition-all duration-700 delay-${
                  index * 100
                } ${isVisible ? "animate-slide-up" : "opacity-0"} h-full`}
              >
                <div
                  className={`${service.bgColor} backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/20 h-full flex flex-col`}
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${service.gradient} rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0`}
                  >
                    {service.icon}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-slate-600 flex-1">
                      {service.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations Section */}
      <section className="relative py-25 min-h-[450px] px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://res.cloudinary.com/de5rurcwt/image/upload/v1754568367/LuTrip/hinh-nen-viet-nam-4k35_piebu1.jpg')",
              filter: "brightness(1)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-blue-900/60" />
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-500 ${
              isVisible ? "animate-slide-up" : "opacity-0"
            }`}
          >
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Điểm Đến Phổ Biến
            </h2>
            <p className="text-white/90 text-lg drop-shadow">
              Những địa điểm du lịch được yêu thích nhất tại Việt Nam
            </p>
          </div>

          {/* Loading state for destinations */}
          {isLoadingDestinations ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner
                type="dots"
                size="lg"
                text="Đang tải điểm đến phổ biến..."
              />
            </div>
          ) : popularDestinations.length === 0 ? (
            <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-white text-lg">
                Không tìm thấy điểm đến phổ biến
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {popularDestinations.map((destination, index) => (
                <Link
                  key={destination._id}
                  href={`/destinations/${destination.slug}`}
                  className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 delay-${
                    600 + index * 100
                  } ${isVisible ? "animate-slide-up" : "opacity-0"} group`}
                >
                  <div className="h-64 relative overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-110"
                      style={{
                        backgroundImage: `url('${destination.image}')`
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">
                        {destination.name}
                      </h3>
                      <p className="text-gray-200 drop-shadow line-clamp-2">
                        {destination.description ||
                          `Khám phá vẻ đẹp của ${destination.name}`}
                      </p>
                      {destination.region && (
                        <span className="inline-block mt-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                          {destination.region}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Xem thêm button */}
          <div className="text-center mt-12">
            <div
              className={`transition-all duration-1000 delay-900 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
            >
              <Link
                href="/destinations"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/30 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/30 group"
              >
                <span>Xem thêm địa điểm</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Tours Section */}
      <section className="relative py-25 min-h-[450px] px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/banner-tour.jpg')",
              filter: "brightness(0.9)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-emerald-900/60" />
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-500 ${
              isVisible ? "animate-slide-up" : "opacity-0"
            }`}
          >
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Tour Phổ Biến
            </h2>
            <p className="text-white/90 text-lg drop-shadow">
              Những tour được yêu thích và đặt nhiều nhất
            </p>
          </div>

          {/* Loading state for tours */}
          {isLoadingTours ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner
                type="travel"
                size="lg"
                text="Đang tải tour phổ biến..."
              />
            </div>
          ) : popularTours.length === 0 ? (
            <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-white text-lg">Không tìm thấy tour phổ biến</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {popularTours.map((tour, index) => (
                <Link
                  key={tour._id}
                  href={`/tours/detail/${tour.slug}`}
                  className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 delay-${
                    600 + index * 100
                  } ${isVisible ? "animate-slide-up" : "opacity-0"} group`}
                >
                  <div className="h-64 relative overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-110"
                      style={{
                        backgroundImage: `url('${
                          (tour.images && tour.images[0]) ||
                          "/images/banner-tour.jpg"
                        }')`
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        {tour.isFeatured && (
                          <span className="bg-yellow-400/90 text-black px-2 py-0.5 rounded text-xs font-semibold">
                            Nổi bật
                          </span>
                        )}
                        {tour.discount > 0 && (
                          <span className="bg-red-500/90 text-white px-2 py-0.5 rounded text-xs font-semibold">
                            - {tour.discount}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold mb-1 drop-shadow-lg line-clamp-1">
                        {tour.title}
                      </h3>
                      <div className="text-gray-200 text-sm mb-2 flex flex-wrap gap-3">
                        {tour.departureLocation?.name && (
                          <span className="inline-flex items-center gap-1">
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
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {tour.departureLocation.name}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {tour.duration ||
                            tourService.formatDuration(
                              tour.startDate,
                              tour.endDate
                            )}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        {tour.discount > 0 && (
                          <span className="text-gray-300 line-through">
                            {tourService.formatPrice(tour.price)}
                          </span>
                        )}
                        <span className="text-xl font-bold text-emerald-300">
                          {tourService.formatPrice(
                            tourService.getDiscountedPrice(
                              tour.price,
                              tour.discount
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Xem thêm button */}
          <div className="text-center mt-12">
            <div
              className={`transition-all duration-1000 delay-900 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
            >
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/30 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/30 group"
              >
                <span>Xem thêm tour</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Entertainment Section */}
      <section className="relative py-25 min-h-[450px] px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/banner-entertainment.webp')",
              filter: "brightness(0.9)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-orange-900/60" />
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-500 ${
              isVisible ? "animate-slide-up" : "opacity-0"
            }`}
          >
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Địa Điểm Vui Chơi Phổ Biến
            </h2>
            <p className="text-white/90 text-lg drop-shadow">
              Những nơi giải trí hấp dẫn hàng đầu
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {popularEntertainments.map((place, index) => (
              <Link
                key={place.id}
                href="/entertainment"
                className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 delay-${
                  600 + index * 100
                } ${
                  isVisible ? "animate-slide-up" : "opacity-0"
                } group bg-white/10 backdrop-blur-sm border border-white/20`}
              >
                <div className="h-64 bg-gradient-to-br from-orange-400 to-red-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
                  <div className="p-6 text-white w-full">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold drop-shadow-lg line-clamp-1">
                        {place.name}
                      </h3>
                      <span className="text-xs bg-orange-400/90 text-black px-2 py-1 rounded-full font-semibold">
                        {place.type}
                      </span>
                    </div>
                    <p className="text-gray-200 text-sm mb-3 flex items-center gap-1">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {place.location}
                    </p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {place.highlights.slice(0, 3).map((h, i) => (
                        <span
                          key={i}
                          className="text-xs bg-white/20 px-2 py-1 rounded-full"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-baseline gap-2 justify-between">
                      <span className="text-xl font-bold text-orange-200">
                        {place.price}đ
                      </span>
                      <span className="inline-flex items-center gap-1 text-white/90 text-sm">
                        Xem chi tiết
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
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Xem thêm button */}
          <div className="text-center mt-12">
            <div
              className={`transition-all duration-1000 delay-900 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
            >
              <Link
                href="/entertainment"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/30 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/30 group"
              >
                <span>Xem thêm địa điểm vui chơi</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Famous Hotels Section */}
      <section className="relative py-25 min-h-[450px] px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://res.cloudinary.com/de5rurcwt/image/upload/v1754677970/LuTrip/KHACH-SAN_el2sxk.jpg')",
              filter: "brightness(0.9)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-purple-900/60" />
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-500 ${
              isVisible ? "animate-slide-up" : "opacity-0"
            }`}
          >
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Khách Sạn Được Đánh Giá Cao
            </h2>
            <p className="text-white/90 text-lg drop-shadow">
              Điểm lưu trú được yêu thích trên khắp Việt Nam
            </p>
          </div>

          {/* Loading state for hotels */}
          {isLoadingHotels ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner
                type="dots"
                size="lg"
                text="Đang tải khách sạn được đánh giá cao..."
              />
            </div>
          ) : topRatedHotels.length === 0 ? (
            <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-white text-lg">
                Không tìm thấy khách sạn được đánh giá cao
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {topRatedHotels.map((hotel, index) => (
                <div
                  key={hotel._id}
                  className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 delay-${
                    600 + index * 100
                  } ${
                    isVisible ? "animate-slide-up" : "opacity-0"
                  } group bg-white/10 backdrop-blur-sm border border-white/20`}
                >
                  <div className="h-70 relative overflow-hidden">
                    {hotel.gallery && hotel.gallery[0] ? (
                      <div
                        className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-110"
                        style={{
                          backgroundImage: `url('${hotel.gallery[0]}')`
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
                    <div className="p-6 text-white w-full">
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <h3 className="text-lg sm:text-xl font-bold drop-shadow-lg leading-tight flex-1">
                          {hotel.name}
                        </h3>
                        <div className="flex items-center bg-black/30 px-2 py-1 rounded-full flex-shrink-0">
                          <span className="text-yellow-400">⭐</span>
                          <span className="ml-1 font-semibold text-sm">
                            {hotel.rating?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-200 text-sm mb-3 flex items-center gap-1 line-clamp-1">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
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
                        <span className="truncate">
                          {hotel.contactInfo?.address || "Địa chỉ không có sẵn"}
                        </span>
                      </p>
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <p className="text-gray-200 text-sm mb-3 leading-tight items-center flex-1 line-clamp-3">
                          {hotel.description}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {hotel.rooms && hotel.rooms.length > 0 && (
                          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                            {hotel.rooms.length} loại phòng
                          </span>
                        )}
                        {hotel.rooms &&
                          hotel.rooms[0]?.amenities
                            ?.slice(0, 2)
                            .map((amenity, i) => (
                              <span
                                key={i}
                                className="text-xs bg-white/20 px-2 py-1 rounded-full"
                              >
                                {amenity}
                              </span>
                            ))}
                      </div>

                      <div className="flex items-end justify-between gap-2">
                        <div className="flex-1">
                          {hotel.rooms && hotel.rooms[0] && (
                            <>
                              <div className="text-lg sm:text-xl font-bold text-pink-200">
                                <span className="text-xs text-gray-300">
                                  từ{" "}
                                </span>
                                {hotelService.formatPrice(hotel.rooms[0].price)}{" "}
                                đ
                              </div>
                              <div className="text-xs text-gray-300">/đêm</div>
                            </>
                          )}
                        </div>
                        <Link
                          href="/hotels"
                          className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30 flex-shrink-0"
                        >
                          <span className="hidden sm:inline">Xem chi tiết</span>
                          <span className="sm:hidden">Xem</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Xem thêm button */}
          <div className="text-center mt-12">
            <div
              className={`transition-all duration-1000 delay-900 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
            >
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/30 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/30 group"
              >
                <span>Xem thêm khách sạn</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
