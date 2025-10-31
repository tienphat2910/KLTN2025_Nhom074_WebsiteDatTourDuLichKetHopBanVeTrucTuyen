"use client";

import { FlightClass } from "@/services/flightService";

interface ClassSelectorProps {
  classes?: FlightClass[];
  selectedClass: string;
  onSelectClass: (classKey: string) => void;
}

export default function ClassSelector({
  classes,
  selectedClass,
  onSelectClass
}: ClassSelectorProps) {
  if (!classes || classes.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        Chưa có thông tin hạng vé
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${
        classes.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
      }`}
    >
      {classes.map((flightClass) => {
        const className = flightClass.className;
        const classKey = className.toLowerCase();
        const isEconomy = classKey === "economy";
        const isBusiness = classKey === "business";

        return (
          <div
            key={flightClass._id}
            onClick={() => onSelectClass(classKey)}
            className={`cursor-pointer ${
              isBusiness
                ? "bg-gradient-to-r from-amber-50 to-orange-50"
                : isEconomy
                ? "bg-gradient-to-r from-sky-50 to-blue-50"
                : "bg-gradient-to-r from-purple-50 to-pink-50"
            } border-2 rounded-xl p-4 transition-all duration-300 ${
              selectedClass === classKey
                ? isBusiness
                  ? "border-amber-500 shadow-lg scale-105"
                  : isEconomy
                  ? "border-sky-500 shadow-lg scale-105"
                  : "border-purple-500 shadow-lg scale-105"
                : isBusiness
                ? "border-amber-200 hover:border-amber-400"
                : isEconomy
                ? "border-sky-200 hover:border-sky-400"
                : "border-purple-200 hover:border-purple-400"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4
                className={`font-semibold ${
                  isBusiness
                    ? "text-amber-800"
                    : isEconomy
                    ? "text-sky-800"
                    : "text-purple-800"
                }`}
              >
                {className === "Economy"
                  ? "Phổ thông"
                  : className === "Business"
                  ? "Thương gia"
                  : className === "Premium Economy" || className === "Premium"
                  ? "Phổ thông đặc biệt"
                  : className}
              </h4>
              <input
                type="radio"
                checked={selectedClass === classKey}
                onChange={() => onSelectClass(classKey)}
                className={`w-5 h-5 ${
                  isBusiness
                    ? "text-amber-600"
                    : isEconomy
                    ? "text-sky-600"
                    : "text-purple-600"
                }`}
              />
            </div>
            <div
              className={`text-2xl font-bold mb-1 ${
                isBusiness
                  ? "text-amber-600"
                  : isEconomy
                  ? "text-sky-600"
                  : "text-purple-600"
              }`}
            >
              {flightClass.price?.toLocaleString("vi-VN") || "N/A"} đ
            </div>
            <div className="text-sm text-gray-600">
              Còn {flightClass.availableSeats || 0} ghế
            </div>
          </div>
        );
      })}
    </div>
  );
}
