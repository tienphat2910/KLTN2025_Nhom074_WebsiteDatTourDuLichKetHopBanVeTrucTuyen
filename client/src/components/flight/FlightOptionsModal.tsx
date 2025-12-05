"use client";

import { useState, useEffect } from "react";
import { Flight } from "@/services/flightService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Package, Shield } from "lucide-react";
import ClassSelector from "./ClassSelector";
import ScheduleSelector from "./ScheduleSelector";

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

  // Update selectedSchedule when flight changes
  useEffect(() => {
    setSelectedSchedule(getInitialSchedule());
  }, [flight]);

  const totalPassengers =
    defaultPassengers.adults +
    defaultPassengers.children +
    defaultPassengers.infants;

  // Pricing constants
  const EXTRA_BAGGAGE_PRICE = 200000;
  const INSURANCE_PRICE = 150000;

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

    return ticketTotal + baggageTotal + insuranceTotal;
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
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          {flight.upcomingSchedules && flight.upcomingSchedules.length > 0 && (
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
  );
}
