"use client";

import { useState } from "react";
import { Handshake, Heart } from "lucide-react";
import { FaGooglePlay, FaApple } from "react-icons/fa";

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
                  href="/how-to-book"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Cách đặt chỗ
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Liên hệ chúng tôi
                </a>
              </li>
              <li>
                <a
                  href="/help"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Trợ giúp
                </a>
              </li>

              <li>
                <a
                  href="/about"
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
                  Tour du lịch
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
                  href="/privacy-policy"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Chính Sách Quyền Riêng Tư
                </a>
              </li>
              <li>
                <a
                  href="/terms-conditions"
                  className="text-slate-300 hover:text-white transition-colors text-sm"
                >
                  Điều khoản & Điều kiện
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
              <div className="flex flex-col gap-3 mb-4 md:mb-6">
                {/* Google Play */}
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-2xl border border-slate-600 bg-black px-4 py-3 text-white shadow-lg transition-all hover:bg-white hover:text-black hover:border-slate-400"
                >
                  <FaGooglePlay className="text-2xl flex-shrink-0" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-medium">Tải xuống trên</span>
                    <span className="text-base md:text-lg font-semibold">
                      Google Play
                    </span>
                  </div>
                </a>

                {/* App Store */}
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-2xl border border-slate-600 bg-black px-4 py-3 text-white shadow-lg transition-all hover:bg-white hover:text-black hover:border-slate-400"
                >
                  <FaApple className="text-2xl flex-shrink-0" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-medium">Tải về trên</span>
                    <span className="text-base md:text-lg font-semibold">
                      App Store
                    </span>
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
            <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 text-blue-400 flex items-center justify-center gap-2">
              <Handshake className="w-5 h-5" />
              Hợp tác với LuTrip
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {/* IATA */}
            <div className="flex items-center justify-center bg-slate-700 px-3 md:px-4 py-3 md:py-4 rounded-lg">
              <img
                src="https://ik.imagekit.io/tvlk/image/imageResource/2017/12/13/1513150321127-5096be77d2a19401b476853e54ba2cc6.svg?tr=h-35,q-75"
                alt="IATA"
                className="h-6 md:h-8 w-auto object-contain"
              />
            </div>

            {/* Bộ Công Thương */}
            <div className="flex items-center justify-center bg-slate-700 px-3 md:px-4 py-3 md:py-4 rounded-lg">
              <img
                src="https://ik.imagekit.io/tvlk/image/imageResource/2019/09/23/1569229181629-eeb038ad844874f951326d0a8534bf48.png?tr=q-75,w-100"
                alt="Bộ Công Thương"
                className="h-6 md:h-8 w-auto object-contain"
              />
            </div>

            {/* MoMo */}
            <div className="flex items-center justify-center bg-slate-700 px-3 md:px-4 py-3 md:py-4 rounded-lg">
              <img
                src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                alt="MoMo"
                className="h-6 md:h-8 w-auto object-contain"
              />
            </div>

            {/* ZaloPay */}
            <div className="flex items-center justify-center bg-slate-700 px-3 md:px-4 py-3 md:py-4 rounded-lg">
              <img
                src="https://upload.wikimedia.org/wikipedia/vi/7/77/ZaloPay_Logo.png"
                alt="ZaloPay"
                className="h-6 md:h-8 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-700 bg-slate-900">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <img
                  src="/images/logo/logo-lutrip.png"
                  alt="LuTrip Logo"
                  className="w-8 h-8 md:w-10 md:h-10"
                />
                <span className="text-xl md:text-2xl font-bold text-blue-400">
                  LuTrip
                </span>
              </div>
              <p className="text-slate-400 text-xs md:text-sm">
                Đồng hành cùng bạn khám phá Việt Nam
              </p>
            </div>
            <div className="text-slate-400 text-xs md:text-sm text-center md:text-right">
              <p>© 2025 LuTrip. All rights reserved.</p>
              <p className="mt-1 flex items-center justify-center md:justify-end gap-1">
                Made with{" "}
                <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-500 fill-red-500" />{" "}
                for travelers in Vietnam
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
