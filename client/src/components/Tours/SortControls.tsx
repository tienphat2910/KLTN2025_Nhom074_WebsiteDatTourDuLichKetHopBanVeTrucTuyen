"use client";

import React from "react";

// Add sort options interface
interface SortOption {
  value: string;
  label: string;
}

const sortOptions: SortOption[] = [
  { value: "default", label: "Mặc định" },
  { value: "featured", label: "Nổi bật" },
  { value: "price-asc", label: "Giá: Thấp → Cao" },
  { value: "price-desc", label: "Giá: Cao → Thấp" },
  { value: "name-asc", label: "Tên: A → Z" },
  { value: "name-desc", label: "Tên: Z → A" },
  { value: "rating", label: "Đánh giá cao nhất" },
  { value: "newest", label: "Mới nhất" }
];

interface SortControlsProps {
  sortBy: string;
  totalTours: number;
  destinationRegion?: string;
  isVisible: boolean;
  onSortChange: (value: string) => void;
}

const SortControls: React.FC<SortControlsProps> = ({
  sortBy,
  totalTours,
  destinationRegion,
  isVisible,
  onSortChange
}) => {
  return (
    <>
      {/* Sort Controls */}
      <div
        className={`mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        } transition-all duration-500`}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {totalTours} tour tìm thấy
          </h2>
          {destinationRegion && (
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
              {destinationRegion}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="sort-select"
            className="text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            Sắp xếp theo:
          </label>
          <div className="relative">
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 hover:border-gray-300 shadow-sm min-w-[180px]"
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="py-1"
                >
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sort indicator */}
      {sortBy !== "default" && (
        <div
          className={`mb-6 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          } transition-all duration-500 delay-100`}
        >
          <div className="flex items-center gap-2 text-blue-700">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            <span className="text-sm font-medium">
              Đã sắp xếp theo:{" "}
              {sortOptions.find((opt) => opt.value === sortBy)?.label}
            </span>
          </div>
          <button
            onClick={() => onSortChange("default")}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </>
  );
};

export default SortControls;
