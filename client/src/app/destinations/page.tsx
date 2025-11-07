"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LoadingSpinner } from "@/components/Loading";
import { destinationService, Destination } from "@/services/destinationService";
import { Map, Plane, PartyPopper, Circle } from "lucide-react";

const serviceIcons = [
  {
    id: "tour",
    name: "Tour",
    icon: Map,
    href: "/tours"
  },
  {
    id: "flight",
    name: "Chuyến bay",
    icon: Plane,
    href: "/flights"
  },
  {
    id: "activity",
    name: "Giải trí",
    icon: PartyPopper,
    href: "/activity"
  },
  {
    id: "all-services",
    name: "Tất cả các mục",
    icon: Circle,
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

export default function DestinationsPage() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const response = await destinationService.getDestinations({
          limit: 50
        });
        if (response.success) {
          setDestinations(response.data.destinations);

          // If there's a selected ID from URL, find and set that destination
          if (selectedId) {
            const foundDestination = response.data.destinations.find(
              (dest) => dest._id === selectedId
            );
            if (foundDestination) {
              setSelectedDestination(foundDestination);
            } else {
              // If ID not found, set first popular destination
              const firstPopular = response.data.destinations.find(
                (dest) => dest.popular
              );
              setSelectedDestination(
                firstPopular || response.data.destinations[0] || null
              );
            }
          } else {
            // Set first popular destination as default
            const firstPopular = response.data.destinations.find(
              (dest) => dest.popular
            );
            setSelectedDestination(
              firstPopular || response.data.destinations[0] || null
            );
          }
        }
      } catch (error) {
        console.error("Error loading destinations:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 100);
      }
    };

    loadDestinations();
  }, [selectedId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner type="travel" size="xl" text="Đang tải địa điểm..." />
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
            {selectedDestination && (
              <>
                <span className="mx-2">›</span>
                <span className="text-gray-800 font-medium">
                  {selectedDestination.name}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2">
            {/* Hero Card */}
            {selectedDestination && (
              <div
                className={`bg-white rounded-2xl shadow-lg overflow-hidden mb-8 transition-all duration-1000 ${
                  isVisible ? "animate-fade-in" : "opacity-0"
                }`}
              >
                <div className="relative h-64 md:h-80">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${selectedDestination.image}')`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Photo Gallery Button */}
                  <button className="absolute top-4 right-4 bg-black/50 text-white px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-black/70 transition-colors">
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm">Thư viện ảnh</span>
                  </button>

                  {/* Title and Description */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                      {selectedDestination.name}
                    </h1>
                    <p className="text-white/90 text-sm mb-3 drop-shadow">
                      {selectedDestination.description}
                    </p>
                    <div className="flex items-center space-x-4 text-white/80 text-sm">
                      <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                        {selectedDestination.region}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Services Grid */}
            <div
              className={`bg-white rounded-2xl shadow-lg p-6 mb-8 transition-all duration-1000 delay-300 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
            >
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {serviceIcons.map((service) => (
                  <Link
                    key={service.id}
                    href={
                      service.id === "tour" && selectedDestination
                        ? `/tours/${selectedDestination.slug}`
                        : service.id === "flight" && selectedDestination
                        ? `/flights/${selectedDestination.slug}`
                        : service.id === "activity" && selectedDestination
                        ? `/activity/${selectedDestination.slug}`
                        : service.href
                    }
                    className="flex flex-col items-center p-3 rounded-xl hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform flex items-center justify-center">
                      <service.icon className="w-8 h-8 text-gray-700 group-hover:text-blue-600" />
                    </div>
                    <span className="text-xs text-center text-gray-700 group-hover:text-blue-600 font-medium">
                      {service.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Suggestions Section */}
            <div
              className={`transition-all duration-1000 delay-500 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Gợi ý</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="relative h-48">
                      <div
                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{
                          backgroundImage: `url('${suggestion.image}')`
                        }}
                      />
                      {suggestion.isPromo && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                          Khuyến mãi ⚡
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold text-lg drop-shadow-lg">
                          {suggestion.title}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {suggestion.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Destinations List */}
          <div className="lg:col-span-1">
            <div
              className={`bg-white rounded-2xl shadow-lg p-6 sticky top-24 transition-all duration-1000 delay-700 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Tất cả địa điểm
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {destinations.map((destination) => (
                  <button
                    key={destination._id}
                    onClick={() => setSelectedDestination(destination)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedDestination?._id === destination._id
                        ? "bg-blue-50 border-l-4 border-blue-500 text-blue-700"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{destination.name}</div>
                        <div className="text-xs text-gray-500">
                          {destination.region}
                        </div>
                      </div>
                      {destination.popular && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          Phổ biến
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
