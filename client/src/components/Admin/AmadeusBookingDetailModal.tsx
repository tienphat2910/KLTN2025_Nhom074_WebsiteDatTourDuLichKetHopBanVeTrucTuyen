"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plane,
  Calendar,
  Clock,
  Users,
  CreditCard,
  Receipt,
  User,
  Phone,
  Mail,
  CheckCircle,
  X,
  ArrowRight,
  Eye
} from "lucide-react";
import { Booking } from "@/services/bookingService";

interface AmadeusBookingDetailModalProps {
  booking: Booking;
  trigger?: React.ReactNode;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any; description: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    description: "Đang xử lý đặt chỗ"
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
    description: "Đặt chỗ đã được xác nhận"
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: X,
    description: "Đặt chỗ đã bị hủy"
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    description: "Chuyến bay đã hoàn thành"
  }
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Đã thanh toán", color: "bg-green-100 text-green-800" },
  refunded: { label: "Đã hoàn tiền", color: "bg-purple-100 text-purple-800" },
  failed: { label: "Thất bại", color: "bg-red-100 text-red-800" }
};

export function AmadeusBookingDetailModal({
  booking,
  trigger
}: AmadeusBookingDetailModalProps) {
  const [open, setOpen] = useState(false);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const currentStatus = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;

  // Get flight info from booking
  const outboundFlight = booking.outboundFlight as any;
  const returnFlight = booking.returnFlight as any;
  const passengers = booking.passengers as any[];

  const renderFlightSegment = (flight: any, title: string) => {
    if (!flight) return null;

    const itinerary = flight.itineraries?.[0];
    const segments = itinerary?.segments || [];
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];

    if (!firstSegment) return null;

    const departure = formatDateTime(firstSegment.departure?.at);
    const arrival = formatDateTime(lastSegment.arrival?.at);

    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-sky-600 to-blue-600 text-white py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plane className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Departure */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {firstSegment.departure?.iataCode}
              </div>
              <div className="text-lg font-semibold text-sky-600">
                {departure.time}
              </div>
              <div className="text-sm text-gray-500">{departure.date}</div>
            </div>

            {/* Flight Path */}
            <div className="flex-1 mx-4">
              <div className="flex items-center justify-center">
                <div className="h-px bg-gray-300 flex-1" />
                <div className="mx-2 p-2 bg-sky-50 rounded-full">
                  <Plane className="h-4 w-4 text-sky-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <div className="h-px bg-gray-300 flex-1" />
              </div>
              <div className="text-center text-xs text-gray-500 mt-1">
                {segments.length > 1
                  ? `${segments.length - 1} điểm dừng`
                  : "Bay thẳng"}
              </div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {lastSegment.arrival?.iataCode}
              </div>
              <div className="text-lg font-semibold text-sky-600">
                {arrival.time}
              </div>
              <div className="text-sm text-gray-500">{arrival.date}</div>
            </div>
          </div>

          {/* Flight details */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Mã chuyến bay:</span>
                <span className="ml-2 font-medium">
                  {firstSegment.carrierCode}
                  {firstSegment.number}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Hạng:</span>
                <span className="ml-2 font-medium">
                  {flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]
                    ?.cabin || "Economy"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Chi tiết
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <Plane className="h-6 w-6 text-sky-600" />
                </div>
                Đặt vé máy bay
              </DialogTitle>
              <DialogDescription className="mt-2 flex items-center gap-4">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  #{booking._id.slice(-8).toUpperCase()}
                </span>
                {booking.bookingReference && (
                  <span className="font-mono text-sm bg-sky-100 text-sky-700 px-2 py-1 rounded">
                    Ref: {booking.bookingReference}
                  </span>
                )}
                <Badge className={`${currentStatus.color} border`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {currentStatus.label}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Họ tên</p>
                  <p className="font-medium">
                    {booking.user?.fullName || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{booking.user?.email || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Phone className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Điện thoại</p>
                  <p className="font-medium">{booking.user?.phone || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flight Info */}
          <div className="space-y-4">
            {renderFlightSegment(outboundFlight, "Chuyến đi")}
            {booking.isRoundTrip &&
              renderFlightSegment(returnFlight, "Chuyến về")}
          </div>

          {/* Passengers */}
          {passengers && passengers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  Danh sách hành khách ({passengers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {passengers.map((passenger: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">
                            {passenger.firstName} {passenger.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {passenger.travelerType === "ADULT"
                              ? "Người lớn"
                              : passenger.travelerType === "CHILD"
                              ? "Trẻ em"
                              : "Em bé"}{" "}
                            • {passenger.gender === "MALE" ? "Nam" : "Nữ"}
                          </p>
                        </div>
                      </div>
                      {passenger.dateOfBirth && (
                        <div className="text-sm text-gray-500">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {new Date(passenger.dateOfBirth).toLocaleDateString(
                            "vi-VN"
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Payment Summary */}
          <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-sky-600" />
                Thông tin thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái thanh toán:</span>
                <Badge
                  className={
                    paymentStatusConfig[booking.paymentStatus || "pending"]
                      ?.color
                  }
                >
                  {
                    paymentStatusConfig[booking.paymentStatus || "pending"]
                      ?.label
                  }
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-semibold">
                  {formatCurrency(booking.totalPrice)}
                </span>
              </div>
              {booking.actualTotal &&
                booking.actualTotal !== booking.totalPrice && (
                  <div className="flex justify-between text-green-600">
                    <span>Sau giảm giá:</span>
                    <span className="font-bold">
                      {formatCurrency(booking.actualTotal)}
                    </span>
                  </div>
                )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ngày đặt:</span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(booking.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
