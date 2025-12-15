
import React, { useState } from "react";
import { Tour } from "@/services/tourService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Star,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ViewTourDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tour: Tour | null;
}

// Component riêng cho từng ngày lịch trình
function ItineraryDay({ item, index }: { item: { day?: number; title: string; description: string }, index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-l-2 border-primary pl-4">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 font-medium text-sm hover:text-primary transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <span>
          Ngày {item.day ?? index + 1}: {item.title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-blue-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-600 flex-shrink-0" />
        )}
      </button>
      {open && (
        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
          {item.description}
        </p>
      )}
    </div>
  );
}

export function ViewTourDetailModal({
  open,
  onOpenChange,
  tour
}: ViewTourDetailModalProps) {

  if (!tour) return null;

  // Convert itinerary object to array if needed
  const getItineraryArray = () => {
    if (!tour.itinerary) return [];
    
    // If it's already an array
    if (Array.isArray(tour.itinerary)) {
      return tour.itinerary;
    }
    
    // If it's an object like {day1: {...}, day2: {...}}
    if (typeof tour.itinerary === 'object') {
      return Object.entries(tour.itinerary)
        .map(([key, value]: [string, any]) => ({
          day: parseInt(key.replace('day', '')) || 0,
          title: value.title || '',
          description: value.description || ''
        }))
        .sort((a, b) => a.day - b.day);
    }
    
    return [];
  };

  const itineraryArray = getItineraryArray();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = diffDays + 1;
    const nights = diffDays;
    return `${totalDays} Ngày ${nights} Đêm`;
  };

  const getTourStatus = () => {
    const now = new Date();
    const startDate = new Date(tour.startDate);
    const endDate = new Date(tour.endDate);

    if (tour.isActive === false) return "Đã ẩn";
    if (tour.availableSeats === 0) return "Hết chỗ";
    if (now > endDate) return "Đã kết thúc";
    if (now >= startDate && now <= endDate) return "Đang diễn ra";
    if (now < startDate) return "Sắp diễn ra";
    return "Đang hoạt động";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{tour.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap mt-2">
            <Badge variant={tour.isActive !== false ? "default" : "secondary"}>
              {getTourStatus()}
            </Badge>
            {tour.isFeatured && (
              <Badge variant="secondary">
                <Star className="w-3 h-3 mr-1" />
                Nổi bật
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Mã tour: {tour.slug}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thư viện ảnh */}
          {tour.images && tour.images.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <h3 className="font-semibold">Thư viện ảnh</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {tour.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Địa điểm</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Điểm đến:</span>{" "}
                    {typeof tour.destinationId === "object" && tour.destinationId !== null && "name" in tour.destinationId
                      ? (tour.destinationId as { name: string }).name
                      : "N/A"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Khởi hành:</span>{" "}
                    {tour.departureLocation?.name || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Thời gian</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Bắt đầu:</span>{" "}
                    {formatDate(tour.startDate)}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Kết thúc:</span>{" "}
                    {formatDate(tour.endDate)}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {tour.duration ||
                      getDuration(tour.startDate, tour.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Giá tour</span>
                </div>
                <div className="pl-6">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(tour.price)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Giá cho mỗi người
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Chỗ ngồi</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Tổng:</span>{" "}
                    {tour.seats} chỗ
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Còn trống:</span>{" "}
                    <span
                      className={
                        tour.availableSeats === 0
                          ? "text-red-600 font-semibold"
                          : "text-green-600 font-semibold"
                      }
                    >
                      {tour.availableSeats} chỗ
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Đã đặt:</span>{" "}
                    {tour.seats - tour.availableSeats} chỗ
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Mô tả tour */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Mô tả tour</h3>
            </div>
            <div className="pl-6">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {tour.description || "Chưa có mô tả"}
              </p>
            </div>
          </div>

          {/* Lịch trình */}
          {itineraryArray.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Lịch trình tour</h3>
                </div>
                <div className="pl-6 space-y-3">
                  {itineraryArray.map((item, index) => (
                    <ItineraryDay key={index} item={item} index={index} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Dịch vụ bao gồm, không bao gồm, thư viện ảnh: Không có trong kiểu dữ liệu Tour chuẩn, nếu cần hãy bổ sung vào schema và type. */}

          {/* Thông tin bổ sung */}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Ngày tạo:</span>{" "}
              <span className="font-medium">
                {tour.createdAt ? formatDate(tour.createdAt) : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Cập nhật lần cuối:</span>{" "}
              <span className="font-medium">
                {tour.updatedAt ? formatDate(tour.updatedAt) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
