import React from 'react';
import Link from 'next/link';
import { TravelExperience } from '@/data/destinationData';
import { ExternalLink } from 'lucide-react';

interface TravelExperienceCardProps {
  experience: TravelExperience;
}

const TravelExperienceCard: React.FC<TravelExperienceCardProps> = ({ experience }) => {
  return (
    <Link
      href={experience.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-64 bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      <div className="relative h-40">
        <img
          src={experience.image}
          alt={experience.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
            {experience.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <ExternalLink className="w-5 h-5 text-white bg-black/50 rounded-full p-1" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {experience.title}
        </h4>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {experience.description}
        </p>
      </div>
    </Link>
  );
};

export default TravelExperienceCard;