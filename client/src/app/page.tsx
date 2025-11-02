"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { destinationService, Destination } from "@/services/destinationService";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";
import { tourService, Tour } from "@/services/tourService";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { env } from "@/config/env";
import { Mountain, Plane, Ticket } from "lucide-react";

const services = [
  {
    title: "Tour Du Lịch",
    description: "Khám phá những điểm đến tuyệt vời tại Việt Nam",
    icon: Mountain,
    href: "/tours",
    gradient: "from-blue-500 to-purple-600",
    bgColor: "bg-white"
  },
  {
    title: "Vé Máy Bay",
    description: "Đặt vé máy bay giá tốt nhất",
    icon: Plane,
    href: "/flights",
    gradient: "from-green-500 to-blue-500",
    bgColor: "bg-[#87CEFA]/20"
  },
  {
    title: "Vé Giải Trí",
    description: "Đặt vé các điểm vui chơi giải trí",
    icon: Ticket,
    href: "/activity",
    gradient: "from-amber-400 to-orange-500",
    bgColor: "bg-orange-50/80"
  }
];

// Hero background images
const heroBackgroundImages = [
  "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567963/LuTrip/anh-chup-man-hinh-2024-04-01-luc-12-crop-1711950811260_tulfat.png",
  "https://images.unsplash.com/photo-1528127269322-539801943592?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170",
  "https://res.cloudinary.com/de5rurcwt/image/upload/v1761762361/6_bdb1li.jpg",
  "https://res.cloudinary.com/de5rurcwt/image/upload/v1761762361/5_ypsfcz.jpg",
  "https://res.cloudinary.com/de5rurcwt/image/upload/v1761762361/3_cbuacd.jpg",
  "https://res.cloudinary.com/de5rurcwt/image/upload/v1761762361/7_skbwv2.jpg",
  "https://res.cloudinary.com/de5rurcwt/image/upload/v1761762362/1_h0dcbn.jpg",
  "https://res.cloudinary.com/de5rurcwt/image/upload/v1761762361/2_a5dzrk.jpg",
  "https://res.cloudinary.com/de5rurcwt/image/upload/v1761762363/9_dqin93.jpg",
  "https://res.cloudinary.com/de5rurcwt/image/upload/v1761762364/8_xeeaao.jpg"
];

export default function Home() {
  const { isAuthLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set()
  );
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>(
    []
  );
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);
  const [popularTours, setPopularTours] = useState<Tour[]>([]);
  const [isLoadingTours, setIsLoadingTours] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [popularActivities, setPopularActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [heroBackgroundImage, setHeroBackgroundImage] = useState<string>("");

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
    // Random select a hero background image
    const randomIndex = Math.floor(Math.random() * heroBackgroundImages.length);
    setHeroBackgroundImage(heroBackgroundImages[randomIndex]);
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

  // Fetch popular activities
  useEffect(() => {
    setIsLoadingActivities(true);
    axios
      .get(`${env.API_BASE_URL}/activities?popular=true&limit=3`)
      .then((res) => {
        if (res.data.success) {
          // Handle both array and object with activities property
          const activitiesData = Array.isArray(res.data.data)
            ? res.data.data
            : res.data.data?.activities || [];
          setPopularActivities(activitiesData);
        } else {
          setPopularActivities([]);
        }
      })
      .catch(() => setPopularActivities([]))
      .finally(() => setIsLoadingActivities(false));
  }, []);

  // Refs for sections (khai báo trước useEffect để không bị undefined)
  const servicesRef = useRef<HTMLElement>(null);
  const destinationsRef = useRef<HTMLElement>(null);
  const toursRef = useRef<HTMLElement>(null);
  const activityRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    setVisibleSections(new Set()); // Reset hiệu ứng khi reload

    if (!hasMounted) return; // Chỉ chạy sau khi đã mount

    const observerOptions = {
      threshold: 0.2,
      rootMargin: "-50px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute("data-section");
          if (sectionId) {
            setVisibleSections((prev) => new Set([...prev, sectionId]));
          }
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = [
      { ref: servicesRef, id: "services" },
      { ref: destinationsRef, id: "destinations" },
      { ref: toursRef, id: "tours" },
      { ref: activityRef, id: "activity" }
    ];

    sections.forEach(({ ref, id }) => {
      if (ref.current) {
        ref.current.setAttribute("data-section", id);
        observer.observe(ref.current);
      }
    });

    return () => {
      sections.forEach(({ ref }) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, [hasMounted]);

  // Helper function to check if section is visible
  const isSectionVisible = (sectionId: string) =>
    visibleSections.has(sectionId);

  // Don't wait for auth on home page - render immediately
  if (isAuthLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <Header />

      {/* Hero Section với background */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {heroBackgroundImage && (
            <>
              <Image
                src={heroBackgroundImage}
                alt="Hero Background"
                fill
                priority
                quality={90}
                sizes="100vw"
                className="object-cover object-center brightness-75"
                style={{ objectPosition: "center 40%" }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-slate-900/30" />
            </>
          )}
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
              <span
                className="bg-gradient-to-r from-[#D73A33] via-[#F7F719] to-[#D73A33]
                 bg-clip-text text-transparent 
                 animate-gradient-x font-extrabold"
              >
                Việt Nam
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-lg">
              Trải nghiệm những chuyến du lịch tuyệt vời với dịch vụ đặt tour,
              vé máy bay và vé giải trí
            </p>
            <Link href="/destinations">
              <button
                className="relative overflow-hidden bg-gradient-to-r from-red-700 via-yellow-400 to-red-700
                     text-white px-8 py-4 rounded-full text-lg font-semibold
                     transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-xl
                     bg-[length:200%_200%] hover:animate-gradient-x"
              >
                Bắt Đầu Khám Phá
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        ref={servicesRef}
        className={`py-16 px-4 relative transition-all duration-1000 ${
          isSectionVisible("services")
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="container mx-auto">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-200 ${
              isSectionVisible("services")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Dịch Vụ Của Chúng Tôi
            </h2>
            <p className="text-slate-600 text-lg">
              Tất cả những gì bạn cần cho chuyến du lịch hoàn hảo
            </p>
          </div>

          <div className="flex justify-center">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 w-fit">
              {services.map((service) => (
                <Link
                  key={service.title}
                  href={service.href}
                  className={`group transition-all duration-700 ${
                    isSectionVisible("services")
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  } h-full`}
                >
                  <div
                    className={`${service.bgColor} backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/20 h-full flex flex-col`}
                  >
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${service.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0`}
                    >
                      <service.icon className="w-8 h-8 text-white" />
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
        </div>
      </section>

      {/* Popular Destinations Section */}
      <section
        ref={destinationsRef}
        className={`relative py-25 min-h-[450px] px-4 overflow-hidden transition-all duration-1000 ${
          isSectionVisible("destinations")
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://res.cloudinary.com/de5rurcwt/image/upload/v1754568367/LuTrip/hinh-nen-viet-nam-4k35_piebu1.jpg"
            alt="Destinations Background"
            fill
            quality={85}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-blue-900/60" />
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-200 ${
              isSectionVisible("destinations")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
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
              {popularDestinations.map((destination) => (
                <Link
                  key={destination._id}
                  href={`/destinations/${destination.slug}`}
                  className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 ${
                    isSectionVisible("destinations")
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  } group`}
                >
                  <div className="h-64 relative overflow-hidden">
                    <Image
                      src={destination.image}
                      alt={destination.name}
                      fill
                      quality={85}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
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
              className={`transition-all duration-1000 delay-700 ${
                isSectionVisible("destinations")
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
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
      <section
        ref={toursRef}
        className={`relative py-25 min-h-[450px] px-4 overflow-hidden transition-all duration-1000 ${
          isSectionVisible("tours")
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/banner-tour.jpg"
            alt="Tours Background"
            fill
            quality={85}
            sizes="100vw"
            className="object-cover object-center brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-emerald-900/60" />
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-200 ${
              isSectionVisible("tours")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
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
              {popularTours.map((tour) => (
                <Link
                  key={tour._id}
                  href={`/tours/detail/${tour.slug}`}
                  className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 ${
                    isSectionVisible("tours")
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  } group`}
                >
                  <div className="h-64 relative overflow-hidden">
                    <Image
                      src={
                        (tour.images && tour.images[0]) ||
                        "/images/banner-tour.jpg"
                      }
                      alt={tour.title}
                      fill
                      quality={85}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
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
              className={`transition-all duration-1000 delay-700 ${
                isSectionVisible("tours")
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
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

      {/* Popular Activity Section */}
      <section
        ref={activityRef}
        className={`relative py-25 min-h-[450px] px-4 overflow-hidden transition-all duration-1000 ${
          isSectionVisible("activity")
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://static.vinwonders.com/production/DJI_20231015142010_0245_D.jpg"
            alt="Activities Background"
            fill
            quality={85}
            sizes="100vw"
            className="object-cover object-center brightness-90"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-orange-900/60" />
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-200 ${
              isSectionVisible("activity")
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Địa Điểm Vui Chơi Phổ Biến
            </h2>
            <p className="text-white/90 text-lg drop-shadow">
              Những nơi giải trí hấp dẫn hàng đầu
            </p>
          </div>

          {isLoadingActivities ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner
                type="dots"
                size="lg"
                text="Đang tải địa điểm vui chơi..."
              />
            </div>
          ) : (popularActivities || []).length === 0 ? (
            <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-white text-lg">
                Không tìm thấy địa điểm vui chơi phổ biến
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {(popularActivities || [])
                .filter((place) => place && place.popular)
                .map((place) => (
                  <Link
                    key={place._id}
                    href={`/activity/detail/${place.slug}`}
                    className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 ${
                      isSectionVisible("activity")
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                    } group`}
                  >
                    {/* Gallery image nếu có */}
                    <div className="h-64 relative overflow-hidden">
                      {place.gallery && place.gallery.length > 0 ? (
                        <Image
                          src={place.gallery[0]}
                          alt={place.name}
                          fill
                          quality={85}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
                      <div className="p-6 text-white w-full flex flex-col h-full justify-between">
                        <div>
                          <h3 className="text-2xl font-bold drop-shadow-lg line-clamp-2 mb-2">
                            {place.name}
                          </h3>
                          <div className="flex items-center text-sm mb-2">
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
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>
                              {place.location?.address ||
                                place.location?.name ||
                                ""}
                            </span>
                          </div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            {(place.features || [])
                              .slice(0, 1)
                              .map((h: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-xs bg-white/20 px-2 py-1 rounded-full"
                                >
                                  {h}
                                </span>
                              ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <span className="text-xl font-bold text-orange-200">
                            {place.price?.retail?.adult
                              ? `${place.price.retail.adult.toLocaleString(
                                  "vi-VN"
                                )}đ`
                              : "Liên hệ"}
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
          )}

          {/* Xem thêm button */}
          <div className="text-center mt-12">
            <div
              className={`transition-all duration-1000 delay-700 ${
                isSectionVisible("activity")
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <Link
                href="/activity"
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

      <Footer />
    </div>
  );
}
