"use client";

import React from "react";
import Link from "next/link";
import { Backpack } from "lucide-react";

interface EmptyStateProps {
  destinationName: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ destinationName }) => {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4">
        <Backpack className="w-16 h-16 text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-4">
        Chưa có tour nào
      </h3>
      <p className="text-gray-600 mb-8">
        Hiện tại chưa có tour nào cho địa điểm {destinationName}. Vui lòng quay
        lại sau hoặc khám phá các địa điểm khác.
      </p>
      <Link
        href="/tours"
        className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300"
      >
        Xem tất cả tour
      </Link>
    </div>
  );
};

export default EmptyState;
