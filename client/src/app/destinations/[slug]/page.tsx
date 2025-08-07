"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";
import { destinationService, Destination } from "@/services/destinationService";

const serviceIcons = [
  {
    id: "tour",
    name: "Tour",
    icon: "🗺️",
    href: "/tours"
  },
  {
    id: "hotel",
    name: "Khách sạn",
    icon: "🏨",
    href: "/hotels"
  },
  {
    id: "flight",
    name: "Chuyến bay",
    icon: "✈️",
    href: "/flights"
  },
  {
    id: "entertainment",
    name: "Giải trí",
    icon: "🎉",
    href: "/entertainment"
  },
  {
    id: "all-services",
    name: "Tất cả các mục",
    icon: "⚫",
    href: "/services"
  }
];

const suggestions = [
  {
    id: 1,
    title: "Fansipan Sapa",
    image:
      "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567626/LuTrip/dulichsapa-1650268886-1480-1650277620_bcldcd.png",
    category: "Núi",
    isPromo: false
  },
  {
    id: 2,
    title: "Cầu Vàng Đà Nẵng",
    image:
      "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/anh-vinh-ha-long-59_qp6nt2.jpg",
    category: "Cầu",
    isPromo: true
  },
  {
    id: 3,
    title: "Đà Lạt",
    image:
      "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/du-lich-phu-quoc-kinh-nghiem-va-thong-tin-huu-ich_eomet8.jpg",
    category: "Thành phố",
    isPromo: false
  },
  {
    id: 4,
    title: "Phú Quốc Sky",
    image:
      "https://res.cloudinary.com/de5rurcwt/image/upload/v1754568367/LuTrip/hinh-nen-viet-nam-4k35_piebu1.jpg",
    category: "Cáp treo",
    isPromo: true
  }
];

export default function DestinationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const id = searchParams.get("id");

  const [destination, setDestination] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Mock gallery images for destination
  const galleryImages = [
    destination?.image || "",
    "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567626/LuTrip/dulichsapa-1650268886-1480-1650277620_bcldcd.png",
    "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/anh-vinh-ha-long-59_qp6nt2.jpg",
    "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/du-lich-phu-quoc-kinh-nghiem-va-thong-tin-huu-ich_eomet8.jpg",
    "https://res.cloudinary.com/de5rurcwt/image/upload/v1754568367/LuTrip/hinh-nen-viet-nam-4k35_piebu1.jpg"
  ].filter(Boolean);

  useEffect(() => {
    const loadDestination = async () => {
      try {
        let response;

        if (slug === "detail" && id) {
          response = await destinationService.getDestinationById(id);
        } else {
          response = await destinationService.getDestinationBySlug(slug);
        }

        if (response.success) {
          setDestination(response.data);
        }
      } catch (error) {
        console.error("Error loading destination:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 100);
      }
    };

    if (slug) {
      loadDestination();
    }
  }, [slug, id]);

  const openGallery = (index: number = 0) => {
    setSelectedImageIndex(index);
    setShowGallery(true);
    document.body.style.overflow = "hidden";
  };

  const closeGallery = () => {
    setShowGallery(false);
    document.body.style.overflow = "unset";
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex(
      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner
          type="travel"
          size="xl"
          text="Đang tải thông tin địa điểm..."
        />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
            <span className="text-gray-800 font-medium">
              {destination.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pb-8">
        <div
          className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-1000 ${
            isVisible ? "animate-fade-in" : "opacity-0"
          }`}
        >
          <div className="relative h-64 md:h-80 lg:h-96">
            <div
              className="w-full h-full bg-cover bg-center cursor-pointer"
              style={{ backgroundImage: `url('${destination.image}')` }}
              onClick={() => openGallery(0)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Photo Gallery Button */}
            <button
              onClick={() => openGallery(0)}
              className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-black/70 transition-colors"
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium">Thư viện ảnh</span>
            </button>

            {/* Image indicators */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              <span>●</span>
              <span className="ml-1">●</span>
            </div>

            {/* Title and Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                {destination.name}
              </h1>
              <p className="text-white/90 text-sm md:text-base mb-4 drop-shadow leading-relaxed max-w-2xl">
                {destination.description.slice(0, 150)}...
                <button className="text-blue-200 hover:text-white ml-2 underline font-medium">
                  Xem thêm
                </button>
              </p>

              {/* Info badges */}
              <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Thời lượng lý tưởng</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full font-semibold">
                    3 ngày
                  </span>
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {destination.region}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {destination.country}
                </span>
                {destination.popular && (
                  <span className="bg-yellow-500/90 text-yellow-900 px-3 py-1 rounded-full font-medium">
                    ⭐ Phổ biến
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 pb-8">
        <div
          className={`bg-white rounded-2xl shadow-lg p-6 transition-all duration-1000 delay-300 ${
            isVisible ? "animate-slide-up" : "opacity-0"
          }`}
        >
          <div className="flex justify-center">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 max-w-4xl">
              {serviceIcons.map((service) => (
                <Link
                  key={service.id}
                  href={service.href}
                  className="flex flex-col items-center p-3 md:p-4 rounded-xl hover:scale-105 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:bg-blue-50">
                    <span className="text-xl md:text-2xl">{service.icon}</span>
                  </div>
                  <span className="text-xs md:text-sm text-center text-gray-700 group-hover:text-blue-600 font-medium leading-tight">
                    {service.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Section */}
      <div className="container mx-auto px-4 pb-16">
        <div
          className={`transition-all duration-1000 delay-500 ${
            isVisible ? "animate-slide-up" : "opacity-0"
          }`}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
            Gợi ý
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <div className="relative h-48 md:h-56">
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('${suggestion.image}')` }}
                  />
                  {suggestion.isPromo && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center">
                      <span className="mr-1">⚡</span>
                      Khuyến mãi lớn
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg md:text-xl drop-shadow-lg">
                      {suggestion.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {suggestion.category}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Navigation buttons */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Main image */}
          <div className="max-w-4xl max-h-[80vh] mx-4">
            <img
              src={galleryImages[selectedImageIndex]}
              alt={`${destination.name} - Ảnh ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {selectedImageIndex + 1} / {galleryImages.length}
          </div>

          {/* Thumbnail strip */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-16 h-12 rounded-md overflow-hidden border-2 ${
                    index === selectedImageIndex
                      ? "border-white"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}
