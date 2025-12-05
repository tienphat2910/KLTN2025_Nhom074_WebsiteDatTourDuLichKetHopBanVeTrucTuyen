"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  flightService,
  MappedAmadeusFlight,
  AmadeusSearchParams
} from "@/services/flightService";
import FlightSearchForm from "@/components/flight/FlightSearchForm";

// Lazy load search result components
const AmadeusFlightResults = lazy(
  () => import("@/components/flight/AmadeusFlightResults")
);
const FlightInspiration = lazy(
  () => import("@/components/flight/FlightInspiration")
);
const CheapestDatesCalendar = lazy(
  () => import("@/components/flight/CheapestDatesCalendar")
);

// Loading component for lazy loaded components
const SearchResultsLoading = () => (
  <div className="flex items-center justify-center py-16">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
      <p className="text-lg text-sky-700">Đang tải kết quả...</p>
    </div>
  </div>
);

const bannerImages = [
  "/images/banner-flight.webp",
  "https://amadeus.com/content/dam/amadeus/images/en/blog/2022/10/bamboo-airways-aircraft-787.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/1/1e/VietJet_Air_Airbus_A321neo_VN-A653_Perth_2024_%2801%29.jpg",
  "https://owa.bestprice.vn/images/articles/uploads/di-may-bay-vietravel-airlines-co-an-toan-khong-60b8a65a9e1d0.jpg"
];

export default function Flights() {
  const [isVisible, setIsVisible] = useState(false);

  // Amadeus search results
  const [amadeusResults, setAmadeusResults] = useState<MappedAmadeusFlight[]>(
    []
  );
  const [amadeusReturnResults, setAmadeusReturnResults] = useState<
    MappedAmadeusFlight[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentBanner, setCurrentBanner] = useState("");

  // Always use Amadeus API
  const useAmadeusAPI = true;

  // Search parameters
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState("");
  const [selectedArrival, setSelectedArrival] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [seatClass, setSeatClass] = useState("economy");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Selected flights for booking
  const [selectedOutboundFlight, setSelectedOutboundFlight] =
    useState<MappedAmadeusFlight | null>(null);
  const [selectedReturnFlight, setSelectedReturnFlight] =
    useState<MappedAmadeusFlight | null>(null);
  const [bookingStep, setBookingStep] = useState<
    "outbound" | "return" | "confirm"
  >("outbound");

  // Set visibility and random banner on mount
  useEffect(() => {
    setIsVisible(true);
    const randomIndex = Math.floor(Math.random() * bannerImages.length);
    setCurrentBanner(bannerImages[randomIndex]);
  }, []);

  // Map seat class to Amadeus travel class
  const mapSeatClassToAmadeus = (
    seatClass: string
  ): AmadeusSearchParams["travelClass"] => {
    switch (seatClass) {
      case "economy":
        return "ECONOMY";
      case "premium_economy":
        return "PREMIUM_ECONOMY";
      case "business":
        return "BUSINESS";
      case "first":
        return "FIRST";
      default:
        return "ECONOMY";
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDeparture || !selectedArrival || !departureDate) {
      setError("Vui lòng nhập đầy đủ thông tin tìm kiếm");
      return;
    }

    if (isRoundTrip && !returnDate) {
      setError("Vui lòng chọn ngày về cho chuyến bay khứ hồi");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedOutboundFlight(null);
    setSelectedReturnFlight(null);
    setBookingStep("outbound");

    try {
      // Search using Amadeus API
      const searchParams: AmadeusSearchParams = {
        originLocationCode: selectedDeparture.toUpperCase(),
        destinationLocationCode: selectedArrival.toUpperCase(),
        departureDate: departureDate,
        adults: adults,
        children: children,
        infants: infants,
        travelClass: mapSeatClassToAmadeus(seatClass),
        currencyCode: "VND",
        max: 250 // Maximum allowed by Amadeus
      };

      console.log("[Amadeus] Searching outbound flights:", searchParams);
      const outboundResults = await flightService.searchAndMapAmadeusFlights(
        searchParams
      );
      setAmadeusResults(outboundResults);
      console.log(
        "[Amadeus] Found",
        outboundResults.length,
        "outbound flights"
      );

      // If round trip, search return flights
      if (isRoundTrip && returnDate) {
        const returnParams: AmadeusSearchParams = {
          ...searchParams,
          originLocationCode: selectedArrival.toUpperCase(),
          destinationLocationCode: selectedDeparture.toUpperCase(),
          departureDate: returnDate
        };

        console.log("[Amadeus] Searching return flights:", returnParams);
        const returnResults = await flightService.searchAndMapAmadeusFlights(
          returnParams
        );
        setAmadeusReturnResults(returnResults);
        console.log("[Amadeus] Found", returnResults.length, "return flights");
      } else {
        setAmadeusReturnResults([]);
      }

      setHasSearched(true);
    } catch (err) {
      console.error("Error searching flights:", err);
      setError("Không tìm thấy chuyến bay phù hợp. Vui lòng thử lại.");
      setAmadeusResults([]);
      setAmadeusReturnResults([]);
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
              backgroundImage: `url('${currentBanner}')`,
              filter: "brightness(0.7)"
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
            onPassengerChange={(a, c, i) => {
              setAdults(a);
              setChildren(c);
              setInfants(i);
            }}
          />
        </div>
      </section>

      {/* Flight Inspiration Section - Show when departure is selected but no search yet */}
      {selectedDeparture && !hasSearched && useAmadeusAPI && (
        <section className="py-8 px-4 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto">
            <Suspense fallback={<SearchResultsLoading />}>
              <FlightInspiration
                origin={selectedDeparture}
                onSelectDestination={(destination, date) => {
                  setSelectedArrival(destination);
                  setDepartureDate(date);
                }}
              />
            </Suspense>
          </div>
        </section>
      )}

      {/* Cheapest Dates Section - Show when both departure and arrival are selected */}
      {selectedDeparture &&
        selectedArrival &&
        !hasSearched &&
        useAmadeusAPI && (
          <section className="py-4 px-4 bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto max-w-4xl">
              <Suspense fallback={<SearchResultsLoading />}>
                <CheapestDatesCalendar
                  origin={selectedDeparture}
                  destination={selectedArrival}
                  selectedDate={departureDate}
                  onSelectDate={(date) => setDepartureDate(date)}
                />
              </Suspense>
            </div>
          </section>
        )}

      {/* Search Results Section */}
      {hasSearched && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <Suspense fallback={<SearchResultsLoading />}>
              {isRoundTrip ? (
                <div className="space-y-8">
                  {/* Outbound Flight Selection */}
                  {bookingStep === "outbound" && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Chuyến đi: {selectedDeparture} → {selectedArrival}
                      </h2>
                      <AmadeusFlightResults
                        flights={amadeusResults}
                        loading={loading}
                        error={error}
                        tripType="outbound"
                        adults={adults}
                        children={children}
                        infants={infants}
                        showBookingButton={true}
                        onFlightSelect={(flight) => {
                          setSelectedOutboundFlight(flight);
                          setBookingStep("return");
                        }}
                      />
                    </div>
                  )}

                  {/* Return Flight Selection */}
                  {bookingStep === "return" && (
                    <div>
                      {/* Selected Outbound Summary */}
                      {selectedOutboundFlight && (
                        <div className="bg-sky-50 rounded-xl p-4 mb-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-gray-600">
                                Chuyến đi đã chọn
                              </p>
                              <p className="font-semibold text-gray-800">
                                {selectedOutboundFlight.airline}{" "}
                                {selectedOutboundFlight.flightNumber} •{" "}
                                {selectedOutboundFlight.departure.time} -{" "}
                                {selectedOutboundFlight.arrival.time}
                              </p>
                            </div>
                            <button
                              onClick={() => setBookingStep("outbound")}
                              className="text-sky-600 hover:underline text-sm"
                            >
                              Thay đổi
                            </button>
                          </div>
                        </div>
                      )}

                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Chuyến về: {selectedArrival} → {selectedDeparture}
                      </h2>
                      <AmadeusFlightResults
                        flights={amadeusReturnResults}
                        loading={loading}
                        error={error}
                        tripType="return"
                        adults={adults}
                        children={children}
                        infants={infants}
                        showBookingButton={true}
                        onFlightSelect={(flight) => {
                          setSelectedReturnFlight(flight);
                          setBookingStep("confirm");
                        }}
                      />
                    </div>
                  )}

                  {/* Booking Confirmation */}
                  {bookingStep === "confirm" &&
                    selectedOutboundFlight &&
                    selectedReturnFlight && (
                      <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                          Xác nhận đặt vé
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          {/* Outbound Summary */}
                          <div className="bg-sky-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-800 mb-2">
                              Chuyến đi
                            </h3>
                            <p>
                              {selectedOutboundFlight.airline}{" "}
                              {selectedOutboundFlight.flightNumber}
                            </p>
                            <p>
                              {selectedOutboundFlight.departure.airport} →{" "}
                              {selectedOutboundFlight.arrival.airport}
                            </p>
                            <p>
                              {selectedOutboundFlight.departure.time} -{" "}
                              {selectedOutboundFlight.arrival.time}
                            </p>
                            <p className="text-sky-600 font-semibold mt-2">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: selectedOutboundFlight.currency
                              }).format(selectedOutboundFlight.price)}
                            </p>
                          </div>

                          {/* Return Summary */}
                          <div className="bg-sky-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-800 mb-2">
                              Chuyến về
                            </h3>
                            <p>
                              {selectedReturnFlight.airline}{" "}
                              {selectedReturnFlight.flightNumber}
                            </p>
                            <p>
                              {selectedReturnFlight.departure.airport} →{" "}
                              {selectedReturnFlight.arrival.airport}
                            </p>
                            <p>
                              {selectedReturnFlight.departure.time} -{" "}
                              {selectedReturnFlight.arrival.time}
                            </p>
                            <p className="text-sky-600 font-semibold mt-2">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: selectedReturnFlight.currency
                              }).format(selectedReturnFlight.price)}
                            </p>
                          </div>
                        </div>

                        {/* Total Price */}
                        <div className="border-t pt-4 mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">
                              Tổng cộng ({adults + children + infants} hành
                              khách):
                            </span>
                            <span className="text-2xl font-bold text-sky-600">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND"
                              }).format(
                                (selectedOutboundFlight.price +
                                  selectedReturnFlight.price) *
                                  (adults + children)
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button
                            onClick={() => setBookingStep("return")}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Quay lại
                          </button>
                          <button
                            onClick={() => {
                              // Navigate to booking page with both flights
                              const outboundParam = encodeURIComponent(
                                JSON.stringify(selectedOutboundFlight.raw)
                              );
                              const returnParam = encodeURIComponent(
                                JSON.stringify(selectedReturnFlight.raw)
                              );
                              window.location.href = `/flight-booking?flightOffer=${outboundParam}&returnFlightOffer=${returnParam}&adults=${adults}&children=${children}&infants=${infants}`;
                            }}
                            className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-semibold"
                          >
                            Tiến hành đặt vé
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                // One-way Amadeus Results
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Chuyến đi: {selectedDeparture} → {selectedArrival}
                  </h2>
                  <AmadeusFlightResults
                    flights={amadeusResults}
                    loading={loading}
                    error={error}
                    adults={adults}
                    children={children}
                    infants={infants}
                    showBookingButton={true}
                    onFlightSelect={(flight) => {
                      // Navigate to booking page with selected flight
                      const flightOfferParam = encodeURIComponent(
                        JSON.stringify(flight.raw)
                      );
                      window.location.href = `/flight-booking?flightOffer=${flightOfferParam}&adults=${adults}&children=${children}&infants=${infants}`;
                    }}
                  />
                </div>
              )}
            </Suspense>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
