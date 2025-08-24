"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const entertainments = [
  {
    id: 1,
    name: "Vinpearl Land Nha Trang",
    location: "Nha Trang, Khánh Hòa",
    price: "750,000",
    type: "Công viên giải trí",
    highlights: ["Tàu lượn siêu tốc", "Công viên nước", "Aquarium"],
    image: "/entertainment1.jpg"
  },
  {
    id: 2,
    name: "Sun World Ba Na Hills",
    location: "Đà Nẵng",
    price: "850,000",
    type: "Khu du lịch",
    highlights: ["Cầu Vàng", "Cáp treo", "Làng Pháp"],
    image: "/entertainment2.jpg"
  },
  {
    id: 3,
    name: "Dam Sen Park",
    location: "TP.HCM",
    price: "150,000",
    type: "Công viên",
    highlights: ["Trò chơi cảm giác mạnh", "Biểu diễn", "Khu vui chơi trẻ em"],
    image: "/entertainment3.jpg"
  }
];

export default function Entertainment() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-[10s] ease-in-out"
            style={{
              backgroundImage: "url('/images/banner-entertainment.webp')"
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/50 via-red-900/40 to-pink-900/50"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center transition-all duration-1000 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
              Vé{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Giải Trí
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 drop-shadow-lg">
              Đặt vé các điểm vui chơi giải trí hấp dẫn
            </p>
          </div>
        </div>
      </section>

      {/* Entertainment Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {entertainments.map((entertainment, index) => (
              <div
                key={entertainment.id}
                className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 delay-${
                  index * 100
                } ${isVisible ? "animate-slide-up" : "opacity-0"}`}
              >
                <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {entertainment.name}
                    </h3>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      {entertainment.type}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    📍 {entertainment.location}
                  </p>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Điểm nổi bật:
                    </h4>
                    <ul className="text-sm text-gray-600">
                      {entertainment.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center mb-1">
                          <span className="text-orange-500 mr-2">🎯</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-orange-600">
                        {entertainment.price}đ
                      </span>
                      <span className="text-gray-500 text-sm">/vé</span>
                    </div>
                    <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                      Đặt Vé
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
