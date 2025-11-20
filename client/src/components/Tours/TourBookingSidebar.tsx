import { Tour } from "@/services/tourService";
import { tourService } from "@/services/tourService";

interface TourBookingSidebarProps {
  tour: Tour;
  selectedParticipants: {
    adult: number;
    child: number;
    infant: number;
  };
  onUpdateParticipants: (
    type: "adult" | "child" | "infant",
    value: number
  ) => void;
  onBookTour: () => void;
  isVisible: boolean;
}

export default function TourBookingSidebar({
  tour,
  selectedParticipants,
  onUpdateParticipants,
  onBookTour,
  isVisible
}: TourBookingSidebarProps) {
  const calculateTotalPrice = () => {
    if (!tour) return 0;

    const discountedPrice = tourService.getDiscountedPrice(
      tour.price || 0,
      tour.discount || 0
    );
    const adultTotal = selectedParticipants.adult * discountedPrice;
    const childTotal =
      selectedParticipants.child *
      tourService.getDiscountedPrice(
        tour.pricingByAge?.child || 0,
        tour.discount || 0
      );
    const infantTotal =
      selectedParticipants.infant *
      tourService.getDiscountedPrice(
        tour.pricingByAge?.infant || 0,
        tour.discount || 0
      );

    return adultTotal + childTotal + infantTotal;
  };

  return (
    <div className="lg:col-span-1 sticky top-24">
      <div
        className={`bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 sticky top-24 transition-all duration-1000 delay-700 ${
          isVisible ? "animate-slide-up" : "opacity-0"
        }`}
      >
        {/* Price Display */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-2xl md:text-3xl font-bold text-green-600">
              {tourService.formatPrice(
                tourService.getDiscountedPrice(
                  tour?.price || 0,
                  tour?.discount || 0
                )
              )}
            </span>
          </div>
          <p className="text-gray-500 text-sm">Giá/người lớn</p>
        </div>

        {/* Participant Selection - Mobile friendly touchable area */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-gray-800 mb-4">
            Chọn số lượng khách
          </h4>

          {/* Adults */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-medium text-gray-700">Người lớn</span>
              <p className="text-sm text-gray-600">
                {tourService.formatPrice(
                  tourService.getDiscountedPrice(
                    tour?.pricingByAge?.adult || tour?.price || 0,
                    tour?.discount || 0
                  )
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  onUpdateParticipants("adult", selectedParticipants.adult - 1)
                }
                disabled={selectedParticipants.adult <= 1}
                className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">-</span>
              </button>
              <span className="w-8 text-center font-medium bg-white rounded-md px-2 py-1 border border-blue-200 text-blue-700">
                {selectedParticipants.adult}
              </span>
              <button
                onClick={() =>
                  onUpdateParticipants("adult", selectedParticipants.adult + 1)
                }
                className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">+</span>
              </button>
            </div>
          </div>

          {/* Children - using bigger touch targets */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-medium text-gray-700">Trẻ em</span>
              <p className="text-sm text-gray-600">
                {tourService.formatPrice(
                  tourService.getDiscountedPrice(
                    tour?.pricingByAge?.child || 0,
                    tour?.discount || 0
                  )
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  onUpdateParticipants("child", selectedParticipants.child - 1)
                }
                disabled={selectedParticipants.child <= 0}
                className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">-</span>
              </button>
              <span className="w-8 text-center font-medium bg-white rounded-md px-2 py-1 border border-blue-200 text-blue-700">
                {selectedParticipants.child}
              </span>
              <button
                onClick={() =>
                  onUpdateParticipants("child", selectedParticipants.child + 1)
                }
                className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">+</span>
              </button>
            </div>
          </div>

          {/* Infants */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">Em bé</span>
              <p className="text-sm text-gray-600">
                {tourService.formatPrice(
                  tourService.getDiscountedPrice(
                    tour?.pricingByAge?.infant || 0,
                    tour?.discount || 0
                  )
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  onUpdateParticipants(
                    "infant",
                    selectedParticipants.infant - 1
                  )
                }
                disabled={selectedParticipants.infant <= 0}
                className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">-</span>
              </button>
              <span className="w-8 text-center font-medium bg-white rounded-md px-2 py-1 border border-blue-200 text-blue-700">
                {selectedParticipants.infant}
              </span>
              <button
                onClick={() =>
                  onUpdateParticipants(
                    "infant",
                    selectedParticipants.infant + 1
                  )
                }
                className="w-10 h-10 rounded-full bg-white border border-blue-300 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">+</span>
              </button>
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">Tổng cộng:</span>
            <span className="text-xl md:text-2xl font-bold text-green-600">
              {tourService.formatPrice(calculateTotalPrice())}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {selectedParticipants.adult +
              selectedParticipants.child +
              selectedParticipants.infant}{" "}
            khách
          </p>
        </div>

        {/* Booking Button - Larger on mobile for easy tapping */}
        <button
          onClick={onBookTour}
          disabled={(tour?.availableSeats || 0) === 0}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-4 md:py-4 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base md:text-base"
        >
          {(tour?.availableSeats || 0) === 0 ? "Hết chỗ" : "Đặt Tour Ngay"}
        </button>

        {/* Contact Info */}
        <div className="mt-6 p-4 border border-gray-200 rounded-lg">
          <h5 className="font-semibold text-gray-800 mb-2">Cần hỗ trợ?</h5>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <a href="tel:081820319" className="hover:text-blue-600">
                Hotline: 081 820 319
              </a>
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <a href="mailto:info@lutrip.com" className="hover:text-blue-600">
                Email: info@lutrip.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
