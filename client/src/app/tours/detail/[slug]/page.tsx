"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";
import { tourService, Tour, ItineraryDay } from "@/services/tourService";

export default function TourDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

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

  // Collapsible policy sections (default closed)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Related tours
  const [relatedTours, setRelatedTours] = useState<Tour[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState<boolean>(false);

  // Helper function to check if title contains departure location
  const checkTitleContainsDeparture = (
    title: string | undefined,
    departureName: string | undefined
  ) => {
    if (!title || !departureName) return false;

    const titleLower = title.toLowerCase();
    const departureNameLower = departureName.toLowerCase();

    // Check for various formats of departure in title
    if (
      departureNameLower.includes("hồ chí minh") ||
      departureNameLower === "tp. hồ chí minh"
    ) {
      return (
        titleLower.includes("tphcm") ||
        titleLower.includes("tp.hcm") ||
        titleLower.includes("hồ chí minh") ||
        titleLower.includes("sài gòn")
      );
    }

    if (departureNameLower === "hà nội") {
      return titleLower.includes("hà nội") || titleLower.includes("hn");
    }

    if (departureNameLower === "đà nẵng") {
      return titleLower.includes("đà nẵng");
    }

    // Generic check
    return titleLower.includes(departureNameLower);
  };

  // Helper function to extract departure from title
  const extractDepartureFromTitle = (title: string | undefined) => {
    if (!title) return null;

    const titleLower = title.toLowerCase();

    // Check for various keywords that indicate departure
    if (
      titleLower.includes("khởi hành từ tphcm") ||
      titleLower.includes("khởi hành từ hồ chí minh") ||
      titleLower.includes("từ tp.hcm") ||
      titleLower.includes("từ sài gòn")
    ) {
      return "TP. Hồ Chí Minh";
    }

    if (
      titleLower.includes("khởi hành từ hà nội") ||
      titleLower.includes("từ hà nội") ||
      titleLower.includes("từ hn")
    ) {
      return "Hà Nội";
    }

    if (
      titleLower.includes("khởi hành từ đà nẵng") ||
      titleLower.includes("từ đà nẵng")
    ) {
      return "Đà Nẵng";
    }

    return null;
  };

  // Helper function to extract departure from slug
  const extractDepartureFromSlug = (slugText: string | undefined) => {
    if (!slugText) return null;

    // Check for departure indicators in slug
    if (
      slugText.includes("-tu-tphcm") ||
      slugText.includes("-tu-ho-chi-minh") ||
      slugText.includes("-tu-sai-gon")
    ) {
      return "TP. Hồ Chí Minh";
    }

    if (slugText.includes("-tu-ha-noi") || slugText.includes("-tu-hn")) {
      return "Hà Nội";
    }

    if (slugText.includes("-tu-da-nang")) {
      return "Đà Nẵng";
    }

    return null;
  };

  useEffect(() => {
    const loadTour = async () => {
      try {
        console.log("🔍 Loading tour with slug:", slug);
        console.log("🔍 Current URL:", window.location.href);
        console.log("🔍 Full URL params:", params);

        // First try exact slug match
        let response = await tourService.getTourBySlug(slug);

        // Enhanced logging for debugging
        console.log("🎯 Tour response:", response);
        console.log("🎯 Response success:", response.success);

        if (response.success) {
          console.log("🎯 Response data:", response.data);
          console.log("🎯 Found tour ID:", response.data?._id);
          console.log("🎯 Found tour slug:", response.data?.slug);
          console.log("🎯 Found tour title:", response.data?.title);
          console.log(
            "🎯 Departure location:",
            response.data?.departureLocation?.name
          );

          // Check if the tour title and departure location match
          const titleContainsDeparture = checkTitleContainsDeparture(
            response.data?.title,
            response.data?.departureLocation?.name
          );

          console.log("🔍 Title contains departure:", titleContainsDeparture);

          // If the title contains a departure location that doesn't match the actual departure
          if (!titleContainsDeparture) {
            console.log(
              "⚠️ WARNING: Title departure might not match actual departure location"
            );

            // Try to extract departure from title
            const departureFromTitle = extractDepartureFromTitle(
              response.data?.title
            );
            console.log(
              "🔍 Extracted departure from title:",
              departureFromTitle
            );

            if (
              departureFromTitle &&
              departureFromTitle !== response.data?.departureLocation?.name
            ) {
              console.log("⚠️ Departure mismatch detected!");
              console.log(`   Title indicates: ${departureFromTitle}`);
              console.log(
                `   Data indicates: ${response.data?.departureLocation?.name}`
              );

              // Log warning but still use the returned data
              console.log(
                "⚠️ Using data as returned from API - check validate-departures endpoint"
              );
            }
          }

          // Set the tour data
          setTour(response.data);
        } else {
          console.log("🎯 Response error:", response.message);
        }

        // If not found, try partial matching
        if (!response.success) {
          console.log("❌ Exact slug not found, trying partial matching...");

          // Get all tours and find by partial title matching
          const allToursResponse = await tourService.getTours({ limit: 100 });
          if (allToursResponse.success) {
            const tours = allToursResponse.data.tours;
            console.log(
              "📋 All available tours:",
              tours.map((t) => ({
                id: t._id,
                title: t.title,
                slug: t.slug,
                departure: t.departureLocation?.name
              }))
            );

            // Try to match by slug part
            const exactSlugParts = slug.split("-");
            console.log("🔍 Slug parts to match:", exactSlugParts);

            // First, try to match tour with departure location in slug
            const departureMatches = exactSlugParts.some(
              (part) =>
                part === "tphcm" || part === "ha-noi" || part === "da-nang"
            );

            console.log(
              "🔍 Slug contains departure location:",
              departureMatches
            );

            // Try to extract departure from slug
            const departureFromSlug = extractDepartureFromSlug(slug);
            console.log("🔍 Extracted departure from slug:", departureFromSlug);

            // First look for tours with matching departure if we could extract one
            let matchedTour = null;

            if (departureFromSlug) {
              console.log(
                "🔍 Looking for tours with departure:",
                departureFromSlug
              );
              matchedTour = tours.find(
                (tour) =>
                  tour.slug.includes(slug) &&
                  tour.departureLocation?.name === departureFromSlug
              );

              if (matchedTour) {
                console.log(
                  "✅ Found matching tour with correct departure:",
                  matchedTour.title
                );
              }
            }

            // If no match yet, try a more general title match
            if (!matchedTour) {
              // Try to find tour by matching title keywords
              const slugKeywords = slug
                .split("-")
                .filter((word) => word.length > 2);
              console.log("🔍 Searching with keywords:", slugKeywords);

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

                console.log(
                  `🔍 Checking tour: ${tour.title}, match count: ${matchCount}, departure: ${tour.departureLocation?.name}`
                );
                return matchCount >= Math.min(3, slugKeywords.length * 0.6);
              });
            }

            if (matchedTour) {
              console.log("✅ Found matching tour:", matchedTour.title);
              console.log(
                "🔍 Matched tour departure:",
                matchedTour.departureLocation?.name
              );
              setTour(matchedTour);
            } else {
              console.log("❌ No matching tour found");
            }
          }
        } else if (response.success && response.data) {
          console.log("✅ Setting tour data:", response.data);
          console.log(
            "🔍 Tour departure location:",
            response.data.departureLocation?.name
          );
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
        const destinationId = (tour as any)?.destinationId?._id || tour.destinationId;
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
    setSelectedImageIndex(index);
    setShowGallery(true);
    document.body.style.overflow = "hidden";
  };

  const closeGallery = () => {
    setShowGallery(false);
    document.body.style.overflow = "unset";
  };

  const nextImage = () => {
    if (tour) {
      setSelectedImageIndex((prev) => (prev + 1) % tour.images.length);
    }
  };

  const prevImage = () => {
    if (tour) {
      setSelectedImageIndex(
        (prev) => (prev - 1 + tour.images.length) % tour.images.length
      );
    }
  };

  const calculateTotalPrice = () => {
    if (!tour) return 0;

    const discountedPrice = tourService.getDiscountedPrice(
      tour.price,
      tour.discount
    );
    const adultTotal = selectedParticipants.adult * discountedPrice;
    const childTotal =
      selectedParticipants.child *
      tourService.getDiscountedPrice(tour.pricingByAge.child, tour.discount);
    const infantTotal =
      selectedParticipants.infant *
      tourService.getDiscountedPrice(tour.pricingByAge.infant, tour.discount);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100 flex items-center justify-center">
        <LoadingSpinner
          type="travel"
          size="xl"
          text="Đang tải thông tin tour..."
        />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <div className="text-6xl mb-4">😕</div>
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

  // Parse itinerary from new structure - Enhanced debugging
  const getItineraryDays = (): ItineraryDay[] => {
    console.log("🔍 Processing itinerary for tour:", tour?._id);
    console.log("🔍 Tour title:", tour?.title);
    console.log("🔍 Full tour object:", tour);
    console.log("🔍 Itinerary field specifically:", tour?.itinerary);
    console.log("🔍 Itinerary type:", typeof tour?.itinerary);
    console.log("🔍 Itinerary is null?:", tour?.itinerary === null);
    console.log("🔍 Itinerary is undefined?:", tour?.itinerary === undefined);

    if (!tour?.itinerary) {
      console.log("❌ No itinerary found - returning empty array");
      return [];
    }

    const itinerary = tour.itinerary;
    console.log("📊 Itinerary content:", itinerary);
    console.log("📊 Itinerary type:", typeof itinerary);
    console.log("📊 Is array:", Array.isArray(itinerary));

    // Handle object-based itinerary (new format)
    if (
      typeof itinerary === "object" &&
      !Array.isArray(itinerary) &&
      itinerary !== null
    ) {
      const days: ItineraryDay[] = [];

      // Get all keys and filter for day keys
      const allKeys = Object.keys(itinerary);
      console.log("🔑 All keys:", allKeys);

      // Find day keys (day1, day2, etc.)
      const dayKeys = allKeys.filter((key) => /^day\d+$/i.test(key));
      console.log("📅 Day keys found:", dayKeys);

      if (dayKeys.length === 0) {
        console.log("❌ No day keys found in itinerary object");
        console.log("🔍 Available keys:", allKeys);
        console.log(
          "🔍 Sample key values:",
          allKeys.slice(0, 3).map((key) => ({ [key]: itinerary[key] }))
        );
        return [];
      }

      // Sort day keys by number
      const sortedDayKeys = dayKeys.sort((a, b) => {
        const numA = parseInt(a.replace(/day/i, "")) || 0;
        const numB = parseInt(b.replace(/day/i, "")) || 0;
        return numA - numB;
      });

      console.log("📅 Sorted day keys:", sortedDayKeys);

      // Process each day
      sortedDayKeys.forEach((dayKey, index) => {
        const dayData = itinerary[dayKey];
        console.log(`📝 Processing ${dayKey}:`, dayData);
        console.log(`📝 Day data type:`, typeof dayData);
        console.log(
          `📝 Day data keys:`,
          dayData ? Object.keys(dayData) : "N/A"
        );

        if (dayData && typeof dayData === "object") {
          // Extract title and description
          const title = dayData.title || `Ngày ${index + 1}`;
          const description = dayData.description || "";

          console.log(`📝 Extracted title:`, title);
          console.log(`📝 Extracted description length:`, description.length);

          if (title && description) {
            days.push({ title, description });
            console.log(`✅ Added ${dayKey}:`, {
              title: title.substring(0, 50) + "...",
              descLength: description.length
            });
          } else {
            console.log(`⚠️ Missing data in ${dayKey}:`, {
              hasTitle: !!title,
              hasDescription: !!description,
              titleValue: title,
              descValue: description?.substring(0, 100) + "..."
            });
          }
        } else {
          console.log(`❌ Invalid day data for ${dayKey}:`, typeof dayData);
        }
      });

      console.log("🎉 Total days processed:", days.length);
      return days;
    }

    // Handle array-based itinerary (legacy format)
    if (Array.isArray(itinerary)) {
      console.log("📋 Processing as array structure");
      console.log("📋 Array length:", itinerary.length);
      console.log("📋 Array content sample:", itinerary.slice(0, 2));
      return itinerary.map(
        (item, index): ItineraryDay => ({
          title: `Ngày ${index + 1}`,
          description:
            typeof item === "string"
              ? item
              : item?.description || JSON.stringify(item)
        })
      );
    }

    console.log("❌ Unknown itinerary format");
    console.log("❌ Itinerary value:", itinerary);
    return [];
  };

  const itineraryDays = getItineraryDays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
      <Header />

      {/* Breadcrumb */}
      <div className="pt-24 pb-2 md:pb-4">
        <div className="container mx-auto px-4">
          <nav className="text-xs md:text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
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
            <span className="text-gray-800 font-medium">{tour.title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12 md:pb-16">
        {/* Use flex-col on mobile and grid on larger screens */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content - Full width on mobile */}
          <div className="lg:col-span-2">
            {/* Hero Gallery */}
            <div
              className={`bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden mb-6 md:mb-8 transition-all duration-1000 ${
                isVisible ? "animate-fade-in" : "opacity-0"
              }`}
            >
              <div className="relative h-56 sm:h-64 md:h-80 lg:h-96">
                <div
                  className="w-full h-full bg-cover bg-center cursor-pointer"
                  style={{
                    backgroundImage: `url('${
                      tour.images[selectedImageIndex] || tour.images[0]
                    }')`
                  }}
                  onClick={() => openGallery(selectedImageIndex)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Gallery Controls */}
                <button
                  onClick={() => openGallery(selectedImageIndex)}
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
                  <span className="text-sm font-medium">
                    Xem ảnh ({tour.images.length})
                  </span>
                </button>

                {/* Navigation arrows */}
                {tour.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) =>
                          prev === 0 ? tour.images.length - 1 : prev - 1
                        );
                      }}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(
                          (prev) => (prev + 1) % tour.images.length
                        );
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {tour.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === selectedImageIndex
                          ? "bg-white"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Thumbnail strip - horizontally scrollable on mobile */}
              {tour.images.length > 1 && (
                <div className="p-3 md:p-4 border-t border-gray-200">
                  <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 snap-x">
                    {tour.images.slice(0, 8).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-14 h-10 md:w-16 md:h-12 rounded-lg overflow-hidden border-2 transition-colors snap-start ${
                          index === selectedImageIndex
                            ? "border-blue-500"
                            : "border-gray-200"
                        }`}
                      >
                        <div
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url('${image}')` }}
                        />
                      </button>
                    ))}
                    {tour.images.length > 8 && (
                      <div className="flex-shrink-0 w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 font-medium">
                        +{tour.images.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tour Info */}
            <div
              className={`bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 transition-all duration-1000 delay-300 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 md:mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4">
                    {tour.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                    <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                      <svg
                        className="w-4 h-4 mr-1 text-blue-600"
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
                      <span className="font-medium">Khởi hành từ:</span>
                      <span className="ml-1 text-blue-700">
                        {tour.departureLocation.name}
                      </span>
                    </div>
                    <div className="flex items-center">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Thời gian: {tour.duration}</span>
                    </div>
                    <div className="flex items-center">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(tour.startDate).toLocaleDateString("vi-VN")} -{" "}
                      {new Date(tour.endDate).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>
                <div className="text-right mt-3 md:mt-0">
                  {tour.rating && tour.rating > 0 && (
                    <div className="flex items-center mb-2">
                      <span className="text-yellow-500 text-lg">⭐</span>
                      <span className="ml-1 font-semibold">{tour.rating}</span>
                      <span className="ml-1 text-gray-500">
                        ({tour.reviewCount || 0} đánh giá)
                      </span>
                    </div>
                  )}
                  {tour.isFeatured && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      ⭐ Tour nổi bật
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 md:mb-3">
                  Mô tả tour
                </h3>
                {/* Show warning if the title doesn't match the departure location */}
                {tour.title &&
                  tour.departureLocation &&
                  !checkTitleContainsDeparture(
                    tour.title,
                    tour.departureLocation.name
                  ) && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <div className="flex items-start">
                        <div className="text-yellow-600 mr-2">⚠️</div>
                        <div>
                          <h5 className="font-medium text-yellow-800">
                            Lưu ý về điểm khởi hành
                          </h5>
                          <p className="text-sm text-yellow-700">
                            Tour này sẽ khởi hành từ{" "}
                            <strong>{tour.departureLocation.name}</strong>. Vui
                            lòng kiểm tra thông tin chi tiết với nhân viên tư
                            vấn.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                <p className="text-gray-600 leading-relaxed">
                  {tour.description}
                </p>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 md:mb-3">
                  Tình trạng chỗ
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-4">
                    <span className="text-green-600 font-medium">
                      Còn {tour.availableSeats} chỗ trống
                    </span>
                    <span className="text-gray-500">
                      / {tour.seats} chỗ tối đa
                    </span>
                  </div>
                  <div className="w-full sm:w-48">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${(tour.availableSeats / tour.seats) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Itinerary - Enhanced for new structure */}
            <div
              className={`bg-white rounded-2xl shadow-lg p-6 mb-8 transition-all duration-1000 delay-500 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Lịch trình tour
              </h3>

              {itineraryDays.length > 0 ? (
                <div className="space-y-8">
                  {itineraryDays.map((day, index) => (
                    <div key={index} className="relative">
                      {/* Timeline line */}
                      {index !== itineraryDays.length - 1 && (
                        <div className="absolute left-5 top-12 w-0.5 h-full bg-gradient-to-b from-blue-300 to-blue-100"></div>
                      )}

                      <div className="flex space-x-4">
                        {/* Day number circle */}
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg relative z-10">
                          {index + 1}
                        </div>

                        <div className="flex-1 pb-4">
                          {/* Day title */}
                          <div className="mb-3">
                            <h4 className="text-lg font-bold text-gray-800 mb-1">
                              {day.title}
                            </h4>
                            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
                          </div>

                          {/* Day description */}
                          <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border-l-4 border-blue-400 shadow-sm">
                            <div className="text-gray-700 leading-relaxed space-y-3">
                              {day.description
                                .split("\n")
                                .map((paragraph, paragraphIndex) => {
                                  if (!paragraph.trim()) return null;

                                  return (
                                    <div key={paragraphIndex}>
                                      {paragraph
                                        .trim()
                                        .startsWith("Lựa chọn") ? (
                                        <div className="font-semibold text-blue-700 bg-blue-100 px-3 py-2 rounded-lg mb-2">
                                          📋 {paragraph.trim()}
                                        </div>
                                      ) : paragraph.trim().includes(":") &&
                                        paragraph.length < 100 ? (
                                        <h5 className="font-semibold text-gray-800 mt-4 mb-2 flex items-center">
                                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                          {paragraph.trim()}
                                        </h5>
                                      ) : (
                                        <div className="text-gray-600 leading-relaxed">
                                          <p className="mb-2">
                                            {paragraph.trim()}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>

                            {/* Activity icons based on content */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              {day.description.includes("tắm biển") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  🏊‍♀️ Tắm biển
                                </span>
                              )}
                              {day.description.includes("Safari") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  🦁 Safari
                                </span>
                              )}
                              {day.description.includes("VinWonder") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  🎢 VinWonder
                                </span>
                              )}
                              {day.description.includes("cano") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                                  🛥️ Cano
                                </span>
                              )}
                              {day.description.includes("chùa") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  🏛️ Chùa
                                </span>
                              )}
                              {day.description.includes("Grand World") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  🏰 Grand World
                                </span>
                              )}
                              {day.description.includes("Dinh Cậu") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  ⛩️ Dinh Cậu
                                </span>
                              )}
                              {day.description.includes("Sunset Town") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  🌅 Sunset Town
                                </span>
                              )}
                              {day.description.includes("Cầu Hôn") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                  💕 Cầu Hôn
                                </span>
                              )}
                              {day.description.includes("ngọc trai") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  🦪 Ngọc trai
                                </span>
                              )}
                              {day.description.includes("lặn ngắm san hô") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  🐠 Lặn ngắm san hô
                                </span>
                              )}
                              {day.description.includes("tiêu") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  🌶️ Vườn tiêu
                                </span>
                              )}
                              {day.description.includes("nước mắm") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  🐟 Nước mắm
                                </span>
                              )}
                              {day.description.includes("rượu Sim") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  🍷 Rượu Sim
                                </span>
                              )}
                              {(day.description.includes("Ăn sáng") ||
                                day.description.includes("Ăn trưa") ||
                                day.description.includes("Ăn tối")) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  🍽️ Bao gồm bữa ăn
                                </span>
                              )}
                            </div>

                            {/* Add detailed breakdown for complex activities */}
                            {day.description.includes("Lựa chọn") && (
                              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h6 className="font-semibold text-yellow-800 mb-2 flex items-center">
                                  <span className="mr-2">⚡</span>
                                  Hoạt động tùy chọn
                                </h6>
                                <p className="text-sm text-yellow-700">
                                  Tour cung cấp nhiều lựa chọn hoạt động để bạn
                                  có thể tùy chỉnh trải nghiệm theo sở thích.
                                  Chi phí cho các hoạt động tự túc sẽ được hướng
                                  dẫn viên thông báo cụ thể.
                                </p>
                              </div>
                            )}

                            {/* Time indicators */}
                            {(day.description.includes("sáng") ||
                              day.description.includes("chiều") ||
                              day.description.includes("tối")) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {day.description.includes("sáng") && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                    🌅 Buổi sáng
                                  </span>
                                )}
                                {day.description.includes("chiều") && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                    ☀️ Buổi chiều
                                  </span>
                                )}
                                {day.description.includes("tối") && (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                    🌙 Buổi tối
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📋</div>
                  <h4 className="text-lg font-medium mb-2">
                    Lịch trình đang được cập nhật
                  </h4>
                  <p className="text-sm">
                    Thông tin chi tiết lịch trình tour sẽ được cập nhật sớm
                    nhất.
                  </p>
                  {process.env.NODE_ENV === "development" && (
                    <div className="mt-4 text-xs text-red-500">
                      Debug: Itinerary type = {typeof tour?.itinerary}, Keys ={" "}
                      {tour?.itinerary
                        ? Object.keys(tour.itinerary).join(", ")
                        : "none"}
                    </div>
                  )}
                </div>
              )}

              {/* Tour highlights */}
              <div className="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-emerald-600 mr-2">✨</span>
                  Điểm nổi bật của tour
                </h5>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Khám phá VinWonder & Safari
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Tắm biển Bãi Sao tuyệt đẹp
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Chiêm ngưỡng Cầu Hôn lãng mạn
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Trải nghiệm Grand World
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar - Displayed below content on mobile, in sidebar on desktop */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <div
              className={`bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 sticky top-24 transition-all duration-1000 delay-700 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
            >
              {/* Price Display */}
              <div className="mb-6">
                <div className="flex items-baseline space-x-2 mb-2">
                  {tour.discount > 0 && (
                    <span className="text-base md:text-lg text-gray-500 line-through">
                      {tourService.formatPrice(tour.price)}
                    </span>
                  )}
                  <span className="text-2xl md:text-3xl font-bold text-green-600">
                    {tourService.formatPrice(
                      tourService.getDiscountedPrice(tour.price, tour.discount)
                    )}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">Giá/người lớn</p>
                {tour.discount > 0 && (
                  <span className="inline-block mt-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                    Giảm {tour.discount}%
                  </span>
                )}
              </div>

              {/* Participant Selection - Mobile friendly touchable area */}
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Chọn số lượng khách
                </h4>

                {/* Adults */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Người lớn</span>
                    <p className="text-sm text-gray-600">
                      {tourService.formatPrice(
                        tourService.getDiscountedPrice(
                          tour.pricingByAge.adult,
                          tour.discount
                        )
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        updateParticipants(
                          "adult",
                          selectedParticipants.adult - 1
                        )
                      }
                      disabled={selectedParticipants.adult <= 1}
                      className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-lg">-</span>
                    </button>
                    <span className="w-8 text-center font-medium bg-white rounded-md px-2 py-1 border border-blue-200 text-blue-700">
                      {selectedParticipants.adult}
                    </span>
                    <button
                      onClick={() =>
                        updateParticipants(
                          "adult",
                          selectedParticipants.adult + 1
                        )
                      }
                      className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                </div>

                {/* Children - using bigger touch targets */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Trẻ em</span>
                    <p className="text-sm text-gray-600">
                      {tourService.formatPrice(
                        tourService.getDiscountedPrice(
                          tour.pricingByAge.child,
                          tour.discount
                        )
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        updateParticipants(
                          "child",
                          selectedParticipants.child - 1
                        )
                      }
                      disabled={selectedParticipants.child <= 0}
                      className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-lg">-</span>
                    </button>
                    <span className="w-8 text-center font-medium bg-white rounded-md px-2 py-1 border border-blue-200 text-blue-700">
                      {selectedParticipants.child}
                    </span>
                    <button
                      onClick={() =>
                        updateParticipants(
                          "child",
                          selectedParticipants.child + 1
                        )
                      }
                      className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-700">Em bé</span>
                    <p className="text-sm text-gray-600">
                      {tourService.formatPrice(
                        tourService.getDiscountedPrice(
                          tour.pricingByAge.infant,
                          tour.discount
                        )
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        updateParticipants(
                          "infant",
                          selectedParticipants.infant - 1
                        )
                      }
                      disabled={selectedParticipants.infant <= 0}
                      className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-lg">-</span>
                    </button>
                    <span className="w-8 text-center font-medium bg-white rounded-md px-2 py-1 border border-blue-200 text-blue-700">
                      {selectedParticipants.infant}
                    </span>
                    <button
                      onClick={() =>
                        updateParticipants(
                          "infant",
                          selectedParticipants.infant + 1
                        )
                      }
                      className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">
                    Tổng cộng:
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-green-600">
                    {tourService.formatPrice(calculateTotalPrice())}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedParticipants.adult +
                    selectedParticipants.child +
                    selectedParticipants.infant}{" "}
                  khách
                </p>
              </div>

              {/* Booking Button - Larger on mobile for easy tapping */}
              <button
                disabled={tour.availableSeats === 0}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-4 md:py-4 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base md:text-base"
              >
                {tour.availableSeats === 0 ? "Hết chỗ" : "Đặt Tour Ngay"}
              </button>

              {/* Contact Info */}
              <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                <h5 className="font-semibold text-gray-800 mb-2">
                  Cần hỗ trợ?
                </h5>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <a href="tel:081820319" className="hover:text-blue-600">
                      Hotline: 081 820 319
                    </a>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href="mailto:info@lutrip.com"
                      className="hover:text-blue-600"
                    >
                      Email: info@lutrip.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policies & Information (collapsible) */}
      <div className="container mx-auto px-4 pb-10">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
            Chính sách giá
          </h2>

          {/* Giá tour bao gồm */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => toggleSection("include")}
              className="w-full flex items-center justify-between py-3 md:py-4"
            >
              <span className="text-base md:text-lg font-semibold text-gray-800">
                Giá tour bao gồm
              </span>
              <span className="text-gray-500">
                {openSections.include ? "−" : "+"}
              </span>
            </button>
            {openSections.include && (
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Vé máy bay khứ hồi.</li>
                <li>Chi phí xe máy lạnh theo chương trình.</li>
                <li>Chi phí khách sạn: 2-3 khách/phòng.</li>
                <li>Chi phí ăn - uống theo chương trình.</li>
                <li>Chi phí tham quan theo chương trình.</li>
                <li>Chi phí Hướng dẫn viên tiếng Việt.</li>
                <li>Quà tặng: Nón, nước suối, khăn lạnh.</li>
              </ul>
            )}
          </div>

          {/* Giá tour không bao gồm */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => toggleSection("exclude")}
              className="w-full flex items-center justify-between py-3 md:py-4"
            >
              <span className="text-base md:text-lg font-semibold text-gray-800">
                Giá tour không bao gồm
              </span>
              <span className="text-gray-500">
                {openSections.exclude ? "−" : "+"}
              </span>
            </button>
            {openSections.exclude && (
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>
                  Chi phí tham quan - ăn uống ngoài chương trình, giặt ủi, điện thoại
                  và các chi phí cá nhân.
                </li>
              </ul>
            )}
          </div>

          {/* Giá trẻ em */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => toggleSection("children")}
              className="w-full flex items-center justify-between py-3 md:py-4"
            >
              <span className="text-base md:text-lg font-semibold text-gray-800">
                Giá trẻ em
              </span>
              <span className="text-gray-500">
                {openSections.children ? "−" : "+"}
              </span>
            </button>
            {openSections.children && (
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  Trẻ em dưới 2 tuổi: thu 400.000đ/trẻ. Gia đình tự lo cho bé ăn
                  ngủ.
                </li>
                <li>
                  Trẻ em từ 2 đến dưới 6 tuổi: tiêu chuẩn gồm vé máy bay. Gia đình
                  tự lo cho bé ăn ngủ và phí tham quan (nếu có).
                </li>
                <li>
                  Hai người lớn chỉ được kèm một trẻ em dưới 6 tuổi. Từ trẻ thứ 2
                  trở lên, mỗi em phải đóng bằng giá trẻ em từ 6-11 tuổi.
                </li>
                <li>
                  Trẻ em từ 6 - 11 tuổi: tiêu chuẩn gồm vé máy bay, ăn uống và tham
                  quan theo chương trình, ngủ chung giường với phụ huynh.
                </li>
                <li>
                  Trẻ em trên 11 tuổi: áp dụng giá và các tiêu chuẩn dịch vụ như
                  người lớn.
                </li>
              </ul>
            )}
          </div>

          {/* Chính sách hủy / phạt */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => toggleSection("cancellation")}
              className="w-full flex items-center justify-between py-3 md:py-4"
            >
              <span className="text-base md:text-lg font-semibold text-gray-800">
                Chính sách hủy / phạt
              </span>
              <span className="text-gray-500">
                {openSections.cancellation ? "−" : "+"}
              </span>
            </button>
            {openSections.cancellation && (
              <div className="space-y-3 text-gray-700">
                <div>
                  <p className="font-medium mb-2">Lưu ý về chuyển hoặc hủy tour</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Quy định vé máy bay: Chương trình hợp tác với hãng hàng không
                      Vietnam Airlines nên có một số lưu ý:
                    </li>
                    <li>Giá vé máy bay không bao gồm suất ăn/uống trên máy bay</li>
                    <li>
                      Không được hoàn hoặc hủy vé máy bay. Nếu hủy, vui lòng chịu
                      phạt 100% chi phí vé máy bay
                    </li>
                    <li>
                      Khi đăng ký vé máy bay, quý khách cung cấp họ và tên, ngày tháng
                      năm sinh (đúng từng ký tự ghi trong hộ chiếu hoặc CMND/CCCD)
                    </li>
                    <li>
                      Không được thay đổi thông tin đặt chỗ: họ tên hành khách, chuyến
                      bay, ngày bay, chặng bay, tách đoàn, gia hạn vé
                    </li>
                    <li>Số lượng khách tối thiểu để tổ chức tour: 10 khách/đoàn</li>
                    <li>
                      Du khách được miễn cước 1 kiện (23 kg) hành lý ký gởi và 1 kiện
                      (10 kg) hành lý xách tay
                    </li>
                    <li>
                      Trường hợp hủy tour do sự cố khách quan như thiên tai, dịch bệnh
                      hoặc do máy bay hoãn - hủy chuyến, Lutrip sẽ không chịu trách
                      nhiệm bồi thường thêm bất kỳ chi phí nào khác ngoài việc hoàn
                      trả chi phí những dịch vụ chưa được sử dụng của tour đó (ngoại
                      trừ chi phí vé máy bay)
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">
                    Trường hợp hủy vé landtour, quý khách vui lòng thanh toán các khoản
                    sau:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Chuyển đổi tour sang ngày khác và báo trước ngày khởi hành trước
                      30 ngày (trừ thứ 7, chủ nhật, lễ, tết) sẽ không chịu phí (không
                      áp dụng tour KS 4-5 sao). Nếu trễ hơn sẽ căn cứ theo quy định
                      hủy phạt phía dưới và chỉ được chuyển ngày khởi hành tour 1 lần.
                    </li>
                    <li>
                      Hủy vé trước ngày khởi hành từ 15 ngày trở lên (trừ thứ 7, chủ
                      nhật, lễ, tết), chịu phạt 50% tiền tour hoặc 100% tiền cọc.
                    </li>
                    <li>
                      Hủy vé trước ngày khởi hành từ 8 - 14 ngày (trừ thứ 7, chủ nhật,
                      lễ, tết), chịu phạt 80% tiền tour hoặc 100% tiền cọc.
                    </li>
                    <li>
                      Hủy vé trong vòng 7 ngày hoặc ngay ngày khởi hành, chịu phạt 100%
                      tiền tour.
                    </li>
                    <li>
                      Sau khi hủy tour, du khách vui lòng đến nhận tiền trong vòng 15
                      ngày kể từ ngày kết thúc tour. Chúng tôi chỉ thanh toán trong
                      khoảng thời gian nói trên.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Thông tin về bảo hiểm du lịch */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => toggleSection("insurance")}
              className="w-full flex items-center justify-between py-3 md:py-4"
            >
              <span className="text-base md:text-lg font-semibold text-gray-800">
                Thông tin về bảo hiểm du lịch
              </span>
              <span className="text-gray-500">
                {openSections.insurance ? "−" : "+"}
              </span>
            </button>
            {openSections.insurance && (
              <div className="space-y-2 text-gray-700">
                <p>
                  Công ty TNHH Một Thành Viên Dịch vụ Lữ hành Lutrip thực hiện chương
                  trình TẶNG MIỄN PHÍ BẢO HIỂM DU LỊCH NỘI ĐỊA dành cho tất cả du khách
                  tham gia tour trọn gói trên tất cả các tuyến du lịch nội địa, khởi
                  hành trên toàn quốc, với mức bảo hiểm tối đa lên đến
                  150.000.000 VNĐ/khách/vụ.
                </p>
                <p>
                  Toàn bộ phí bảo hiểm được tặng miễn phí cho khách hàng của Lutrip với
                  chương trình, giá và chất lượng dịch vụ tour không đổi.
                </p>
                <p>
                  Thông tin chi tiết, vui lòng liên hệ các văn phòng thuộc Hệ thống
                  Lutrip trên toàn quốc.
                </p>
              </div>
            )}
          </div>

          {/* Thông tin khác */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => toggleSection("others")}
              className="w-full flex items-center justify-between py-3 md:py-4"
            >
              <span className="text-base md:text-lg font-semibold text-gray-800">
                Thông tin khác
              </span>
              <span className="text-gray-500">
                {openSections.others ? "−" : "+"}
              </span>
            </button>
            {openSections.others && (
              <div className="space-y-3 text-gray-700">
                <p className="font-medium">Giấy tờ tùy thân</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Du khách mang theo giấy tờ tùy thân còn thời hạn sử dụng: CMND /
                    CCCD hoặc Hộ chiếu. Đối với du khách là Việt kiều, Quốc tế nhập
                    cảnh Việt Nam bằng visa rời, vui lòng mang theo visa khi đăng ký và
                    khi đi tour.
                  </li>
                  <li>
                    Khách lớn tuổi (từ 70 tuổi trở lên), khách tàn tật tham gia tour,
                    phải có thân nhân đi kèm và cam kết đảm bảo đủ sức khỏe.
                  </li>
                  <li>
                    Trẻ em dưới 14 tuổi khi đi tour phải mang theo giấy khai sinh hoặc
                    hộ chiếu. Trẻ em từ 14 tuổi trở lên phải mang theo CMND/CCCD.
                  </li>
                  <li>Tất cả giấy tờ tùy thân mang theo đều phải bản chính.</li>
                  <li>
                    Du khách mang theo hành lý gọn nhẹ và tự bảo quản hành lý, tiền
                    bạc, tư trang trong suốt thời gian đi du lịch.
                  </li>
                  <li>
                    Khách Việt Nam ở cùng phòng với khách Quốc tế hoặc Việt kiều yêu cầu
                    phải có giấy hôn thú.
                  </li>
                  <li>Quý khách có mặt tại sân bay trước 2 tiếng so với giờ khởi hành.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Liên hệ */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => toggleSection("contact")}
              className="w-full flex items-center justify-between py-3 md:py-4"
            >
              <span className="text-base md:text-lg font-semibold text-gray-800">
                Liên hệ
              </span>
              <span className="text-gray-500">
                {openSections.contact ? "−" : "+"}
              </span>
            </button>
            {openSections.contact && (
              <div className="space-y-1 text-gray-700">
                <p>Công ty TNHH LuTrip - Địa chỉ: 12 Nguyễn Văn Bảo, phường Hạnh Thông, Thành phố Hồ Chí Minh </p>
                <p>Đường dây nóng: 0818220319 </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related tours */}
      <div className="container mx-auto px-4 pb-12">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
          Tour liên quan
        </h3>
        {isLoadingRelated ? (
          <div className="py-6 text-gray-500">Đang tải tour liên quan...</div>
        ) : relatedTours.length === 0 ? (
          <div className="text-gray-500">Chưa có tour liên quan.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedTours.map((t) => (
              <Link
                key={t._id}
                href={`/tours/detail/${t.slug}`}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="h-40 relative">
                  <div
                    className="w-full h-full bg-gray-200 bg-cover bg-center"
                    style={{ backgroundImage: `url('${(t.images && t.images[0]) || "/images/banner-tour.jpg"}')` }}
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 line-clamp-2 mb-1">{t.title}</h4>
                  <div className="text-sm text-gray-600 mb-2">
                    📍 {t.departureLocation?.name || "Khởi hành"}
                  </div>
                  <div className="font-bold text-emerald-600">
                    {tourService.formatPrice(
                      tourService.getDiscountedPrice(t.price, t.discount)
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Photo Gallery Modal - Better optimized for mobile */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
            aria-label="Close gallery"
          >
            <svg
              className="w-6 h-6 md:w-8 md:h-8"
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

          {tour.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
                aria-label="Previous image"
              >
                <svg
                  className="w-6 h-6 md:w-8 md:h-8"
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
                className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
                aria-label="Next image"
              >
                <svg
                  className="w-6 h-6 md:w-8 md:h-8"
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

          <div className="max-w-full max-h-[80vh] mx-2 md:mx-4">
            <img
              src={tour.images[selectedImageIndex]}
              alt={`${tour.title} - Ảnh ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {selectedImageIndex + 1} / {tour.images.length}
          </div>

          {tour.images.length > 1 && (
            <div className="absolute bottom-12 md:bottom-16 left-0 right-0 flex justify-center overflow-x-auto py-2">
              <div className="flex space-x-2 px-4 max-w-full">
                {tour.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-12 h-9 md:w-16 md:h-12 rounded-md overflow-hidden border-2 flex-shrink-0 ${
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
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}
