"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { tourService, Tour } from "@/services/tourService";

// Lazy load components for better bundle splitting
const Header = lazy(() => import("@/components/Header"));
const Footer = lazy(() => import("@/components/Footer"));
const LoadingSpinner = lazy(
  () => import("@/components/Loading/LoadingSpinner")
);
const TourDetailHeader = lazy(
  () => import("@/components/Tours/TourDetailHeader")
);
const TourImageGallery = lazy(
  () => import("@/components/Tours/TourImageGallery")
);
const TourInfo = lazy(() => import("@/components/Tours/TourInfo"));
const TourItinerary = lazy(() => import("@/components/Tours/TourItinerary"));
const TourBookingSidebar = lazy(
  () => import("@/components/Tours/TourBookingSidebar")
);
const TourPolicies = lazy(() => import("@/components/Tours/TourPolicies"));
const TourRelated = lazy(() => import("@/components/Tours/TourRelated"));
const TourGalleryModal = lazy(
  () => import("@/components/Tours/TourGalleryModal")
);

export default function TourDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState({
    adult: 1,
    child: 0,
    infant: 0
  });

  // Related tours
  const [relatedTours, setRelatedTours] = useState<Tour[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState<boolean>(false);

  useEffect(() => {
    const loadTour = async () => {
      try {
        // First try exact slug match
        let response = await tourService.getTourBySlug(slug);

        if (response.success) {
          // Set the tour data
          setTour(response.data);
        }

        // If not found, try partial matching
        if (!response.success) {
          // Get all tours and find by partial title matching
          const allToursResponse = await tourService.getTours({ limit: 100 });
          if (allToursResponse.success) {
            const tours = allToursResponse.data.tours;

            // Try to match by slug part
            const exactSlugParts = slug.split("-");

            // First, try to match tour with departure location in slug
            const departureMatches = exactSlugParts.some(
              (part) =>
                part === "tphcm" || part === "ha-noi" || part === "da-nang"
            );

            // Try to extract departure from slug
            const departureFromSlug =
              slug.includes("-tu-tphcm") ||
              slug.includes("-tu-ho-chi-minh") ||
              slug.includes("-tu-sai-gon")
                ? "TP. Hồ Chí Minh"
                : slug.includes("-tu-ha-noi") || slug.includes("-tu-hn")
                ? "Hà Nội"
                : slug.includes("-tu-da-nang")
                ? "Đà Nẵng"
                : null;

            // First look for tours with matching departure if we could extract one
            let matchedTour = null;

            if (departureFromSlug) {
              matchedTour = tours.find(
                (tour) =>
                  tour.slug.includes(slug) &&
                  tour.departureLocation?.name === departureFromSlug
              );
            }

            // If no match yet, try a more general title match
            if (!matchedTour) {
              // Try to find tour by matching title keywords
              const slugKeywords = slug
                .split("-")
                .filter((word) => word.length > 2);

              matchedTour = tours.find((tour) => {
                const titleWords = tour.title
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/đ/g, "d")
                  .replace(/Đ/g, "D")
                  .split(/[\s\-_,\.]+/);

                const matchCount = slugKeywords.filter((keyword) =>
                  titleWords.some(
                    (word) => word.includes(keyword) || keyword.includes(word)
                  )
                ).length;

                return matchCount >= Math.min(3, slugKeywords.length * 0.6);
              });
            }

            if (matchedTour) {
              setTour(matchedTour);
            }
          }
        } else if (response.success && response.data) {
          setTour(response.data);
        }
      } catch (error) {
        console.error("❌ Error loading tour:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsVisible(true), 100);
      }
    };

    if (slug) {
      loadTour();
    }
  }, [slug, params]); // Add params to dependency array

  // Fetch related tours by destination when tour is loaded
  useEffect(() => {
    const fetchRelated = async () => {
      if (!tour?.destinationId) return;
      try {
        setIsLoadingRelated(true);
        // Ensure we always pass the raw destinationId string (handle populated object just in case)
        const destinationId =
          (tour as any)?.destinationId?._id || tour.destinationId;
        const res = await tourService.getTours({
          destination: destinationId,
          limit: 6
        });
        if (res.success) {
          const filtered = res.data.tours.filter((t) => t._id !== tour._id);
          setRelatedTours(filtered);
        }
      } catch (e) {
        // noop
      } finally {
        setIsLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [tour?.destinationId, tour?._id]);

  const openGallery = (index: number = 0) => {
    if (!tour || !tour.images || tour.images.length === 0) return;
    setSelectedImageIndex(index);
    setShowGallery(true);
    document.body.style.overflow = "hidden";
  };

  const closeGallery = () => {
    setShowGallery(false);
    document.body.style.overflow = "unset";
  };

  const nextImage = () => {
    if (tour?.images?.length) {
      setSelectedImageIndex((prev) => (prev + 1) % tour.images!.length);
    }
  };

  const prevImage = () => {
    if (tour?.images?.length) {
      setSelectedImageIndex(
        (prev) => (prev - 1 + tour.images!.length) % tour.images!.length
      );
    }
  };

  const calculateTotalPrice = () => {
    if (!tour) return 0;

    const discountedPrice = tourService.getDiscountedPrice(
      tour.price || 0,
      tour.discount || 0
    );
    const adultTotal = selectedParticipants.adult * discountedPrice;
    const childTotal =
      selectedParticipants.child *
      tourService.getDiscountedPrice(
        tour.pricingByAge?.child || 0,
        tour.discount || 0
      );
    const infantTotal =
      selectedParticipants.infant *
      tourService.getDiscountedPrice(
        tour.pricingByAge?.infant || 0,
        tour.discount || 0
      );

    return adultTotal + childTotal + infantTotal;
  };

  const updateParticipants = (
    type: "adult" | "child" | "infant",
    value: number
  ) => {
    setSelectedParticipants((prev) => ({
      ...prev,
      [type]: Math.max(0, value)
    }));
  };

  const handleBookTour = () => {
    if (!tour) return;
    // Chuyển sang trang bookingtour với các tham số
    router.push(
      `/bookingtour?tourId=${tour._id}&adults=${selectedParticipants.adult}&children=${selectedParticipants.child}&infants=${selectedParticipants.infant}`
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="animate-pulse bg-gray-200 rounded-full w-16 h-16"></div>
          }
        >
          <LoadingSpinner
            type="travel"
            size="xl"
            text="Đang tải thông tin tour..."
          />
        </Suspense>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <div className="flex justify-center mb-4">
            <svg
              className="w-24 h-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Không tìm thấy tour
          </h1>
          <p className="text-gray-600 mb-8">
            Tour bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại.
            <br />
            <span className="text-sm text-gray-500 mt-2 block">
              Slug tìm kiếm: {slug}
            </span>
          </p>
          <div className="space-y-4">
            <Link
              href="/tours"
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 inline-block"
            >
              ← Xem tất cả tour
            </Link>
            <br />
            <Link
              href="/tours/phu-quoc"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 inline-block"
            >
              Xem tour Phú Quốc
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
      <Header />

      {/* Breadcrumb */}
      <div className="pt-2 pb-2 md:pb-4">
        <div className="container mx-auto px-4">
          <Suspense
            fallback={
              <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
            }
          >
            <TourDetailHeader title={tour?.title || "Loading..."} />
          </Suspense>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12 md:pb-16">
        {/* Use flex-col on mobile and grid on larger screens */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content - Full width on mobile */}
          <div className="lg:col-span-2">
            {/* Hero Gallery */}
            <Suspense
              fallback={
                <div className="animate-pulse bg-gray-200 h-80 rounded-xl"></div>
              }
            >
              <TourImageGallery
                images={tour?.images || []}
                title={tour?.title || ""}
                onOpenGallery={openGallery}
                isVisible={isVisible}
              />
            </Suspense>

            {/* Tour Info */}
            <Suspense
              fallback={
                <div className="animate-pulse bg-gray-200 h-48 rounded-xl"></div>
              }
            >
              <TourInfo tour={tour} isVisible={isVisible} />
            </Suspense>

            {/* Itinerary - Enhanced for new structure */}
            <Suspense
              fallback={
                <div className="animate-pulse bg-gray-200 h-96 rounded-xl"></div>
              }
            >
              <TourItinerary tour={tour} isVisible={isVisible} />
            </Suspense>
          </div>

          {/* Booking Sidebar - Move back to the right side */}
          <div className="lg:col-span-1">
            <Suspense
              fallback={
                <div className="animate-pulse bg-gray-200 h-96 rounded-xl"></div>
              }
            >
              <TourBookingSidebar
                tour={tour}
                selectedParticipants={selectedParticipants}
                onUpdateParticipants={updateParticipants}
                onBookTour={handleBookTour}
                isVisible={isVisible}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Policies & Information (collapsible) */}
      <div className="container mx-auto px-4 pb-10">
        <Suspense
          fallback={
            <div className="animate-pulse bg-gray-200 h-96 rounded-xl"></div>
          }
        >
          <TourPolicies isVisible={isVisible} />
        </Suspense>
      </div>

      {/* Related tours */}
      <div className="container mx-auto px-4 pb-12">
        <Suspense
          fallback={
            <div className="animate-pulse bg-gray-200 h-48 rounded-xl"></div>
          }
        >
          <TourRelated
            relatedTours={relatedTours}
            isLoadingRelated={isLoadingRelated}
          />
        </Suspense>
      </div>

      {/* Photo Gallery Modal - Better optimized for mobile */}
      {showGallery && tour?.images && tour.images.length > 0 && (
        <Suspense
          fallback={
            <div className="animate-pulse bg-gray-200 w-full h-full"></div>
          }
        >
          <TourGalleryModal
            images={tour.images}
            selectedImageIndex={selectedImageIndex}
            showGallery={showGallery}
            onClose={closeGallery}
            onNext={nextImage}
            onPrev={prevImage}
            onSelectImage={setSelectedImageIndex}
            title={tour.title}
          />
        </Suspense>
      )}

      <Footer />
    </div>
  );
}
