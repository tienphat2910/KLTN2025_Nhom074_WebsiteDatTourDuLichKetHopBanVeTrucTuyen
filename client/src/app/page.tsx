"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const services = [
  {
    title: "Tour Du Lịch",
    description: "Khám phá những điểm đến tuyệt vời tại Việt Nam",
    icon: "🏔️",
    href: "/tours",
    gradient: "from-blue-500 to-purple-600",
    bgColor: "bg-blue-50/80"
  },
  {
    title: "Vé Máy Bay",
    description: "Đặt vé máy bay giá tốt nhất",
    icon: "✈️",
    href: "/flights",
    gradient: "from-green-500 to-blue-500",
    bgColor: "bg-green-50/80"
  },
  {
    title: "Khách Sạn",
    description: "Tìm kiếm và đặt phòng khách sạn",
    icon: "🏨",
    href: "/hotels",
    gradient: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50/80"
  },
  {
    title: "Vé Giải Trí",
    description: "Đặt vé các điểm vui chơi giải trí",
    icon: "🎢",
    href: "/entertainment",
    gradient: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50/80"
  }
];

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <Header />

      {/* Hero Section với background */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-110 transition-transform duration-[20s] ease-out"
            style={{
              backgroundImage: "url('/images/banner-main.jpg')",
              filter: "brightness(0.3)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-slate-900/40" />
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
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Việt Nam
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-lg">
              Trải nghiệm những chuyến du lịch tuyệt vời với dịch vụ đặt tour,
              vé máy bay, khách sạn và vé giải trí
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 shadow-xl">
              Bắt Đầu Khám Phá
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 relative">
        <div className="container mx-auto">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-300 ${
              isVisible ? "animate-slide-up" : "opacity-0"
            }`}
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Dịch Vụ Của Chúng Tôi
            </h2>
            <p className="text-slate-600 text-lg">
              Tất cả những gì bạn cần cho chuyến du lịch hoàn hảo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Link
                key={service.title}
                href={service.href}
                className={`group transition-all duration-700 delay-${
                  index * 100
                } ${isVisible ? "animate-slide-up" : "opacity-0"} h-full`}
              >
                <div
                  className={`${service.bgColor} backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/20 h-full flex flex-col`}
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${service.gradient} rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0`}
                  >
                    {service.icon}
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
      </section>

      {/* Popular Destinations Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/banner-main.jpg')",
              filter: "brightness(0.4)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-blue-900/60" />
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center mb-16 transition-all duration-1000 delay-500 ${
              isVisible ? "animate-slide-up" : "opacity-0"
            }`}
          >
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Điểm Đến Phổ Biến
            </h2>
            <p className="text-white/90 text-lg drop-shadow">
              Những địa điểm du lịch được yêu thích nhất tại Việt Nam
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Hạ Long",
                image: "/images/halong.jpg",
                description: "Vịnh Hạ Long - Di sản thế giới",
                gradient: "from-blue-500 to-teal-500"
              },
              {
                name: "Sapa",
                image: "/images/sapa.jpg",
                description: "Ruộng bậc thang tuyệt đẹp",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                name: "Phú Quốc",
                image: "/images/phuquoc.jpg",
                description: "Đảo ngọc thiên đường",
                gradient: "from-orange-500 to-pink-500"
              }
            ].map((destination, index) => (
              <div
                key={destination.name}
                className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 delay-${
                  600 + index * 100
                } ${isVisible ? "animate-slide-up" : "opacity-0"} group`}
              >
                <div className="h-64 relative overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-110"
                    style={{
                      backgroundImage: `url('${destination.image}')`
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
                  <div className="p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">
                      {destination.name}
                    </h3>
                    <p className="text-gray-200 drop-shadow">
                      {destination.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
