"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Flight, flightService } from "@/services/flightService";
import FlightSearchForm from "@/components/flight/FlightSearchForm";
import Link from "next/link";

export default function Flights() {
  const [isVisible, setIsVisible] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]); // State to store fetched flights
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [searchValue, setSearchValue] = useState("");
  const [selectedDeparture, setSelectedDeparture] = useState("");
  const [selectedArrival, setSelectedArrival] = useState("");
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [seatClass, setSeatClass] = useState("economy");
  const [showMobileForm, setShowMobileForm] = useState(false);

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
      result = result.filter(
        (f) =>
          f.flightNumber.toLowerCase().includes(keyword) ||
          f.airline.toLowerCase().includes(keyword) ||
          f.departureAirport.city.toLowerCase().includes(keyword) ||
          f.arrivalAirport.city.toLowerCase().includes(keyword)
      );
    }
    if (selectedDeparture) {
      result = result.filter(
        (f) => f.departureAirport.code === selectedDeparture
      );
    }
    if (selectedArrival) {
      result = result.filter((f) => f.arrivalAirport.code === selectedArrival);
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
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
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

        <div className="container mx-auto relative z-10 pt-24 md:pt-0">
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
          {/* Nút mở form trên mobile */}
          <button
            type="button"
            className="block md:hidden mx-auto mb-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-full px-6 py-3 shadow-lg"
            onClick={() => setShowMobileForm((v) => !v)}
          >
            {showMobileForm ? "Đóng tìm chuyến bay" : "Tìm chuyến bay"}
          </button>
          {/* Form chỉ hiện trên desktop hoặc khi showMobileForm=true */}
          <div className={`${showMobileForm ? "block" : "hidden"} md:block`}>
            <FlightSearchForm
              flights={flights}
              isRoundTrip={isRoundTrip}
              setIsRoundTrip={setIsRoundTrip}
              selectedDeparture={selectedDeparture}
              setSelectedDeparture={setSelectedDeparture}
              selectedArrival={selectedArrival}
              setSelectedArrival={setSelectedArrival}
              departureDate={departureDate}
              setDepartureDate={setDepartureDate}
              returnDate={returnDate}
              setReturnDate={setReturnDate}
              passengerCount={passengerCount}
              setPassengerCount={setPassengerCount}
              seatClass={seatClass}
              setSeatClass={setSeatClass}
              handleSearch={handleSearch}
            />
          </div>
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
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {flight.airline}
                      </h3>
                      <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">
                        {flight.seatInfo.classes.business.available > 0
                          ? "Thương gia"
                          : "Phổ thông"}
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
                          {new Intl.NumberFormat("vi-VN").format(
                            flight.seatInfo.classes.business.available > 0
                              ? flight.seatInfo.classes.business.price
                              : flight.seatInfo.classes.economy.price
                          )}
                          đ
                        </span>
                        <span className="text-gray-500 text-sm">/người</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                          Đặt Vé
                        </button>
                        <Link href={`/flights/detail/${flight._id}`} legacyBehavior>
                          <a className="bg-white border border-sky-500 text-sky-600 px-6 py-2 rounded-lg hover:bg-sky-50 transition-all duration-300 text-center font-medium">Xem chi tiết</a>
                        </Link>
                      </div>
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
