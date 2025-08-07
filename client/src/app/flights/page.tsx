"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const flights = [
  {
    id: 1,
    airline: "Vietnam Airlines",
    route: "HCM → HN",
    departure: "06:00",
    arrival: "08:15",
    duration: "2h 15m",
    price: "2,150,000",
    type: "Phổ thông"
  },
  {
    id: 2,
    airline: "Vietjet Air",
    route: "HN → DN",
    departure: "14:30",
    arrival: "16:45",
    duration: "2h 15m",
    price: "1,890,000",
    type: "Phổ thông"
  },
  {
    id: 3,
    airline: "Bamboo Airways",
    route: "HCM → PQ",
    departure: "09:15",
    arrival: "10:30",
    duration: "1h 15m",
    price: "2,750,000",
    type: "Thương gia"
  }
];

export default function Flights() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100">
      <Header />

      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-[12s] ease-linear"
            style={{
              backgroundImage: "url('/images/banner-flight.webp')",
              filter: "brightness(0.3)"
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900/50 via-blue-900/40 to-indigo-900/50"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center transition-all duration-1000 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
              Đặt{" "}
              <span className="bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                Vé Máy Bay
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 drop-shadow-lg">
              Tìm và đặt vé máy bay giá tốt nhất
            </p>
          </div>
        </div>
      </section>

      {/* Flights Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {flights.map((flight, index) => (
              <div
                key={flight.id}
                className={`card-surface rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 delay-${
                  index * 100
                } ${
                  isVisible ? "animate-slide-up" : "opacity-0"
                } border border-white/20`}
              >
                <div className="h-48 bg-gradient-to-br from-sky-400 to-blue-500"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {flight.airline}
                    </h3>
                    <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">
                      {flight.type}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="text-lg font-semibold text-gray-800 mb-2">
                      {flight.route}
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>{flight.departure}</span>
                      <span className="text-sky-500">✈️ {flight.duration}</span>
                      <span>{flight.arrival}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-sky-600">
                        {flight.price}đ
                      </span>
                      <span className="text-gray-500 text-sm">/người</span>
                    </div>
                    <button className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300">
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
