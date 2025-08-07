"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import ConfirmModal from "@/components/Modal/ConfirmModal";
import SuccessModal from "@/components/Modal/SuccessModal";
import { destinationService, Destination } from "@/services/destinationService";
import { LoadingSpinner } from "@/components/Loading";

const navItems = [
  { href: "/tours", label: "Du Lịch" },
  { href: "/flights", label: "Vé Máy Bay" },
  { href: "/hotels", label: "Khách Sạn" },
  { href: "/entertainment", label: "Giải Trí" }
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>(
    []
  );
  const [otherDestinations, setOtherDestinations] = useState<Destination[]>([]);

  // Load destinations from API
  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const response = await destinationService.getDestinations({
          limit: 50
        });
        if (response.success) {
          const allDestinations = response.data.destinations;
          setDestinations(allDestinations);
          setPopularDestinations(
            allDestinations.filter((dest) => dest.popular)
          );
          setOtherDestinations(allDestinations.filter((dest) => !dest.popular));
        }
      } catch (error) {
        console.error("Error loading destinations:", error);
      }
    };

    loadDestinations();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const toggleDestinations = () => {
    setIsDestinationsOpen(!isDestinationsOpen);
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

        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-bold text-slate-800 hover:text-blue-600 transition-colors"
            >
              🌎 LuTrip
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              {/* Destinations Dropdown */}
              <div className="relative group">
                <button
                  onClick={toggleDestinations}
                  className="relative font-medium transition-all duration-300 px-4 py-2 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 flex items-center space-x-1"
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
                </button>

                {/* Destinations Dropdown Menu */}
                {isDestinationsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 py-4 z-50">
                    {/* Popular Destinations */}
                    <div className="px-4 pb-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Điểm đến phổ biến
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
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
                        className="block w-full text-center py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors font-medium text-sm"
                        onClick={() => setIsDestinationsOpen(false)}
                      >
                        Xem tất cả địa điểm
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
                  className={`relative font-medium transition-all duration-300 px-4 py-2 rounded-lg group ${
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

            {/* Desktop Search and Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm tour, khách sạn, vé máy bay..."
                  className="w-80 pl-12 pr-4 py-3 text-slate-700 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md transition-all duration-200 placeholder-gray-400"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-gray-400"
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
                </div>
              </div>

              {/* Auth Section */}
              {isAuthLoading ? (
                <div className="flex items-center space-x-3 bg-gray-100 rounded-full px-4 py-2">
                  <LoadingSpinner type="dots" size="sm" showText={false} />
                  <span className="text-sm text-gray-500">Đang tải...</span>
                </div>
              ) : user ? (
                <div className="relative">
                  {/* User dropdown button */}
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 font-medium transition-colors px-3 py-2 rounded-full hover:bg-blue-50 cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.fullName}</span>
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
                        href="/bookings"
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
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-slate-700 hover:text-blue-600 font-medium transition-colors px-5 py-2.5 rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-200"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium px-5 py-2.5 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="md:hidden flex items-center space-x-2">
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
                  className={`w-6 h-6 transform transition-transform ${
                    isMobileMenuOpen ? "rotate-90" : ""
                  }`}
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
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 animate-slide-down">
              <div className="pt-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="w-full pl-12 pr-4 py-3 text-slate-700 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="mobile-nav md:hidden mt-4 pb-4 border-t border-gray-200 animate-slide-down">
              <div className="flex flex-col space-y-2 pt-4">
                {/* Mobile Destinations Section */}
                <div className="mb-4">
                  <button
                    onClick={toggleDestinations}
                    className="w-full flex items-center justify-between font-medium text-slate-700 hover:text-blue-600 px-4 py-3 rounded-xl transition-all duration-300"
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
                <div className="flex flex-col space-y-3 pt-3 border-t border-gray-200">
                  {user ? (
                    <>
                      <div className="flex items-center space-x-3 px-4 py-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.fullName.charAt(0).toUpperCase()}
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
