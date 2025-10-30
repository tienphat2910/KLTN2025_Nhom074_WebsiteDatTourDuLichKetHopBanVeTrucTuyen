"use client";

import { Users, Clock } from "lucide-react";

interface ActivityInfoProps {
  adults: number;
  children: number;
  babies: number;
  seniors: number;
  operatingHours?: string;
}

export default function ActivityInfo({
  adults,
  children,
  babies,
  seniors,
  operatingHours
}: ActivityInfoProps) {
  return (
    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-6">
      <h2 className="font-semibold text-lg mb-3 text-orange-900">
        Thông tin hoạt động
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-orange-600" />
          <span>
            {adults} người lớn, {children} trẻ em, {babies} em bé, {seniors}{" "}
            người cao tuổi
          </span>
        </div>
        {operatingHours && (
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-orange-600" />
            <span>Giờ hoạt động: {operatingHours}</span>
          </div>
        )}
      </div>
    </div>
  );
}
