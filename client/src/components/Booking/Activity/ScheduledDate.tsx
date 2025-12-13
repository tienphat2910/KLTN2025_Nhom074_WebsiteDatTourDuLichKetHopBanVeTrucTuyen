"use client";

import { Calendar } from "lucide-react";

interface ScheduledDateProps {
  scheduledDate: string;
  setScheduledDate: (date: string) => void;
}

export default function ScheduledDate({
  scheduledDate,
  setScheduledDate
}: ScheduledDateProps) {
  // Calculate minimum date based on current time
  const getMinDate = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // If after 17:00, minimum date is tomorrow
    if (currentHour >= 17) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }

    // Otherwise, minimum date is today
    return now.toISOString().split("T")[0];
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Ngày tham gia *
      </label>
      {new Date().getHours() >= 17 && (
        <p className="text-sm text-orange-600 mb-2">
          ⚠️ Đã quá 17h, bạn chỉ có thể đặt hoạt động từ ngày mai trở đi
        </p>
      )}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          min={getMinDate()}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />
      </div>
    </div>
  );
}
