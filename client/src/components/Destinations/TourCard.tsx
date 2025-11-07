import React from 'react';
import { Calendar, MapPin, Star, Users } from 'lucide-react';
import { Tour } from '@/services/tourService';
import Image from 'next/image';

interface TourCardProps {
  tour: Tour;
  onClick?: () => void;
  variant?: 'grid' | 'horizontal';
}

const TourCard: React.FC<TourCardProps> = ({ tour, onClick, variant = 'grid' }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDiscountedPrice = (price: number, discount: number) => {
    return price - (price * discount) / 100;
  };

  const discountedPrice = getDiscountedPrice(tour.price, tour.discount);

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group h-full flex flex-col ${
        variant === 'horizontal' ? 'min-w-[280px] max-w-[320px] flex-shrink-0' : 'w-full'
      }`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={tour.images?.[0] || '/placeholder-tour.jpg'}
          alt={tour.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes={variant === 'horizontal' ? "(max-width: 768px) 280px, 320px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"}
        />
        {tour.discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
            -{tour.discount}%
          </div>
        )}
        {tour.isFeatured && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
            Nổi bật
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {tour.title}
        </h3>

        <div className="flex items-center gap-1 mb-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {tour.departureLocation?.name || 'Chưa cập nhật'}
          </span>
        </div>

        <div className="flex items-center gap-1 mb-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
          </span>
        </div>

        <div className="flex items-center gap-1 mb-3">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {tour.availableSeats}/{tour.seats} chỗ trống
          </span>
        </div>


        {/* Price */}
        <div className="flex items-center gap-2 mt-auto">
          {tour.discount > 0 ? (
            <>
              <span className="text-lg font-bold text-orange-600">
                {formatPrice(discountedPrice)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(tour.price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-orange-600">
              {formatPrice(tour.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourCard;