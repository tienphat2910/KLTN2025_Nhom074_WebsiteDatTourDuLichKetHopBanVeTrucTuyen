import Link from "next/link";
import { Tour } from "@/services/tourService";
import { tourService } from "@/services/tourService";
import { MapPin } from "lucide-react";

interface TourRelatedProps {
  relatedTours: Tour[];
  isLoadingRelated: boolean;
}

export default function TourRelated({
  relatedTours,
  isLoadingRelated
}: TourRelatedProps) {
  return (
    <div className="container mx-auto px-4 pb-12">
      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
        Tour liên quan
      </h3>
      {isLoadingRelated ? (
        <div className="py-6 text-gray-500">Đang tải tour liên quan...</div>
      ) : relatedTours.length === 0 ? (
        <div className="text-gray-500">Chưa có tour liên quan.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedTours.map((t) => (
            <Link
              key={t._id}
              href={`/tours/detail/${t.slug}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
            >
              <div className="h-40 relative">
                <div
                  className="w-full h-full bg-gray-200 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${
                      (t.images && t.images[0]) || "/images/banner-tour.jpg"
                    }')`
                  }}
                />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-gray-800 line-clamp-2 mb-1">
                  {t.title}
                </h4>
                <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {t.departureLocation?.name || "Khởi hành"}
                </div>
                <div className="font-bold text-emerald-600">
                  {tourService.formatPrice(
                    tourService.getDiscountedPrice(t.price, t.discount)
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
