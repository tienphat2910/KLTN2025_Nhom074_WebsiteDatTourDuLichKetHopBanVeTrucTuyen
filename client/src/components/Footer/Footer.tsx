"use client";

import { useState } from "react";

export default function Footer() {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const isOpen = (section: string) => openSections.includes(section);

  return (
    <footer className="bg-slate-800 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Về LuTrip */}
          <div className="mb-6 lg:mb-0">
            <button
              onClick={() => toggleSection("about")}
              className="flex items-center justify-between w-full text-left lg:pointer-events-none"
            >
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-blue-400">
                Về LuTrip
              </h3>
              <svg
                className={`w-4 h-4 transition-transform lg:hidden ${
                  isOpen("about") ? "rotate-180" : ""
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
            <ul
              className={`space-y-2 md:space-y-3 lg:block ${
                isOpen("about") ? "block" : "hidden lg:block"
              }`}
            >
              <li>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Cách đặt chỗ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Liên hệ chúng tôi
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Trợ giúp
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Tuyển dụng
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Về chúng tôi
                </a>
              </li>
            </ul>
          </div>

          {/* Sản phẩm */}
          <div className="mb-6 lg:mb-0">
            <button
              onClick={() => toggleSection("products")}
              className="flex items-center justify-between w-full text-left lg:pointer-events-none"
            >
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-blue-400">
                Sản phẩm
              </h3>
              <svg
                className={`w-4 h-4 transition-transform lg:hidden ${
                  isOpen("products") ? "rotate-180" : ""
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
            <ul
              className={`space-y-2 md:space-y-3 lg:block ${
                isOpen("products") ? "block" : "hidden lg:block"
              }`}
            >
              <li>
                <a
                  href="/hotels"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Khách sạn
                </a>
              </li>
              <li>
                <a
                  href="/flights"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Vé máy bay
                </a>
              </li>
              <li>
                <a
                  href="/tours"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Vé xe khách
                </a>
              </li>
              <li>
                <a
                  href="/tours"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Đưa đón sân bay
                </a>
              </li>
              <li>
                <a
                  href="/entertainment"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Cho thuê xe
                </a>
              </li>
              <li>
                <a
                  href="/entertainment"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Hoạt động & Vui chơi
                </a>
              </li>
              <li className="hidden md:block">
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Du thuyền
                </a>
              </li>
              <li className="hidden md:block">
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Biệt thự
                </a>
              </li>
              <li className="hidden md:block">
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Căn hộ
                </a>
              </li>
            </ul>
          </div>

          {/* Khác */}
          <div className="mb-6 lg:mb-0">
            <button
              onClick={() => toggleSection("others")}
              className="flex items-center justify-between w-full text-left lg:pointer-events-none"
            >
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-blue-400">
                Khác
              </h3>
              <svg
                className={`w-4 h-4 transition-transform lg:hidden ${
                  isOpen("others") ? "rotate-180" : ""
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
            <ul
              className={`space-y-2 md:space-y-3 lg:block ${
                isOpen("others") ? "block" : "hidden lg:block"
              }`}
            >
              <li>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  LuTrip Affiliate
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  LuTrip Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Chính Sách Quyền Riêng
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Điều khoản & Điều kiện
                </a>
              </li>
              <li className="hidden lg:block">
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Đăng ký nơi nghỉ của bạn
                </a>
              </li>
              <li className="hidden lg:block">
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Đăng ký doanh nghiệp hoạt động du lịch của bạn
                </a>
              </li>
              <li className="hidden lg:block">
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Khu vực báo chí
                </a>
              </li>
              <li className="hidden lg:block">
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Quy chế hoạt động
                </a>
              </li>
              <li className="hidden lg:block">
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Vulnerability Disclosure Program
                </a>
              </li>
              <li className="hidden lg:block">
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  APAC Travel Insights
                </a>
              </li>
            </ul>
          </div>

          {/* App Download & Social */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => toggleSection("app")}
              className="flex items-center justify-between w-full text-left lg:pointer-events-none"
            >
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-blue-400">
                Tải ứng dụng LuTrip
              </h3>
              <svg
                className={`w-4 h-4 transition-transform lg:hidden ${
                  isOpen("app") ? "rotate-180" : ""
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
            <div
              className={`lg:block ${
                isOpen("app") ? "block" : "hidden lg:block"
              }`}
            >
              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                <a
                  href="#"
                  className="block bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-2 md:p-3 border border-slate-600"
                >
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-6 md:w-8 h-6 md:h-8 bg-gradient-to-r from-green-500 to-green-600 rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 md:w-5 h-3 md:h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">TẢI TRÊN</div>
                      <div className="text-xs md:text-sm font-semibold">
                        Google Play
                      </div>
                    </div>
                  </div>
                </a>
                <a
                  href="#"
                  className="block bg-slate-700 hover:bg-slate-600 transition-colors rounded-lg p-2 md:p-3 border border-slate-600"
                >
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-6 md:w-8 h-6 md:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 md:w-5 h-3 md:h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.09,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">TẢI TRÊN</div>
                      <div className="text-xs md:text-sm font-semibold">
                        App Store
                      </div>
                    </div>
                  </div>
                </a>
              </div>

              {/* Social Media */}
              <h4 className="text-sm font-semibold mb-2 md:mb-3 text-slate-200">
                Theo dôi chúng tôi trên
              </h4>
              <div className="flex space-x-2 md:space-x-3 flex-wrap gap-2">
                <a
                  href="#"
                  className="w-7 md:w-8 h-7 md:h-8 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-3 md:w-4 h-3 md:h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-7 md:w-8 h-7 md:h-8 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-3 md:w-4 h-3 md:h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-7 md:w-8 h-7 md:h-8 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-3 md:w-4 h-3 md:h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-7 md:w-8 h-7 md:h-8 bg-blue-400 hover:bg-blue-500 rounded flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-3 md:w-4 h-3 md:h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Certifications */}
      <div className="border-t border-slate-700">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 text-blue-400">
              🤝 Hợp tác với LuTrip
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {/* IATA */}
            <div className="flex items-center space-x-2 bg-slate-700 px-3 md:px-4 py-2 rounded-lg">
              <div className="w-8 md:w-10 h-6 md:h-8 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-slate-800">IATA</span>
              </div>
              <span className="text-xs md:text-sm text-slate-300">
                Certified Travel Agent
              </span>
            </div>

            {/* Security */}
            <div className="flex items-center space-x-2 bg-slate-700 px-3 md:px-4 py-2 rounded-lg">
              <div className="w-6 md:w-8 h-6 md:h-8 bg-green-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 md:w-4 h-3 md:h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.3 14.8,17.3H9.2C8.6,17.3 8,16.8 8,16.2V12.8C8,12.2 8.6,11.7 9.2,11.7V10.1C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11.4H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z" />
                </svg>
              </div>
              <span className="text-xs md:text-sm text-slate-300 hidden sm:inline">
                Đã Đăng Ký Bộ Công Thương
              </span>
              <span className="text-xs text-slate-300 sm:hidden">
                Bộ Công Thương
              </span>
            </div>

            {/* SSL */}
            <div className="flex items-center space-x-2 bg-slate-700 px-3 md:px-4 py-2 rounded-lg">
              <div className="w-6 md:w-8 h-6 md:h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg
                  className="w-3 md:w-4 h-3 md:h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16.5,7V6.5C16.5,4 14.5,2 12,2C9.5,2 7.5,4 7.5,6.5V7H6V18H18V7H16.5M12,3.5C13.7,3.5 15,4.8 15,6.5V7H9V6.5C9,4.8 10.3,3.5 12,3.5Z" />
                </svg>
              </div>
              <span className="text-xs md:text-sm text-slate-300">
                SSL Secured
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-700 bg-slate-900">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 md:mb-0">
              <div className="text-xl md:text-2xl font-bold text-blue-400">
                🌎 LuTrip
              </div>
              <p className="text-slate-400 text-xs md:text-sm">
                Đồng hành cùng bạn khám phá Việt Nam
              </p>
            </div>
            <div className="text-slate-400 text-xs md:text-sm text-center md:text-right">
              <p>© 2024 LuTrip. All rights reserved.</p>
              <p className="mt-1">Made with ❤️ for travelers in Vietnam</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
