import React from 'react';
import { MapPin, Star, Ticket } from 'lucide-react';
import { Activity } from '@/types/activity';
import Image from 'next/image';

interface ActivityCardProps {
  activity: Activity;
  onClick?: () => void;
  variant?: 'grid' | 'horizontal';
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onClick, variant = 'grid' }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

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
          src={activity.gallery?.[0] || '/placeholder-activity.jpg'}
          alt={activity.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes={variant === 'horizontal' ? "(max-width: 768px) 280px, 320px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"}
        />
        {activity.popular && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
            Nổi bật
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {activity.name}
        </h3>

        <div className="flex items-center gap-1 mb-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {activity.location?.address || 'Địa chỉ chưa cập nhật'}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">
          {activity.description}
        </p>

        {/* Price */}
        <div className="flex flex-col mt-auto">
          {activity.price?.retail?.adult && (
            <span className="text-lg font-bold text-orange-600">
              Từ {formatPrice(activity.price.retail.adult)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;