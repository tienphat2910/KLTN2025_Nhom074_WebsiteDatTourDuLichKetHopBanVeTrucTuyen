"use client";

import { Clock, Plane, CheckCircle2, Armchair } from "lucide-react";
import { Flight } from "@/services/flightService";

interface FlightInfoSectionProps {
  flight: Flight;
}

export default function FlightInfoSection({ flight }: FlightInfoSectionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <Clock className="w-8 h-8 mx-auto mb-1 text-sky-600" />
        <div className="text-xs text-gray-600">Thời lượng</div>
        <div className="font-semibold text-sky-700">
          {Math.floor(flight.durationMinutes / 60)}h{" "}
          {flight.durationMinutes % 60}m
        </div>
      </div>
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <Plane className="w-8 h-8 mx-auto mb-1 text-sky-600" />
        <div className="text-xs text-gray-600">Máy bay</div>
        <div className="font-semibold text-sky-700">
          {flight.aircraft?.model || "Đang cập nhật"}
        </div>
      </div>
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-green-600" />
        <div className="text-xs text-gray-600">Trạng thái</div>
        <div className="font-semibold text-green-700">{flight.status}</div>
      </div>
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <Armchair className="w-8 h-8 mx-auto mb-1 text-sky-600" />
        <div className="text-xs text-gray-600">Ghế trống</div>
        <div className="font-semibold text-sky-700">
          {flight.classes?.find((c) => c.className === "Economy")
            ?.availableSeats || 0}
        </div>
      </div>
    </div>
  );
}
