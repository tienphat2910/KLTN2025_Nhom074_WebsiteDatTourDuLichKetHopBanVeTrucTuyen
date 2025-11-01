"use client";

import { useState, useEffect } from "react";
import { Flight, flightService } from "@/services/flightService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Users,
  Briefcase,
  Package,
  Shield,
  Armchair,
  MapPin
} from "lucide-react";
import ClassSelector from "./ClassSelector";
import ScheduleSelector from "./ScheduleSelector";
import SeatMapModal from "./SeatMapModal";

interface FlightOptionsModalProps {
  flight: Flight;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: FlightBookingOptions) => void;
  defaultSeatClass?: string;
  defaultPassengers?: {
    adults: number;
    children: number;
    infants: number;
  };
  tripType?: "outbound" | "return";
}

export interface FlightBookingOptions {
  scheduleId: string;
  seatClass: string;
  extraBaggage: number;
  insurance: boolean;
  prioritySeat: boolean;
  selectedSeats: string[];
}

export default function FlightOptionsModal({
  flight,
  isOpen,
  onClose,
  onConfirm,
  defaultSeatClass = "economy",
  defaultPassengers = { adults: 1, children: 0, infants: 0 },
  tripType = "outbound"
}: FlightOptionsModalProps) {
  // Initialize selectedSchedule with flight's schedule or first upcoming schedule
  const getInitialSchedule = () => {
    if (flight.schedule) {
      return flight.schedule;
    }
    if (flight.upcomingSchedules && flight.upcomingSchedules.length > 0) {
      return flight.upcomingSchedules[0];
    }
    // If no schedule, create a default one with flight's _id
    return {
      _id: flight._id,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      availableSeats: flight.availableSeats || 0
    };
  };

  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(
    getInitialSchedule()
  );
  const [selectedClass, setSelectedClass] = useState(defaultSeatClass);
  const [extraBaggage, setExtraBaggage] = useState(0);
  const [insurance, setInsurance] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [seatMap, setSeatMap] = useState<any[]>([]);

  // Update selectedSchedule when flight changes
  useEffect(() => {
    setSelectedSchedule(getInitialSchedule());
  }, [flight]);

  // Fetch seat map when modal opens or schedule changes
  useEffect(() => {
    const fetchSeatMap = async () => {
      if (!selectedSchedule || !flight._id) return;

      try {
        const map = await flightService.getSeatMap(
          flight._id,
          selectedSchedule._id
        );
        setSeatMap(map);

        // Extract occupied seats from seat map
        const occupied = map
          .filter((seat: any) => seat.status !== "available")
          .map((seat: any) => seat.seatNumber);
        setOccupiedSeats(occupied);
      } catch (err) {
        console.error("Error loading seat map:", err);
        setSeatMap([]);
        setOccupiedSeats([]);
      }
    };

    if (showSeatMap) {
      fetchSeatMap();
    }
  }, [showSeatMap, selectedSchedule, flight._id]);

  const totalPassengers =
    defaultPassengers.adults +
    defaultPassengers.children +
    defaultPassengers.infants;

  // Pricing constants
  const EXTRA_BAGGAGE_PRICE = 200000;
  const INSURANCE_PRICE = 150000;

  // Seat pricing logic
  const getSeatPrice = (seat: string): number => {
    const rowNum = parseInt(seat.match(/\d+/)?.[0] || "0");
    const seatLetter = seat.match(/[A-Z]+/)?.[0] || "";

    // Emergency exit rows (higher price)
    if ([1, 12, 13].includes(rowNum)) {
      return 300000;
    }

    // Front rows
    if (rowNum <= 5) {
      return 200000;
    }

    // Window seats
    if (["A", "F", "K"].includes(seatLetter)) {
      return 150000;
    }

    // Aisle seats
    if (["C", "D", "H", "J"].includes(seatLetter)) {
      return 120000;
    }

    // Middle seats
    return 100000;
  };

  const isSeatOccupied = (seat: string): boolean => {
    return occupiedSeats.includes(seat);
  };

  const handleSeatSelect = (seat: string) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else {
      if (selectedSeats.length < totalPassengers) {
        setSelectedSeats([...selectedSeats, seat]);
      }
    }
  };

  const handleClearSeats = () => {
    setSelectedSeats([]);
  };

  const handleConfirmSeats = () => {
    setShowSeatMap(false);
  };

  const calculateTotal = () => {
    const selectedFlightClass = flight.classes?.find(
      (c) => c.className.toLowerCase() === selectedClass.toLowerCase()
    );

    if (!selectedFlightClass) return 0;

    const basePrice = selectedFlightClass.price;
    const adultsTotal = defaultPassengers.adults * basePrice;
    const childrenTotal = defaultPassengers.children * (basePrice * 0.9);
    const infantsTotal = defaultPassengers.infants * (basePrice * 0.1);
    const ticketTotal = adultsTotal + childrenTotal + infantsTotal;

    const baggageTotal = extraBaggage * EXTRA_BAGGAGE_PRICE;
    const insuranceTotal = insurance ? totalPassengers * INSURANCE_PRICE : 0;

    // Add seat selection price
    const seatTotal = selectedSeats.reduce(
      (total, seat) => total + getSeatPrice(seat),
      0
    );

    return ticketTotal + baggageTotal + insuranceTotal + seatTotal;
  };

  const handleConfirm = () => {
    if (!selectedSchedule) {
      alert("Vui lòng chọn lịch bay");
      return;
    }

    onConfirm({
      scheduleId: selectedSchedule._id,
      seatClass: selectedClass,
      extraBaggage,
      insurance,
      prioritySeat: false,
      selectedSeats
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <>
      <Dialog open={isOpen && !showSeatMap} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {tripType === "outbound"
                ? "Tùy chọn chuyến đi"
                : "Tùy chọn chuyến về"}
            </DialogTitle>
            <div className="text-sm text-gray-600">
              {flight.flightCode} - {flight.departureAirportId.city} →{" "}
              {flight.arrivalAirportId.city}
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Schedule Selection */}
            {flight.upcomingSchedules &&
              flight.upcomingSchedules.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Chọn lịch bay
                  </Label>
                  <ScheduleSelector
                    schedules={flight.upcomingSchedules}
                    selectedSchedule={selectedSchedule}
                    onSelectSchedule={setSelectedSchedule}
                    formatDate={formatDate}
                    formatTime={formatTime}
                  />
                </div>
              )}

            {/* Class Selection */}
            {flight.classes && flight.classes.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Hạng vé
                </Label>
                <ClassSelector
                  classes={flight.classes}
                  selectedClass={selectedClass}
                  onSelectClass={setSelectedClass}
                />
              </div>
            )}

            {/* Add-ons */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Dịch vụ bổ sung
              </Label>
              <div className="space-y-4">
                {/* Extra Baggage */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:border-sky-500 transition-colors">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-sky-600" />
                    <div>
                      <div className="font-medium">Hành lý ký gửi thêm</div>
                      <div className="text-sm text-gray-600">
                        {EXTRA_BAGGAGE_PRICE.toLocaleString("vi-VN")} đ/kiện
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExtraBaggage(Math.max(0, extraBaggage - 1))
                      }
                      disabled={extraBaggage === 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-semibold">
                      {extraBaggage}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExtraBaggage(Math.min(5, extraBaggage + 1))
                      }
                      disabled={extraBaggage === 5}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Insurance */}
                <div
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    insurance
                      ? "border-sky-500 bg-sky-50"
                      : "hover:border-sky-500"
                  }`}
                  onClick={() => setInsurance(!insurance)}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-sky-600" />
                    <div>
                      <div className="font-medium">Bảo hiểm du lịch</div>
                      <div className="text-sm text-gray-600">
                        {INSURANCE_PRICE.toLocaleString("vi-VN")} đ/người
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={insurance}
                    onChange={(e) => setInsurance(e.target.checked)}
                    className="w-5 h-5 text-sky-600 rounded"
                  />
                </div>

                {/* Seat Selection */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-sky-600" />
                      <div>
                        <div className="font-medium">Chọn chỗ ngồi</div>
                        <div className="text-sm text-gray-600">
                          {selectedSeats.length > 0
                            ? `Đã chọn: ${selectedSeats.join(", ")}`
                            : "Chọn ghế ngồi yêu thích"}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSeatMap(true)}
                      className="border-sky-600 text-sky-600 hover:bg-sky-50"
                    >
                      {selectedSeats.length > 0
                        ? "Thay đổi ghế"
                        : "Chọn ghế ngồi"}
                    </Button>
                  </div>
                  {selectedSeats.length > 0 && (
                    <div className="text-sm text-sky-600 font-semibold">
                      Tổng phí ghế:{" "}
                      {selectedSeats
                        .reduce((total, seat) => total + getSeatPrice(seat), 0)
                        .toLocaleString("vi-VN")}{" "}
                      đ
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-gray-800">Tổng tiền:</div>
                <div className="text-2xl font-bold text-sky-600">
                  {calculateTotal().toLocaleString("vi-VN")} đ
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Cho {totalPassengers} hành khách
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
              >
                {tripType === "outbound" ? "Chọn chuyến đi" : "Chọn chuyến về"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seat Map Modal */}
      <SeatMapModal
        show={showSeatMap}
        onClose={() => setShowSeatMap(false)}
        flight={flight}
        selectedClass={selectedClass}
        selectedSeats={selectedSeats}
        onSeatSelect={handleSeatSelect}
        onConfirm={handleConfirmSeats}
        onClearSelection={handleClearSeats}
        getSeatPrice={getSeatPrice}
        isSeatOccupied={isSeatOccupied}
        maxSeats={totalPassengers}
      />
    </>
  );
}
