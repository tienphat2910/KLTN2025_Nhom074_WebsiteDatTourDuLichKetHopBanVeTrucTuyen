"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Flight, flightService } from "@/services/flightService";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";
import Link from "next/link";
import {
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Users,
  Luggage,
  ShieldCheck,
  Armchair,
  Tag,
  DollarSign
} from "lucide-react";
import FlightInfoSection from "@/components/flight/FlightInfoSection";
import ClassSelector from "@/components/flight/ClassSelector";

const bannerImages = [
  "/images/banner-flight.webp",
  "https://amadeus.com/content/dam/amadeus/images/en/blog/2022/10/bamboo-airways-aircraft-787.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/1/1e/VietJet_Air_Airbus_A321neo_VN-A653_Perth_2024_%2801%29.jpg",
  "https://owa.bestprice.vn/images/articles/uploads/di-may-bay-vietravel-airlines-co-an-toan-khong-60b8a65a9e1d0.jpg"
];

export default function FlightDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBanner, setCurrentBanner] = useState("");

  // Selected schedule (user must pick a schedule to book)
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [seatMap, setSeatMap] = useState<any[]>([]); // Seat availability from server

  // Booking options
  const [selectedClass, setSelectedClass] = useState<string>("economy");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Add-ons
  const [extraBaggage, setExtraBaggage] = useState(0);
  const [insurance, setInsurance] = useState(false);
  const [prioritySeat, setPrioritySeat] = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Pricing constants for add-ons
  const EXTRA_BAGGAGE_PRICE = 200000; // 200k per bag
  const INSURANCE_PRICE = 150000; // 150k per person
  const PRIORITY_SEAT_BASE_PRICE = 100000; // Base price

  // Seat pricing based on position
  const getSeatPrice = (seat: string) => {
    const row = parseInt(seat.substring(0, seat.length - 1));
    const letter = seat[seat.length - 1];

    // Emergency exit rows (more legroom) - rows 1, 12, 13
    if (row === 1 || row === 12 || row === 13) {
      return 300000;
    }
    // Front rows (1-5) - faster exit
    if (row <= 5) {
      return 200000;
    }
    // Window and aisle seats
    if (letter === "A" || letter === "F" || letter === "K") {
      return 150000; // Window
    }
    if (letter === "C" || letter === "D" || letter === "H" || letter === "J") {
      return 120000; // Aisle
    }
    // Middle seats (B, E)
    return 100000;
  };

  // Check if a seat is occupied from server seat map
  const isSeatOccupied = (seatCode: string): boolean => {
    if (!seatMap || seatMap.length === 0) {
      return false; // If no seat map, all available
    }
    const entry = seatMap.find((s: any) => s.seatNumber === seatCode);
    return entry ? entry.status !== "available" : false;
  };

  // Set random banner on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * bannerImages.length);
    setCurrentBanner(bannerImages[randomIndex]);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchFlight = async () => {
      try {
        const data = await flightService.getFlightById(id as string);
        setFlight(data);

        // Set default selected class to the first available class
        if (data.classes && data.classes.length > 0) {
          const firstClass = data.classes[0].className.toLowerCase();
          setSelectedClass(firstClass);
        }

        // Auto-select the first upcoming schedule (if any)
        if (data.upcomingSchedules && data.upcomingSchedules.length > 0) {
          setSelectedSchedule(data.upcomingSchedules[0]);
        }
      } catch (err) {
        setError("Không tìm thấy chuyến bay");
      } finally {
        setLoading(false);
      }
    };
    fetchFlight();
  }, [id]);

  // Fetch seat map when a schedule is selected and seat map modal opens
  useEffect(() => {
    if (!showSeatMap || !selectedSchedule || !id) {
      return;
    }
    const fetchSeatMap = async () => {
      try {
        const map = await flightService.getSeatMap(
          id as string,
          selectedSchedule._id
        );
        setSeatMap(map);
      } catch (err) {
        console.error("Error loading seat map:", err);
        setSeatMap([]); // Fallback to empty (client will generate default)
      }
    };
    fetchSeatMap();
  }, [showSeatMap, selectedSchedule, id]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Calculate total price with age-based pricing
  const calculateTotalPrice = () => {
    if (!flight) return 0;

    const selectedFlightClass = flight.classes?.find(
      (c) => c.className.toLowerCase() === selectedClass.toLowerCase()
    );

    if (!selectedFlightClass) return 0;

    const baseTicketPrice = selectedFlightClass.price;

    // Age-based pricing:
    // Adults (12+ years): 100% of ticket price
    // Children (2-11 years): 90% of ticket price
    // Infants (under 2 years): 10% of ticket price
    const adultsTotal = adults * baseTicketPrice;
    const childrenTotal = children * (baseTicketPrice * 0.9);
    const infantsTotal = infants * (baseTicketPrice * 0.1);
    const ticketTotal = adultsTotal + childrenTotal + infantsTotal;

    const baggageTotal = extraBaggage * EXTRA_BAGGAGE_PRICE;
    const insuranceTotal = insurance
      ? (adults + children + infants) * INSURANCE_PRICE
      : 0;
    const prioritySeatTotal = selectedSeats.reduce(
      (total, seat) => total + getSeatPrice(seat),
      0
    );

    return ticketTotal + baggageTotal + insuranceTotal + prioritySeatTotal;
  };

  const handleSeatSelect = (seat: string) => {
    const totalPassengers = adults + children + infants;

    if (selectedSeats.includes(seat)) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else {
      // Select seat (check limit)
      if (selectedSeats.length < totalPassengers) {
        setSelectedSeats([...selectedSeats, seat]);
      } else {
        alert(
          `Bạn chỉ có thể chọn tối đa ${totalPassengers} ghế (theo số hành khách)`
        );
      }
    }
  };

  const handleCloseSeatMap = () => {
    setShowSeatMap(false);
    if (selectedSeats.length > 0) {
      setPrioritySeat(true);
    } else {
      setPrioritySeat(false);
    }
  };

  const handleBookNow = () => {
    if (!flight?.classes || flight.classes.length === 0) {
      alert(
        "Chuyến bay này chưa có hạng vé nào. Vui lòng chọn chuyến bay khác."
      );
      return;
    }

    if (!selectedSchedule) {
      alert("Vui lòng chọn lịch bay (ngày/giờ) trước khi đặt vé.");
      return;
    }

    const selectedFlightClass = flight.classes.find(
      (c) => c.className.toLowerCase() === selectedClass.toLowerCase()
    );

    if (!selectedFlightClass) {
      alert("Hạng vé đã chọn không khả dụng. Vui lòng chọn hạng vé khác.");
      return;
    }

    const totalPrice = calculateTotalPrice();
    const selectedSeatsParam =
      selectedSeats.length > 0 ? selectedSeats.join(",") : "";
    router.push(
      `/bookingflight?flightId=${id}&scheduleId=${selectedSchedule._id}&adults=${adults}&children=${children}&infants=${infants}&seatClass=${selectedClass}&extraBaggage=${extraBaggage}&insurance=${insurance}&prioritySeat=${prioritySeat}&selectedSeats=${selectedSeatsParam}&totalPrice=${totalPrice}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <LoadingSpinner
          type="plane"
          size="xl"
          text="Đang tải thông tin chuyến bay..."
        />
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100 flex flex-col items-center justify-center">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <div className="text-6xl mb-4">🛫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Không tìm thấy chuyến bay
          </h1>
          <p className="text-gray-600 mb-8">
            Chuyến bay bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại.
          </p>
          <Link
            href="/flights"
            className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 inline-block"
          >
            ← Quay lại danh sách chuyến bay
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100">
      <Header />
      {/* Hero section */}
      <div className="relative h-56 md:h-72 lg:h-80 w-full flex items-center justify-center mt-20">
        <div className="absolute inset-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${currentBanner}')`,
              filter: "brightness(0.4)"
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900/60 via-blue-900/40 to-indigo-900/60"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="flex flex-col items-center justify-center">
            <Plane className="w-12 h-12 md:w-16 md:h-16 mb-2 text-white" />
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-xl mb-2">
              Chi tiết chuyến bay
            </h1>
            <div className="text-lg md:text-xl text-white/90 font-medium drop-shadow-lg">
              {flight.flightCode} • {flight.airlineId.name}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <section className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
            <button
              type="button"
              onClick={() => router.push("/flights")}
              className="inline-flex items-center px-4 py-2 bg-white border border-sky-500 text-sky-600 font-semibold rounded-lg hover:bg-sky-50 transition-all duration-300 text-sm md:text-base"
            >
              ← Quay lại danh sách chuyến bay
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Route Header */}
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 p-4 md:p-6 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2">
                    <PlaneTakeoff className="w-6 h-6 md:w-8 md:h-8" />
                    <div className="text-center sm:text-left">
                      <div className="font-bold text-lg md:text-xl">
                        {flight.departureAirportId.city}
                      </div>
                      <div className="text-sky-100 text-sm">
                        {flight.departureAirportId.iata}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sky-200">
                      <div className="w-8 h-px bg-sky-200"></div>
                      <Plane className="w-5 h-5" />
                      <div className="w-8 h-px bg-sky-200"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlaneLanding className="w-6 h-6 md:w-8 md:h-8" />
                    <div className="text-center sm:text-left">
                      <div className="font-bold text-lg md:text-xl">
                        {flight.arrivalAirportId.city}
                      </div>
                      <div className="text-sky-100 text-sm">
                        {flight.arrivalAirportId.iata}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-sky-100 text-sm">Chuyến bay</div>
                  <div className="font-bold text-xl md:text-2xl">
                    {flight.flightCode}
                  </div>
                  <div className="text-sky-100 text-sm">
                    {flight.airlineId.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Details */}
            <div className="p-4 md:p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Departure Info */}
                <div className="bg-sky-50 rounded-xl p-4">
                  <h3 className="font-semibold text-sky-800 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Khởi hành
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Ngày:</span>
                      <span className="font-semibold">
                        {formatDate(flight.departureTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Giờ:</span>
                      <span className="font-semibold text-lg">
                        {formatTime(flight.departureTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrival Info */}
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Đến nơi
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Ngày:</span>
                      <span className="font-semibold">
                        {formatDate(flight.arrivalTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Giờ:</span>
                      <span className="font-semibold text-lg">
                        {formatTime(flight.arrivalTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Stats */}
              <FlightInfoSection flight={flight} />

              {/* Booking Section */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Đặt vé ngay
                </h3>

                {/* Class Selection */}
                <ClassSelector
                  classes={flight.classes}
                  selectedClass={selectedClass}
                  onSelectClass={setSelectedClass}
                />

                {/* Passenger Count */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Số lượng hành khách
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Adults */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">
                        Người lớn (≥12 tuổi)
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:border-sky-500 hover:text-sky-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="font-semibold text-lg">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(adults + 1)}
                          className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:border-sky-500 hover:text-sky-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">
                        Trẻ em (2-11 tuổi)
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:border-sky-500 hover:text-sky-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="font-semibold text-lg">
                          {children}
                        </span>
                        <button
                          type="button"
                          onClick={() => setChildren(children + 1)}
                          className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:border-sky-500 hover:text-sky-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Infants */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">
                        Em bé (&lt;2 tuổi)
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setInfants(Math.max(0, infants - 1))}
                          className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:border-sky-500 hover:text-sky-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="font-semibold text-lg">{infants}</span>
                        <button
                          type="button"
                          onClick={() => setInfants(infants + 1)}
                          className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:border-sky-500 hover:text-sky-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Age-based Pricing Info */}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-800">
                      <strong>
                        <Tag className="inline-block w-4 h-4 mr-1 text-current" />
                        Chính sách giá vé:
                      </strong>
                      <ul className="mt-1 ml-4 space-y-1">
                        <li>• Người lớn (≥12 tuổi): 100% giá vé</li>
                        <li>• Trẻ em (2-11 tuổi): 90% giá vé</li>
                        <li>• Em bé (&lt;2 tuổi): 10% giá vé</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Add-ons */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Dịch vụ bổ sung
                  </label>
                  <div className="space-y-3">
                    {/* Extra Baggage */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 flex items-center gap-2">
                            <Luggage className="w-5 h-5 text-sky-600" />
                            Hành lý ký gửi thêm
                          </div>
                          <div className="text-sm text-gray-600">
                            {EXTRA_BAGGAGE_PRICE.toLocaleString("vi-VN")} đ/kiện
                            (20kg)
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExtraBaggage(Math.max(0, extraBaggage - 1))
                            }
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:border-sky-500 hover:text-sky-600 transition-colors"
                          >
                            -
                          </button>
                          <span className="font-semibold text-lg w-8 text-center">
                            {extraBaggage}
                          </span>
                          <button
                            type="button"
                            onClick={() => setExtraBaggage(extraBaggage + 1)}
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:border-sky-500 hover:text-sky-600 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Travel Insurance */}
                    <div
                      onClick={() => setInsurance(!insurance)}
                      className={`cursor-pointer bg-gray-50 rounded-lg p-4 border-2 transition-all ${
                        insurance
                          ? "border-sky-500 bg-sky-50"
                          : "border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-sky-600" />
                            Bảo hiểm du lịch
                          </div>
                          <div className="text-sm text-gray-600">
                            {INSURANCE_PRICE.toLocaleString("vi-VN")} đ/người
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={insurance}
                          onChange={(e) => setInsurance(e.target.checked)}
                          className="w-5 h-5 text-sky-600 rounded"
                        />
                      </div>
                    </div>

                    {/* Priority Seat */}
                    <div
                      onClick={() => setShowSeatMap(true)}
                      className={`cursor-pointer bg-gray-50 rounded-lg p-4 border-2 transition-all ${
                        prioritySeat || selectedSeats.length > 0
                          ? "border-sky-500 bg-sky-50"
                          : "border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 flex items-center gap-2">
                            <Armchair className="w-5 h-5 text-sky-600" />
                            Chọn chỗ ngồi ưu tiên
                          </div>
                          <div className="text-sm text-gray-600">
                            {selectedSeats.length > 0
                              ? `Đã chọn ${
                                  selectedSeats.length
                                } ghế: ${selectedSeats.join(", ")}`
                              : "Từ 100,000 đ/ghế (tuỳ vị trí)"}
                          </div>
                        </div>
                        <div className="text-sky-600 font-semibold">
                          Chọn ghế →
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    Chi tiết giá
                  </h4>
                  <div className="space-y-2 text-sm mb-4">
                    {adults > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Người lớn ({adults} x{" "}
                          {(
                            flight.classes?.find(
                              (c) =>
                                c.className.toLowerCase() ===
                                selectedClass.toLowerCase()
                            )?.price || 0
                          ).toLocaleString("vi-VN")}{" "}
                          đ)
                        </span>
                        <span className="font-medium">
                          {(
                            adults *
                            (flight.classes?.find(
                              (c) =>
                                c.className.toLowerCase() ===
                                selectedClass.toLowerCase()
                            )?.price || 0)
                          ).toLocaleString("vi-VN")}{" "}
                          đ
                        </span>
                      </div>
                    )}
                    {children > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Trẻ em ({children} x{" "}
                          {(
                            (flight.classes?.find(
                              (c) =>
                                c.className.toLowerCase() ===
                                selectedClass.toLowerCase()
                            )?.price || 0) * 0.9
                          ).toLocaleString("vi-VN")}{" "}
                          đ - 90%)
                        </span>
                        <span className="font-medium">
                          {(
                            children *
                            (flight.classes?.find(
                              (c) =>
                                c.className.toLowerCase() ===
                                selectedClass.toLowerCase()
                            )?.price || 0) *
                            0.9
                          ).toLocaleString("vi-VN")}{" "}
                          đ
                        </span>
                      </div>
                    )}
                    {infants > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Em bé ({infants} x{" "}
                          {(
                            (flight.classes?.find(
                              (c) =>
                                c.className.toLowerCase() ===
                                selectedClass.toLowerCase()
                            )?.price || 0) * 0.1
                          ).toLocaleString("vi-VN")}{" "}
                          đ - 10%)
                        </span>
                        <span className="font-medium">
                          {(
                            infants *
                            (flight.classes?.find(
                              (c) =>
                                c.className.toLowerCase() ===
                                selectedClass.toLowerCase()
                            )?.price || 0) *
                            0.1
                          ).toLocaleString("vi-VN")}{" "}
                          đ
                        </span>
                      </div>
                    )}
                    {extraBaggage > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Hành lý thêm ({extraBaggage} kiện)
                        </span>
                        <span className="font-medium">
                          {(extraBaggage * EXTRA_BAGGAGE_PRICE).toLocaleString(
                            "vi-VN"
                          )}{" "}
                          đ
                        </span>
                      </div>
                    )}
                    {insurance && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Bảo hiểm ({adults + children + infants} người)
                        </span>
                        <span className="font-medium">
                          {(
                            (adults + children + infants) *
                            INSURANCE_PRICE
                          ).toLocaleString("vi-VN")}{" "}
                          đ
                        </span>
                      </div>
                    )}
                    {selectedSeats.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Chỗ ngồi ưu tiên ({selectedSeats.length} ghế:{" "}
                          {selectedSeats.join(", ")})
                        </span>
                        <span className="font-medium">
                          {selectedSeats
                            .reduce(
                              (total, seat) => total + getSeatPrice(seat),
                              0
                            )
                            .toLocaleString("vi-VN")}{" "}
                          đ
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-sky-200 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">
                      Tổng cộng:
                    </span>
                    <span className="text-2xl font-bold text-sky-600">
                      {calculateTotalPrice().toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>

                {/* Book Now Button */}
                <button
                  type="button"
                  onClick={handleBookNow}
                  disabled={!flight?.classes || flight.classes.length === 0}
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {flight?.classes && flight.classes.length > 0
                    ? `Đặt vé ngay - ${calculateTotalPrice().toLocaleString(
                        "vi-VN"
                      )} đ`
                    : "Chưa có hạng vé"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
