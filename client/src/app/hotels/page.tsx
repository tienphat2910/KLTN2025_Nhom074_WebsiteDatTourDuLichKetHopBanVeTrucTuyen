"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const hotels = [
  {
    id: 1,
    name: "Vinpearl Resort Phú Quốc",
    location: "Phú Quốc, Kiên Giang",
    price: "2,500,000",
    rating: 4.8,
    amenities: ["Bể bơi", "Spa", "Nhà hàng", "WiFi miễn phí"],
    image: "/hotel1.jpg"
  },
  {
    id: 2,
    name: "InterContinental Danang",
    location: "Đà Nẵng",
    price: "3,200,000",
    rating: 4.9,
    amenities: ["Bãi biển riêng", "Golf", "Spa", "Phòng gym"],
    image: "/hotel2.jpg"
  },
  {
    id: 3,
    name: "Lotte Hotel Hanoi",
    location: "Hà Nội",
    price: "2,800,000",
    rating: 4.7,
    amenities: ["Trung tâm thành phố", "Sky bar", "Spa", "Meeting rooms"],
    image: "/hotel3.jpg"
  }
];

export default function Hotels() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <Header />

      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-[18s] ease-out"
            style={{
              backgroundImage: "url('/images/banner-hotel.jpg')",
              filter: "brightness(0.35)"
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-900/40 to-indigo-900/50"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center transition-all duration-1000 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
              Đặt{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Khách Sạn
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 drop-shadow-lg">
              Tìm kiếm và đặt phòng khách sạn tốt nhất
            </p>
          </div>
        </div>
      </section>

      {/* Hotels Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel, index) => (
              <div
                key={hotel.id}
                className={`card-surface rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 delay-${
                  index * 100
                } ${
                  isVisible ? "animate-slide-up" : "opacity-0"
                } border border-white/20`}
              >
                <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm text-gray-600 ml-1">
                        {hotel.rating}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">📍 {hotel.location}</p>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Tiện nghi:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-purple-600">
                        {hotel.price}đ
                      </span>
                      <span className="text-gray-500 text-sm">/đêm</span>
                    </div>
                    <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                      Đặt Phòng
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
