"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Flight, flightService } from "@/services/flightService"; // Import Flight interface and flightService

export default function Flights() {
  const [isVisible, setIsVisible] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]); // State to store fetched flights
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [searchValue, setSearchValue] = useState("");
  const [selectedDeparture, setSelectedDeparture] = useState("");
  const [selectedArrival, setSelectedArrival] = useState("");
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);

  useEffect(() => {
    setIsVisible(true);
    const fetchFlights = async () => {
      try {
        const data = await flightService.getAllFlights();
        setFlights(data);
      } catch (err) {
        setError("Failed to fetch flights. Please try again later.");
        console.error("Error fetching flights:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlights();
  }, []);

  useEffect(() => {
    let result = flights;
    if (searchValue.trim()) {
      const keyword = searchValue.toLowerCase();
      result = result.filter(f =>
        f.flightNumber.toLowerCase().includes(keyword) ||
        f.airline.toLowerCase().includes(keyword) ||
        f.departureAirport.city.toLowerCase().includes(keyword) ||
        f.arrivalAirport.city.toLowerCase().includes(keyword)
      );
    }
    if (selectedDeparture) {
      result = result.filter(f => f.departureAirport.code === selectedDeparture);
    }
    if (selectedArrival) {
      result = result.filter(f => f.arrivalAirport.code === selectedArrival);
    }
    setFilteredFlights(result);
  }, [flights, searchValue, selectedDeparture, selectedArrival]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Đã lọc realtime qua useEffect
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
        <p className="text-xl text-sky-700">Loading flights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

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
          {/* Search & Filter Form */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-center md:gap-4 bg-white rounded-3xl shadow-lg px-4 md:px-8 py-6 w-full max-w-3xl"
            style={{ fontFamily: "inherit" }}
          >
            {/* Tìm kiếm từ khoá */}
            <div className="flex flex-col w-full md:flex-1">
              <label className="font-bold text-gray-800 mb-1 text-sm">Từ khoá chuyến bay</label>
              <input
                type="text"
                className="w-full border border-gray-400 rounded-lg px-4 py-3 text-base text-gray-800 bg-white"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder="Nhập số hiệu, hãng, điểm đi/đến..."
              />
            </div>
            {/* Sân bay đi */}
            <div className="flex flex-col w-full md:flex-[0.8] md:max-w-xs">
              <label className="font-bold text-gray-800 mb-1 text-sm">Sân bay đi</label>
              <select
                className="w-full border border-gray-400 rounded-lg px-4 py-3 text-base text-gray-800 bg-white"
                value={selectedDeparture}
                onChange={e => setSelectedDeparture(e.target.value)}
              >
                <option value="">Tất cả</option>
                {Array.from(new Set(flights.map(f => f.departureAirport.code))).map(code => (
                  <option key={code} value={code}>
                    {flights.find(f => f.departureAirport.code === code)?.departureAirport.city}
                  </option>
                ))}
              </select>
            </div>
            {/* Sân bay đến */}
            <div className="flex flex-col w-full md:flex-[0.8] md:max-w-xs">
              <label className="font-bold text-gray-800 mb-1 text-sm">Sân bay đến</label>
              <select
                className="w-full border border-gray-400 rounded-lg px-4 py-3 text-base text-gray-800 bg-white"
                value={selectedArrival}
                onChange={e => setSelectedArrival(e.target.value)}
              >
                <option value="">Tất cả</option>
                {Array.from(new Set(flights.map(f => f.arrivalAirport.code))).map(code => (
                  <option key={code} value={code}>
                    {flights.find(f => f.arrivalAirport.code === code)?.arrivalAirport.city}
                  </option>
                ))}
              </select>
            </div>
            {/* Nút tìm kiếm */}
            <div className="flex items-center w-full md:w-auto">
              <button
                type="submit"
                className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all text-base whitespace-nowrap w-full md:w-auto justify-center"
                style={{ minWidth: 140 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Flights Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {filteredFlights.length === 0 ? (
            <p className="text-center text-xl text-gray-700">
              Không tìm thấy chuyến bay nào.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFlights.map((flight, index) => (
                <div
                  key={flight._id}
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
                        {flight.seatInfo.classes.business.available > 0 ? "Thương gia" : "Phổ thông"}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="text-lg font-semibold text-gray-800 mb-2">
                        {`${flight.departureAirport.city} → ${flight.arrivalAirport.city}`}
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{formatTime(flight.departureTime)}</span>
                        <span className="text-sky-500">
                          ✈️ {formatDuration(flight.durationMinutes)}
                        </span>
                        <span>{formatTime(flight.arrivalTime)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-bold text-sky-600">
                          {new Intl.NumberFormat('vi-VN').format(
                            flight.seatInfo.classes.business.available > 0
                              ? flight.seatInfo.classes.business.price
                              : flight.seatInfo.classes.economy.price
                          )}
                          đ
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
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
