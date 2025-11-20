"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Calendar } from "lucide-react";
import { tourService, Tour } from "@/services/tourService";

// Define props interface for TourCard component
interface TourCardProps {
  tour: Tour;
  isVisible: boolean;
  index: number;
  destinationImage: string;
}

// Create a memoized TourCard component to prevent unnecessary re-renders
const TourCard = ({
  tour,
  isVisible,
  index,
  destinationImage
}: TourCardProps) => {
  const discountedPrice = useMemo(
    () => tourService.getDiscountedPrice(tour.price, tour.discount),
    [tour.price, tour.discount]
  );

  const availabilityPercentage = useMemo(
    () => (tour.availableSeats / tour.seats) * 100,
    [tour.availableSeats, tour.seats]
  );

  return (
    <div
      className={`card-surface rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } border border-white/20`}
      style={{
        transitionDelay: `${Math.min(index * 50, 300)}ms`,
        willChange: "transform, opacity"
      }}
    >
      <div className="relative h-48 flex-shrink-0">
        <div className="w-full h-full bg-gray-200">
          {tour.images && tour.images[0] ? (
            <Image
              src={tour.images[0]}
              alt={tour.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              {...(index < 3 ? { priority: true } : { loading: "lazy" })}
            />
          ) : destinationImage ? (
            <Image
              src={destinationImage}
              alt="Destination"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        {tour.isFeatured && (
          <div className="absolute top-3 left-3 bg-yellow-500 text-yellow-900 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-900" />
            Nổi bật
          </div>
        )}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {tour.duration}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-800 line-clamp-2 min-h-[3.5rem] flex items-start">
            {tour.title}
          </h3>
        </div>

        <div className="flex-grow space-y-2 mb-4">
          <p className="text-gray-600 flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">
              Khởi hành từ: {tour.departureLocation.name}
            </span>
          </p>
          <p className="text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {new Date(tour.startDate).toLocaleDateString("vi-VN")} -{" "}
              {new Date(tour.endDate).toLocaleDateString("vi-VN")}
            </span>
          </p>
        </div>

        <div className="mb-4 flex-shrink-0">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Còn {tour.availableSeats} chỗ</span>
            <span>{tour.seats} chỗ tối đa</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${availabilityPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-auto flex-shrink-0">
          <div>
            {tour.discount > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {tourService.formatPrice(tour.price)}
              </span>
            )}
            <div className="text-2xl font-bold text-green-600">
              {tourService.formatPrice(discountedPrice)}
            </div>
            <span className="text-gray-500 text-sm">/người lớn</span>
            {tour.discount > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">
                -{tour.discount}%
              </span>
            )}
          </div>
          <Link
            href={`/tours/detail/${tour.slug}`}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex-shrink-0"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TourCard;
