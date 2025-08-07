"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const tours = [
  {
    id: 1,
    title: "Tour Hạ Long 2N1Đ",
    price: "1,500,000",
    duration: "2 ngày 1 đêm",
    location: "Quảng Ninh",
    rating: 4.8,
    image: "/tour1.jpg",
    highlights: ["Du thuyền qua đêm", "Hang Sửng Sốt", "Làng chài Cửa Vạn"]
  },
  {
    id: 2,
    title: "Tour Sapa 3N2Đ",
    price: "2,200,000",
    duration: "3 ngày 2 đêm",
    location: "Lào Cai",
    rating: 4.9,
    image: "/tour2.jpg",
    highlights: ["Fansipan", "Bản Cát Cát", "Thác Bạc"]
  },
  {
    id: 3,
    title: "Tour Phú Quốc 4N3Đ",
    price: "3,800,000",
    duration: "4 ngày 3 đêm",
    location: "Kiên Giang",
    rating: 4.7,
    image: "/tour3.jpg",
    highlights: ["Cáp treo Hòn Thơm", "Sunset Sanato", "Chợ đêm Dinh Cậu"]
  }
];

export default function Tours() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-[15s] ease-out"
            style={{
              backgroundImage: "url('/images/banner-tour.jpg')",
              filter: "brightness(0.4)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 via-teal-900/40 to-blue-900/50" />
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center transition-all duration-1000 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
              Tour Du Lịch{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Việt Nam
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 drop-shadow-lg">
              Khám phá vẻ đẹp thiên nhiên và văn hóa Việt Nam
            </p>
          </div>
        </div>
      </section>

      {/* Tours Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour, index) => (
              <div
                key={tour.id}
                className={`card-surface rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 delay-${
                  index * 100
                } ${
                  isVisible ? "animate-slide-up" : "opacity-0"
                } border border-white/20`}
              >
                <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {tour.title}
                    </h3>
                    <div className="flex items-center">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm text-gray-600 ml-1">
                        {tour.rating}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">📍 {tour.location}</p>
                  <p className="text-gray-600 mb-4">⏰ {tour.duration}</p>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Điểm nổi bật:
                    </h4>
                    <ul className="text-sm text-gray-600">
                      {tour.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center mb-1">
                          <span className="text-green-500 mr-2">✓</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        {tour.price}đ
                      </span>
                      <span className="text-gray-500 text-sm">/người</span>
                    </div>
                    <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                      Đặt Tour
                    </button>
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
