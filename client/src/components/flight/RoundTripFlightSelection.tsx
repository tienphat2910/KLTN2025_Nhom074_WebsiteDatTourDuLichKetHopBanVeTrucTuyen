"use client";

import { useState } from "react";
import { Flight } from "@/services/flightService";
import FlightSearchResults from "./FlightSearchResults";
import { ChevronRight, Check, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SearchParams {
  from: string;
  to: string;
  date: string;
  passengers: number;
  seatClass: string;
}

interface Props {
  outboundFlights: Flight[];
  returnFlights: Flight[];
  loading: boolean;
  error: string | null;
  outboundSearchParams: SearchParams;
  returnSearchParams: SearchParams;
  adults: number;
  children: number;
  infants: number;
}

type SelectionStep = "outbound" | "return" | "booking";

interface FlightSelection {
  flight: Flight;
  scheduleId: string;
  seatClass: string;
  extraBaggage?: number;
  insurance?: boolean;
  selectedSeats?: string[];
}

export default function RoundTripFlightSelection({
  outboundFlights,
  returnFlights,
  loading,
  error,
  outboundSearchParams,
  returnSearchParams,
  adults,
  children,
  infants
}: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SelectionStep>("outbound");
  const [selectedOutbound, setSelectedOutbound] =
    useState<FlightSelection | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<FlightSelection | null>(
    null
  );

  const handleOutboundSelect = (
    flight: Flight,
    scheduleId: string,
    seatClass: string,
    options?: {
      extraBaggage?: number;
      insurance?: boolean;
      selectedSeats?: string[];
    }
  ) => {
    setSelectedOutbound({
      flight,
      scheduleId,
      seatClass,
      extraBaggage: options?.extraBaggage || 0,
      insurance: options?.insurance || false,
      selectedSeats: options?.selectedSeats || []
    });
    setCurrentStep("return");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReturnSelect = (
    flight: Flight,
    scheduleId: string,
    seatClass: string,
    options?: {
      extraBaggage?: number;
      insurance?: boolean;
      selectedSeats?: string[];
    }
  ) => {
    const returnSelection: FlightSelection = {
      flight,
      scheduleId,
      seatClass,
      extraBaggage: options?.extraBaggage || 0,
      insurance: options?.insurance || false,
      selectedSeats: options?.selectedSeats || []
    };
    setSelectedReturn(returnSelection);
    proceedToBooking(selectedOutbound!, returnSelection);
  };

  const proceedToBooking = (
    outbound: FlightSelection,
    returnFlight: FlightSelection
  ) => {
    // Navigate to booking page with both flights
    const params = new URLSearchParams({
      // Outbound flight
      outboundFlightId: outbound.flight._id,
      outboundScheduleId: outbound.scheduleId,
      outboundSeatClass: outbound.seatClass,
      // Return flight
      returnFlightId: returnFlight.flight._id,
      returnScheduleId: returnFlight.scheduleId,
      returnSeatClass: returnFlight.seatClass,
      // Passengers
      adults: adults.toString(),
      children: children.toString(),
      infants: infants.toString(),
      // Round trip flag
      isRoundTrip: "true",
      // Outbound add-ons
      outboundExtraBaggage: (outbound.extraBaggage || 0).toString(),
      outboundInsurance: (outbound.insurance || false).toString(),
      outboundSelectedSeats: (outbound.selectedSeats || []).join(","),
      // Return add-ons
      returnExtraBaggage: (returnFlight.extraBaggage || 0).toString(),
      returnInsurance: (returnFlight.insurance || false).toString(),
      returnSelectedSeats: (returnFlight.selectedSeats || []).join(",")
    });

    router.push(`/bookingflight?${params.toString()}`);
  };

  const goBackToOutbound = () => {
    setCurrentStep("outbound");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* Step 1: Chuyến đi */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                currentStep === "outbound"
                  ? "bg-sky-600 text-white"
                  : selectedOutbound
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {selectedOutbound ? <Check className="w-6 h-6" /> : "1"}
            </div>
            <div>
              <div className="font-semibold text-gray-900">Chọn chuyến đi</div>
              <div className="text-sm text-gray-500">
                {outboundSearchParams.from} → {outboundSearchParams.to}
              </div>
              {selectedOutbound && (
                <div className="text-xs text-green-600 font-medium mt-1">
                  {selectedOutbound.flight.flightCode} - Đã chọn
                </div>
              )}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-gray-400 mx-2" />

          {/* Step 2: Chuyến về */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                currentStep === "return"
                  ? "bg-sky-600 text-white"
                  : selectedReturn
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {selectedReturn ? <Check className="w-6 h-6" /> : "2"}
            </div>
            <div>
              <div className="font-semibold text-gray-900">Chọn chuyến về</div>
              <div className="text-sm text-gray-500">
                {returnSearchParams.from} → {returnSearchParams.to}
              </div>
              {selectedReturn && (
                <div className="text-xs text-green-600 font-medium mt-1">
                  {selectedReturn.flight.flightCode} - Đã chọn
                </div>
              )}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-gray-400 mx-2" />

          {/* Step 3: Đặt vé */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-lg">
              3
            </div>
            <div>
              <div className="font-semibold text-gray-900">Điền thông tin</div>
              <div className="text-sm text-gray-500">Hoàn tất đặt vé</div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Outbound Flight Selection */}
      {currentStep === "outbound" && (
        <div>
          <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 text-white">
              <Plane className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Chọn chuyến bay đi</h2>
                <p className="text-sky-100 mt-1">
                  {outboundSearchParams.from} → {outboundSearchParams.to} |{" "}
                  {new Date(outboundSearchParams.date).toLocaleDateString(
                    "vi-VN"
                  )}
                </p>
              </div>
            </div>
          </div>

          <FlightSearchResults
            results={outboundFlights}
            loading={loading}
            error={error}
            searchParams={outboundSearchParams}
            isRoundTrip={true}
            tripType="outbound"
            onFlightSelect={handleOutboundSelect}
          />
        </div>
      )}

      {/* Step 2: Return Flight Selection */}
      {currentStep === "return" && selectedOutbound && (
        <div>
          {/* Selected Outbound Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    Chuyến đi đã chọn
                  </div>
                  <div className="font-bold text-lg text-gray-900">
                    {selectedOutbound.flight.flightCode} -{" "}
                    {selectedOutbound.flight.airlineId.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {outboundSearchParams.from} → {outboundSearchParams.to} |{" "}
                    {new Date(outboundSearchParams.date).toLocaleDateString(
                      "vi-VN"
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goBackToOutbound}
                className="text-sky-600 border-sky-600 hover:bg-sky-50"
              >
                Thay đổi
              </Button>
            </div>
          </div>

          {/* Return Flight Selection */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 text-white">
              <Plane className="w-8 h-8 transform rotate-180" />
              <div>
                <h2 className="text-2xl font-bold">Chọn chuyến bay về</h2>
                <p className="text-orange-100 mt-1">
                  {returnSearchParams.from} → {returnSearchParams.to} |{" "}
                  {new Date(returnSearchParams.date).toLocaleDateString(
                    "vi-VN"
                  )}
                </p>
              </div>
            </div>
          </div>

          <FlightSearchResults
            results={returnFlights}
            loading={loading}
            error={error}
            searchParams={returnSearchParams}
            isRoundTrip={true}
            tripType="return"
            onFlightSelect={handleReturnSelect}
          />
        </div>
      )}
    </div>
  );
}
