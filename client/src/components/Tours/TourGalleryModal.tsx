interface TourGalleryModalProps {
  images: string[];
  selectedImageIndex: number;
  showGallery: boolean;
  title: string;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectImage: (index: number) => void;
}

export default function TourGalleryModal({
  images,
  selectedImageIndex,
  showGallery,
  title,
  onClose,
  onNext,
  onPrev,
  onSelectImage
}: TourGalleryModalProps) {
  if (!showGallery || !images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
        aria-label="Close gallery"
      >
        <svg
          className="w-6 h-6 md:w-8 md:h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
            aria-label="Previous image"
          >
            <svg
              className="w-6 h-6 md:w-8 md:h-8"
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
            onClick={onNext}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
            aria-label="Next image"
          >
            <svg
              className="w-6 h-6 md:w-8 md:h-8"
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

      <div className="max-w-full max-h-[80vh] mx-2 md:mx-4">
        <img
          src={images[selectedImageIndex]}
          alt={`${title} - Ảnh ${selectedImageIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
        {selectedImageIndex + 1} / {images.length}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-12 md:bottom-16 left-0 right-0 flex justify-center overflow-x-auto py-2">
          <div className="flex space-x-2 px-4 max-w-full">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => onSelectImage(index)}
                className={`w-12 h-9 md:w-16 md:h-12 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                  index === selectedImageIndex
                    ? "border-white"
                    : "border-transparent"
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
