import { useState } from "react";

interface TourImageGalleryProps {
  images: string[];
  title: string;
  onOpenGallery: (index: number) => void;
  isVisible: boolean;
}

export default function TourImageGallery({
  images,
  title,
  onOpenGallery,
  isVisible
}: TourImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div
      className={`bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden mb-6 md:mb-8 transition-all duration-1000 ${
        isVisible ? "animate-fade-in" : "opacity-0"
      }`}
    >
      <div className="relative h-56 sm:h-64 md:h-80 lg:h-96">
        <div
          className="w-full h-full bg-cover bg-center cursor-pointer"
          style={{
            backgroundImage: `url('${
              images[selectedImageIndex] || "/images/banner-tour.jpg"
            }')`
          }}
          onClick={() => onOpenGallery(selectedImageIndex)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Gallery Controls */}
        <button
          onClick={() => onOpenGallery(selectedImageIndex)}
          className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-black/70 transition-colors"
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm font-medium">Xem ảnh ({images.length})</span>
        </button>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) =>
                  prev === 0 ? images.length - 1 : prev - 1
                );
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev + 1) % images.length);
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Image indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === selectedImageIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail strip - horizontally scrollable on mobile */}
      {images.length > 1 && (
        <div className="p-3 md:p-4 border-t border-gray-200">
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 snap-x">
            {images.slice(0, 8).map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`flex-shrink-0 w-14 h-10 md:w-16 md:h-12 rounded-lg overflow-hidden border-2 transition-colors snap-start ${
                  index === selectedImageIndex
                    ? "border-blue-500"
                    : "border-gray-200"
                }`}
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${image}')` }}
                />
              </button>
            ))}
            {images.length > 8 && (
              <div className="flex-shrink-0 w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 font-medium">
                +{images.length - 8}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
