"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import ConfirmModal from "@/components/Modal/ConfirmModal";
import SuccessModal from "@/components/Modal/SuccessModal";
import { destinationService, Destination } from "@/services/destinationService";
import { tourService, Tour } from "@/services/tourService";
import { activityService } from "@/services/activityService";
import { LoadingSpinner } from "@/components/Loading";

const navItems = [
  { href: "/flights", label: "Vé Máy Bay" },
  { href: "/activity", label: "Giải Trí" }
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, loadingType } = useLoading();
  const { user, logout, isAuthLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDestinationsOpen, setIsDestinationsOpen] = useState(false);
  const [isToursOpen, setIsToursOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>(
    []
  );
  const [otherDestinations, setOtherDestinations] = useState<Destination[]>([]);
  const [featuredTours, setFeaturedTours] = useState<Tour[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<
    Array<{
      type: "tour" | "destination" | "activity";
      id: string;
      title: string;
      slug: string;
      image?: string;
      subtitle?: string;
    }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Refs for dropdown containers
  const destinationsRef = useRef<HTMLDivElement>(null);
  const toursRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load destinations and tours from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load destinations
        const destResponse = await destinationService.getDestinations({
          limit: 50
        });
        if (destResponse.success) {
          const allDestinations = destResponse.data.destinations;
          setDestinations(allDestinations);
          setPopularDestinations(
            allDestinations.filter((dest) => dest.popular)
          );
          setOtherDestinations(allDestinations.filter((dest) => !dest.popular));
        }

        // Load featured tours
        const toursResponse = await tourService.getFeaturedTours(6);
        if (toursResponse.success) {
          setFeaturedTours(toursResponse.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    setIsUserMenuOpen(false);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setShowLogoutSuccess(true);
  };

  const handleLogoutSuccessClose = () => {
    setShowLogoutSuccess(false);
  };

  // Navigation handler with loading
  const handleNavigation = (href: string) => {
    if (pathname !== href) {
      router.push(href);
    }
    // Mobile menu close
    setIsMobileMenuOpen(false);
    setIsDestinationsOpen(false);
    setIsToursOpen(false);
  };

  // Handle search input change with real API search
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Show suggestions if query has at least 2 characters
    if (query.length >= 2) {
      setIsSearching(true);
      try {
        // Perform parallel searches with limit
        const [toursResult, destinationsResult, activitiesResult] =
          await Promise.allSettled([
            tourService.getTours({ title: query, limit: 5 }),
            destinationService.getDestinations({ search: query, limit: 3 }),
            activityService.getActivities({ search: query, limit: 3 })
          ]);

        const suggestions: Array<{
          type: "tour" | "destination" | "activity";
          id: string;
          title: string;
          slug: string;
          image?: string;
          subtitle?: string;
        }> = [];

        // Add tour suggestions
        if (
          toursResult.status === "fulfilled" &&
          toursResult.value.success &&
          toursResult.value.data.tours.length > 0
        ) {
          toursResult.value.data.tours.forEach((tour) => {
            suggestions.push({
              type: "tour",
              id: tour._id,
              title: tour.title,
              slug: `tours/detail/${tour.slug}`,
              image: tour.images?.[0],
              subtitle: tour.departureLocation?.name
            });
          });
        }

        // Add activity suggestions
        if (
          activitiesResult.status === "fulfilled" &&
          activitiesResult.value.success &&
          activitiesResult.value.data.activities.length > 0
        ) {
          activitiesResult.value.data.activities.forEach((activity) => {
            suggestions.push({
              type: "activity",
              id: activity._id,
              title: activity.name,
              slug: `activity/${activity.slug}`,
              image: activity.gallery?.[0],
              subtitle: activity.location?.name
            });
          });
        }

        // Add destination suggestions
        if (
          destinationsResult.status === "fulfilled" &&
          destinationsResult.value.success &&
          destinationsResult.value.data.destinations.length > 0
        ) {
          destinationsResult.value.data.destinations.forEach((dest) => {
            suggestions.push({
              type: "destination",
              id: dest._id,
              title: dest.name,
              slug: `destinations/${dest.slug}`,
              image: dest.image,
              subtitle: dest.region
            });
          });
        }

        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error("Search error:", error);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    } else {
      setShowSuggestions(false);
      setSearchSuggestions([]);
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSuggestions(false);

      // Close mobile search if open
      if (isSearchOpen) {
        setIsSearchOpen(false);
      }
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (slug: string) => {
    router.push(`/${slug}`);
    setSearchQuery("");
    setShowSuggestions(false);

    // Close mobile search if open
    if (isSearchOpen) {
      setIsSearchOpen(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Close search suggestions if click is outside search container
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSuggestions(false);
      }

      // Close destinations dropdown if click is outside destinations container
      if (
        destinationsRef.current &&
        !destinationsRef.current.contains(target)
      ) {
        setIsDestinationsOpen(false);
      }

      // Close tours dropdown if click is outside tours container
      if (toursRef.current && !toursRef.current.contains(target)) {
        setIsToursOpen(false);
      }

      // Close user menu if click is outside user menu container
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDestinations = () => {
    setIsDestinationsOpen((prev) => !prev);
    setIsToursOpen(false);
  };

  const toggleTours = () => {
    setIsToursOpen((prev) => !prev);
    setIsDestinationsOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 shadow-sm border-b border-white/20">
        {/* Loading indicator */}
        {isLoading && loadingType === "navigation" && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-slide"></div>
          </div>
        )}

        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-slate-800 hover:text-blue-600 transition-colors flex-shrink-0"
            >
              <img
                src="/images/logo/logo-lutrip.png"
                alt="LuTrip Logo"
                className="h-12 w-auto sm:h-13" // tăng size logo mobile lên h-10, desktop giữ sm:h-13
              />
              {/* <span className="sm:inline text-2xl sm:text-2xl">LuTrip</span> */}
            </Link>

            {/* Desktop Navigation - Hidden on tablet, shown on large desktop */}
            <nav className="hidden xl:flex space-x-4 2xl:space-x-8">
              {/* Destinations Dropdown - click to open/close */}
              <div className="relative" ref={destinationsRef}>
                <button
                  type="button"
                  className={`relative font-medium transition-all duration-300 px-3 2xl:px-4 py-2 rounded-lg flex items-center space-x-1 text-sm 2xl:text-base ${
                    pathname.startsWith("/destinations")
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-slate-700 hover:text-blue-600 hover:bg-blue-50/50"
                  }`}
                  onClick={toggleDestinations}
                >
                  <span>Địa Điểm</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isDestinationsOpen ? "rotate-180" : ""
                    }`}
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
                  <span
                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-blue-600 transition-all duration-300 ${
                      pathname.startsWith("/destinations") || isDestinationsOpen
                        ? "w-full"
                        : "w-0"
                    }`}
                  ></span>
                </button>
                {isDestinationsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 xl:w-96 bg-white rounded-lg shadow-xl border border-gray-200 py-4 z-50">
                    {/* Popular Destinations */}
                    <div className="px-4 pb-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Điểm đến phổ biến
                      </h3>
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                        {popularDestinations.map((destination) => (
                          <Link
                            key={destination._id}
                            href={`/destinations/${
                              destination.slug || "loading"
                            }`}
                            className="block px-2 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                            onClick={() => setIsDestinationsOpen(false)}
                          >
                            <div className="font-medium text-xs">
                              {destination.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {destination.region}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Other Destinations */}
                    <div className="px-4 pt-3">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Điểm đến khác
                      </h3>
                      <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                        {otherDestinations.map((destination) => (
                          <Link
                            key={destination._id}
                            href={`/destinations/${
                              destination.slug || "loading"
                            }`}
                            className="block px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                            onClick={() => setIsDestinationsOpen(false)}
                          >
                            <span className="font-medium">
                              {destination.name}
                            </span>
                            <span className="ml-1 text-xs text-gray-500">
                              • {destination.region}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* View All Link */}
                    <div className="px-4 pt-3 border-t border-gray-100 mt-3">
                      <Link
                        href="/destinations"
                        className={`block w-full text-center py-2 rounded-md transition-colors font-medium text-sm ${
                          pathname.startsWith("/destinations")
                            ? "bg-blue-600 text-white"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                        onClick={() => setIsDestinationsOpen(false)}
                      >
                        Xem tất cả địa điểm
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              {/* Tours Dropdown - click to open/close */}
              <div className="relative" ref={toursRef}>
                <button
                  type="button"
                  className={`relative font-medium transition-all duration-300 px-3 2xl:px-4 py-2 rounded-lg flex items-center space-x-1 text-sm 2xl:text-base ${
                    pathname.startsWith("/tours")
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-slate-700 hover:text-blue-600 hover:bg-blue-50/50"
                  }`}
                  onClick={toggleTours}
                >
                  <span>Du Lịch</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isToursOpen ? "rotate-180" : ""
                    }`}
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
                  <span
                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-blue-600 transition-all duration-300 ${
                      pathname.startsWith("/tours") || isToursOpen
                        ? "w-full"
                        : "w-0"
                    }`}
                  ></span>
                </button>
                {isToursOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 xl:w-130 bg-white rounded-lg shadow-xl border border-gray-200 py-4 z-50">
                    {/* Popular Destinations with Tours */}
                    <div className="px-4 pb-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Tour theo địa điểm
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {destinations.map((destination) => (
                          <Link
                            key={destination._id}
                            href={`/tours/${destination.slug}`}
                            className="block p-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                            onClick={() => setIsToursOpen(false)}
                          >
                            <div className="font-medium text-xs">
                              {destination.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {destination.region}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Featured Tours */}
                    <div className="px-4 pt-3">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Tour nổi bật
                      </h3>
                      <div className="space-y-1">
                        {featuredTours.slice(0, 4).map((tour) => (
                          <Link
                            key={tour._id}
                            href={`/tours/detail/${tour.slug}`}
                            className="block px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                            onClick={() => setIsToursOpen(false)}
                          >
                            <div className="font-medium">{tour.title}</div>
                            <div className="text-xs text-gray-500">
                              {tour.duration} • {tour.price?.toLocaleString()}đ
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* View All Link */}
                    <div className="px-4 pt-3 border-t border-gray-100 mt-3">
                      <Link
                        href="/tours"
                        className={`block w-full text-center py-2 rounded-md transition-colors font-medium text-sm ${
                          pathname.startsWith("/tours")
                            ? "bg-blue-600 text-white"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                        onClick={() => setIsToursOpen(false)}
                      >
                        Xem tất cả tour
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Regular Nav Items */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative font-medium transition-all duration-300 px-3 2xl:px-4 py-2 rounded-lg group text-sm 2xl:text-base ${
                    pathname === item.href
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-slate-700 hover:text-blue-600 hover:bg-blue-50/50"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-blue-600 transition-all duration-300 ${
                      pathname === item.href
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
              ))}
            </nav>

            {/* Desktop Search and Auth - Responsive sizing */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
              {/* Search Bar with responsive width */}
              <div className="relative" ref={searchRef}>
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Tìm kiếm tour, địa điểm..."
                    className="w-48 lg:w-56 xl:w-72 2xl:w-80 pl-10 xl:pl-12 pr-4 py-2 xl:py-3 text-sm xl:text-base text-slate-700 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md transition-all duration-200 placeholder-gray-400"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (searchQuery.length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="absolute left-3 xl:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 xl:w-5 xl:h-5"
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
                  </button>
                </form>

                {/* Search Suggestions */}
                {showSuggestions && (
                  <div
                    className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800">
                        {isSearching ? "Đang tìm kiếm..." : "Gợi ý tìm kiếm"}
                      </h3>
                    </div>
                    {isSearching ? (
                      <div className="p-8 text-center">
                        <LoadingSpinner
                          type="dots"
                          size="sm"
                          showText={false}
                        />
                      </div>
                    ) : searchSuggestions.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Không tìm thấy kết quả phù hợp
                      </div>
                    ) : (
                      <>
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.type}-${suggestion.id}`}
                            className="p-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                            onClick={() =>
                              handleSuggestionClick(suggestion.slug)
                            }
                          >
                            <div className="flex items-center space-x-3">
                              {suggestion.image && (
                                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                  <img
                                    src={suggestion.image}
                                    alt={suggestion.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">
                                  {suggestion.title}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {suggestion.type === "tour" && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                      Tour
                                    </span>
                                  )}
                                  {suggestion.type === "activity" && (
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                      Hoạt động
                                    </span>
                                  )}
                                  {suggestion.type === "destination" && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                      Điểm đến
                                    </span>
                                  )}
                                  {suggestion.subtitle && (
                                    <span className="truncate">
                                      • {suggestion.subtitle}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="p-2 border-t border-gray-100">
                          <button
                            onClick={handleSearchSubmit}
                            className="w-full text-center py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors font-medium text-sm"
                          >
                            Xem tất cả kết quả cho "{searchQuery}"
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Auth Section with responsive sizing */}
              {isAuthLoading ? (
                <div className="flex items-center space-x-2 xl:space-x-3 bg-gray-100 rounded-full px-3 xl:px-4 py-2">
                  <LoadingSpinner type="dots" size="sm" showText={false} />
                  <span className="text-sm text-gray-500 hidden xl:inline">
                    Đang tải...
                  </span>
                </div>
              ) : user ? (
                <div className="relative" ref={userMenuRef}>
                  {/* User dropdown button */}
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-1 xl:space-x-2 text-slate-700 hover:text-blue-600 font-medium transition-colors px-2 xl:px-3 py-2 rounded-full hover:bg-blue-50 cursor-pointer text-sm xl:text-base"
                  >
                    <div className="w-7 h-7 xl:w-8 xl:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs xl:text-sm font-semibold overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        user.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="hidden xl:inline whitespace-nowrap text-ellipsis">
                      {user.fullName}
                    </span>

                    <svg
                      className="w-3 h-3 xl:w-4 xl:h-4"
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
                  </button>

                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Thông tin cá nhân
                      </Link>
                      <Link
                        href="/profile/booking"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Đặt chỗ của tôi
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 xl:space-x-3">
                  <Link
                    href="/login"
                    className="text-slate-700 hover:text-blue-600 font-medium transition-colors px-3 xl:px-5 py-2 xl:py-2.5 rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-200 text-sm xl:text-base"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium px-3 xl:px-5 py-2 xl:py-2.5 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg text-sm xl:text-base"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Controls - Show on tablet and smaller */}
            <div className="xl:hidden flex items-center space-x-2">
              {/* Mobile Search Button */}
              <button
                onClick={toggleSearch}
                className="text-slate-700 hover:text-blue-600 transition-colors p-2"
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
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="mobile-menu-button text-slate-700 hover:text-blue-600 transition-colors p-2"
              >
                <svg
                  className={`w-6 h-6 transform transition-transform $(
                    isMobileMenuOpen ? "rotate-90" : ""
                  )`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {isSearchOpen && (
            <div className="xl:hidden mt-4 pb-4 border-t border-gray-200 animate-slide-down">
              <div className="pt-4">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="w-full pl-12 pr-4 py-3 text-slate-700 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (searchQuery.length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
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
                  </button>
                </form>

                {/* Mobile Search Suggestions */}
                {showSuggestions && (
                  <div
                    className="mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isSearching ? (
                      <div className="p-8 text-center">
                        <LoadingSpinner
                          type="dots"
                          size="sm"
                          showText={false}
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Đang tìm kiếm...
                        </p>
                      </div>
                    ) : searchSuggestions.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Không tìm thấy kết quả phù hợp
                      </div>
                    ) : (
                      <>
                        {searchSuggestions.map((suggestion) => (
                          <div
                            key={`${suggestion.type}-${suggestion.id}`}
                            className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors last:border-0"
                            onClick={() =>
                              handleSuggestionClick(suggestion.slug)
                            }
                          >
                            <div className="flex items-center space-x-3">
                              {suggestion.image && (
                                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                  <img
                                    src={suggestion.image}
                                    alt={suggestion.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">
                                  {suggestion.title}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  {suggestion.type === "tour" && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                      Tour
                                    </span>
                                  )}
                                  {suggestion.type === "activity" && (
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                      Hoạt động
                                    </span>
                                  )}
                                  {suggestion.type === "destination" && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                      Điểm đến
                                    </span>
                                  )}
                                  {suggestion.subtitle && (
                                    <span className="truncate">
                                      • {suggestion.subtitle}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="p-3">
                          <button
                            onClick={handleSearchSubmit}
                            className="w-full text-center py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors font-medium text-sm"
                          >
                            Xem tất cả kết quả
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="mobile-nav xl:hidden mt-4 pb-4 border-t border-gray-200 animate-slide-down">
              <div className="flex flex-col space-y-2 pt-4">
                {/* Mobile Destinations Section */}
                <div className="mb-4">
                  <button
                    onClick={toggleDestinations}
                    className="w-full flex items-center justify-between font-medium text-slate-700 hover:text-blue-600 px-4 py-3 rounded-xl transition-all duration-300"
                  >
                    <span>Địa Điểm</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 $(
                        isDestinationsOpen ? "rotate-180" : ""
                      )`}
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
                  </button>

                  {/* Mobile Destinations Dropdown */}
                  {isDestinationsOpen && (
                    <div className="mt-2 ml-4 space-y-1">
                      {/* Popular destinations */}
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
                          Phổ biến
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {popularDestinations.map((destination) => (
                            <Link
                              key={destination._id}
                              href={`/destinations/${
                                destination.slug || "loading"
                              }`}
                              className="block px-2 py-1.5 text-xs text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => {
                                setIsDestinationsOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              <div className="font-medium">
                                {destination.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {destination.region}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Other destinations */}
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
                          Khác
                        </div>
                        <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                          {otherDestinations.map((destination) => (
                            <Link
                              key={destination._id}
                              href={`/destinations/${
                                destination.slug || "loading"
                              }`}
                              className="block px-2 py-1.5 text-xs text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => {
                                setIsDestinationsOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              <span className="font-medium">
                                {destination.name}
                              </span>
                              <span className="ml-1 text-xs text-gray-500">
                                • {destination.region}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* View all */}
                      <Link
                        href="/destinations"
                        className="block mx-2 mt-3 py-2 text-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                        onClick={() => {
                          setIsDestinationsOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Xem tất cả địa điểm
                      </Link>
                    </div>
                  )}
                </div>

                {/* Tours Section */}
                <div className="mb-4">
                  <button
                    onClick={toggleTours}
                    className="w-full flex items-center justify-between font-medium text-slate-700 hover:text-blue-600 px-4 py-3 rounded-xl transition-all duration-300"
                  >
                    <span>Du Lịch</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 $(
                        isToursOpen ? "rotate-180" : ""
                      )`}
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
                  </button>

                  {/* Mobile Tours Dropdown */}
                  {isToursOpen && (
                    <div className="mt-2 ml-4 space-y-1">
                      {/* Popular Destinations with Tours */}
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
                          Tour theo địa điểm
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {destinations.map((destination) => (
                            <Link
                              key={destination._id}
                              href={`/tours/${destination.slug}`}
                              className="block px-2 py-1.5 text-xs text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => {
                                setIsToursOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              <div className="font-medium">
                                {destination.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {destination.region}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Featured Tours */}
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
                          Tour nổi bật
                        </div>
                        <div className="space-y-1">
                          {featuredTours.slice(0, 4).map((tour) => (
                            <Link
                              key={tour._id}
                              href={`/tours/detail/${tour.slug}`}
                              className="block px-2 py-1.5 text-xs text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => {
                                setIsToursOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              <div className="font-medium">{tour.title}</div>
                              <div className="text-xs text-gray-500">
                                {tour.duration} • {tour.price?.toLocaleString()}
                                đ
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* View all */}
                      <Link
                        href="/tours"
                        className="block mx-2 mt-3 py-2 text-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                        onClick={() => {
                          setIsToursOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Xem tất cả tour
                      </Link>
                    </div>
                  )}
                </div>

                {/* Regular Nav Items */}
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`relative font-medium transition-all duration-300 px-4 py-3 rounded-xl group overflow-hidden ${
                      pathname === item.href
                        ? "text-blue-600 font-semibold bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600"
                        : "text-slate-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent"
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>
                    {pathname !== item.href && (
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                    )}
                  </Link>
                ))}

                {/* Mobile Auth Section */}
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 px-4 py-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          user.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-slate-700 hover:text-blue-600 font-medium transition-colors px-4 py-3 rounded-full hover:bg-gray-50 border border-gray-200 text-center"
                    >
                      Thông tin cá nhân
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="text-red-600 hover:text-red-700 font-medium transition-colors px-4 py-3 rounded-full hover:bg-red-50 border border-red-200 text-center cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-slate-700 hover:text-blue-600 font-medium transition-colors px-4 py-3 rounded-full hover:bg-gray-50 border border-gray-200 text-center"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium px-4 py-3 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-center shadow-md"
                    >
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        type="warning"
      />

      {/* Logout Success Modal */}
      <SuccessModal
        isOpen={showLogoutSuccess}
        onClose={handleLogoutSuccessClose}
        title="Đăng xuất thành công"
        message="Bạn đã đăng xuất khỏi tài khoản thành công!"
        autoClose={true}
        autoCloseDelay={2000}
      />
    </>
  );
}
