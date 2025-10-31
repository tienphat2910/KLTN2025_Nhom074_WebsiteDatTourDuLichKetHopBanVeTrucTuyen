"use client";

import { CalendarDays } from "lucide-react";
import { FlightSchedule } from "@/services/flightService";

interface ScheduleSelectorProps {
  schedules: FlightSchedule[];
  selectedSchedule: FlightSchedule | null;
  onSelectSchedule: (schedule: FlightSchedule) => void;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
}

export default function ScheduleSelector({
  schedules,
  selectedSchedule,
  onSelectSchedule,
  formatDate,
  formatTime
}: ScheduleSelectorProps) {
  if (!schedules || schedules.length === 0) return null;

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Chọn lịch bay
      </label>
      <div className="grid grid-cols-1 gap-3">
        {schedules.map((schedule) => {
          const isSelected = selectedSchedule?._id === schedule._id;
          return (
            <div
              key={schedule._id}
              onClick={() => onSelectSchedule(schedule)}
              className={`cursor-pointer bg-gradient-to-r from-blue-50 to-sky-50 border-2 rounded-lg p-3 transition-all duration-300 ${
                isSelected
                  ? "border-blue-500 shadow-lg"
                  : "border-blue-200 hover:border-blue-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-800">
                      {formatDate(schedule.departureDate)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatTime(schedule.departureDate)} -{" "}
                      {formatTime(schedule.arrivalDate)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Còn {schedule.remainingSeats} ghế • Giá:{" "}
                    {schedule.currentPrice.toLocaleString("vi-VN")} đ
                  </div>
                </div>
                <input
                  type="radio"
                  checked={isSelected}
                  onChange={() => onSelectSchedule(schedule)}
                  className="w-5 h-5 text-blue-600"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
