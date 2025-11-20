"use client";

import React, { useState, useEffect } from "react";
import { destinationService, Destination } from "@/services/destinationService";
import { toast } from "sonner";

interface SearchFormProps {
  selectedDestination: string;
  searchStartDate: string;
  searchEndDate: string;
  onDestinationChange: (slug: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onSearch: (url: string) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({
  selectedDestination,
  searchStartDate,
  searchEndDate,
  onDestinationChange,
  onStartDateChange,
  onEndDateChange,
  onSearch
}) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Load destinations for search
  useEffect(() => {
    destinationService.getDestinations({ limit: 100 }).then((res) => {
      if (res.success) setDestinations(res.data.destinations);
    });
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDestination) {
      toast.error("Vui lòng chọn địa điểm trước khi tìm kiếm!");
      return;
    }
    let url = `/tours/${selectedDestination}`;
    const params: string[] = [];
    if (searchStartDate) params.push(`start=${searchStartDate}`);
    if (searchEndDate) params.push(`end=${searchEndDate}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    onSearch(url);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="mx-auto flex flex-col md:flex-row items-end justify-center gap-6 bg-white rounded-3xl shadow-lg px-4 md:px-8 py-6 w-full max-w-4xl z-50 overflow-visible"
      style={{ fontFamily: "inherit" }}
    >
      {/* Địa điểm */}
      <div className="flex flex-col flex-1 items-start w-full">
        <label className="font-bold text-gray-800 mb-1 text-sm">
          Bạn muốn đi đâu <span className="text-red-500">(*)</span>
        </label>
        <div className="relative w-full">
          <button
            type="button"
            className="w-full border border-gray-400 rounded-lg px-4 py-3 text-base font-semibold text-gray-800 bg-white text-left"
            onClick={() => setShowDestinationDropdown((v) => !v)}
          >
            {selectedDestination
              ? destinations.find((d) => d.slug === selectedDestination)?.name
              : "Chọn địa điểm"}
          </button>
          {showDestinationDropdown && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
              {destinations.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  className="block w-full text-left px-4 py-3 text-gray-800 hover:bg-blue-50 text-base font-semibold"
                  onClick={() => {
                    onDestinationChange(d.slug);
                    setShowDestinationDropdown(false);
                  }}
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ngày khởi hành */}
      <div className="flex flex-col flex-1 items-start w-full">
        <label className="font-semibold text-gray-800 mb-1 text-sm">
          Ngày khởi hành
        </label>
        <div className="flex gap-2 w-full">
          <input
            type="date"
            className="flex-1 border border-gray-400 rounded-lg px-3 py-3 text-gray-800 bg-white text-base"
            value={searchStartDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            min={today}
          />
          <span className="px-1 text-gray-600 flex items-center">-</span>
          <input
            type="date"
            className="flex-1 border border-gray-400 rounded-lg px-3 py-3 text-gray-800 bg-white text-base"
            value={searchEndDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={searchStartDate || today}
          />
        </div>
      </div>

      {/* Nút tìm kiếm */}
      <div className="self-stretch flex items-center mt-5 w-full md:w-auto">
        <button
          type="submit"
          className="flex items-center gap-2 bg-[#1664F6] text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all text-base whitespace-nowrap w-full md:w-auto justify-center"
          style={{ minWidth: 140 }}
        >
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Tìm kiếm
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
