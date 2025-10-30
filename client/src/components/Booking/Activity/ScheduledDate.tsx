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
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Ngày tham gia *
      </label>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />
      </div>
    </div>
  );
}
