"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/tours", label: "Du Lịch" },
  { href: "/flights", label: "Vé Máy Bay" },
  { href: "/hotels", label: "Khách Sạn" },
  { href: "/entertainment", label: "Giải Trí" }
];

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 shadow-sm border-b border-white/20">
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
                    pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
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
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-20 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-20 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 font-medium transition-colors px-3 py-2 rounded-full hover:bg-blue-50"
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
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Thông tin cá nhân
                    </Link>
                    <Link
                      href="/bookings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Đặt chỗ của tôi
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-red-600 hover:text-red-700 font-medium transition-colors px-4 py-3 rounded-full hover:bg-red-50 border border-red-200 text-center"
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
  );
}
