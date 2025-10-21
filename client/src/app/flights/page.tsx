"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Flight, flightService } from "@/services/flightService";
import FlightSearchForm from "@/components/flight/FlightSearchForm";
import FlightSearchResults from "@/components/flight/FlightSearchResults";

export default function Flights() {
  const [isVisible, setIsVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Search parameters
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState("");
  const [selectedArrival, setSelectedArrival] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [seatClass, setSeatClass] = useState("economy");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDeparture || !selectedArrival || !departureDate) {
      setError("Vui lòng nhập đầy đủ thông tin tìm kiếm");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await flightService.searchFlights({
        from: selectedDeparture,
        to: selectedArrival,
        date: departureDate
      });

      setSearchResults(results);
      setHasSearched(true);
    } catch (err) {
      setError("Không tìm thấy chuyến bay phù hợp. Vui lòng thử lại.");
      console.error("Error searching flights:", err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
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

          <FlightSearchForm
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
      </section>

      {/* Search Results Section */}
      {hasSearched && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <FlightSearchResults
              results={searchResults}
              loading={loading}
              error={error}
              searchParams={{
                from: selectedDeparture,
                to: selectedArrival,
                date: departureDate,
                passengers: passengerCount,
                seatClass
              }}
            />
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
