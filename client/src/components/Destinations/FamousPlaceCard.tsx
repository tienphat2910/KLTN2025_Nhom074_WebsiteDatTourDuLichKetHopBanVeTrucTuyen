import React from 'react';
import { FamousPlace } from '@/data/destinationData';

interface FamousPlaceCardProps {
  place: FamousPlace;
}

const FamousPlaceCard: React.FC<FamousPlaceCardProps> = ({ place }) => {
  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-default">
      <div className="relative h-40">
        <img
          src={place.image}
          alt={place.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h4 className="font-semibold text-sm mb-1 line-clamp-2">{place.name}</h4>
          {place.description && (
            <p className="text-xs text-white/90 line-clamp-2">{place.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamousPlaceCard;