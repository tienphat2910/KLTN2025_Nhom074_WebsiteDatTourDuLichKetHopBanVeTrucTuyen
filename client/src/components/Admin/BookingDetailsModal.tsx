"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CreditCard,
  Clock,
  Plane,
  Briefcase
} from "lucide-react";
import { CancellationRequest } from "@/services/cancellationRequestService";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: CancellationRequest | null;
}

export function BookingDetailsModal({
  isOpen,
  onClose,
  request
}: BookingDetailsModalProps) {
  if (!request) return null;

  const booking =
    typeof request.bookingId === "object" ? request.bookingId : null;
  const user = typeof request.userId === "object" ? request.userId : null;

  if (!booking) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800"
  };

  const paymentStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    refunded: "bg-purple-100 text-purple-800"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Chi tiết booking</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về booking #{booking._id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Payment Info */}
          <div className="flex flex-wrap gap-4">
            <Badge className={statusColors[booking.status] || "bg-gray-100"}>
              Trạng thái: {booking.status}
            </Badge>
            <Badge
              className={
                paymentStatusColors[booking.paymentStatus] || "bg-gray-100"
              }
            >
              Thanh toán: {booking.paymentStatus}
            </Badge>
          </div>

          <Separator />

          {/* Customer Info */}
          {user && (
            <>
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Thông tin khách hàng
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p>
                    <span className="font-medium">Họ tên:</span> {user.fullName}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  {user.phoneNumber && (
                    <p>
                      <span className="font-medium">Số điện thoại:</span>{" "}
                      {user.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Tour/Activity/Flight Specific Details */}
          {request.bookingType === "tour" &&
            typeof booking.tourId === "object" && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Thông tin tour
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <span className="font-medium">Tên tour:</span>{" "}
                      {booking.tourId.name}
                    </p>
                    <p>
                      <span className="font-medium">Thời gian:</span>{" "}
                      {booking.tourId.duration}
                    </p>
                    {booking.tourId.destination && (
                      <p>
                        <span className="font-medium">Điểm đến:</span>{" "}
                        {typeof booking.tourId.destination === "object"
                          ? booking.tourId.destination.name
                          : "N/A"}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Ngày bắt đầu:</span>{" "}
                      {formatDate(booking.startDate)}
                    </p>
                    <p>
                      <span className="font-medium">Số người:</span>{" "}
                      {booking.numberOfPeople} người
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

          {request.bookingType === "activity" &&
            typeof booking.activityId === "object" && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Thông tin hoạt động
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <span className="font-medium">Tên hoạt động:</span>{" "}
                      {booking.activityId.name}
                    </p>
                    <p>
                      <span className="font-medium">Thời gian:</span>{" "}
                      {booking.activityId.duration}
                    </p>
                    {booking.activityId.destination && (
                      <p>
                        <span className="font-medium">Địa điểm:</span>{" "}
                        {typeof booking.activityId.destination === "object"
                          ? booking.activityId.destination.name
                          : "N/A"}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Ngày bắt đầu:</span>{" "}
                      {formatDate(booking.startDate)}
                    </p>
                    <p>
                      <span className="font-medium">Số người:</span>{" "}
                      {booking.numberOfPeople} người
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

          {request.bookingType === "flight" &&
            typeof booking.flightId === "object" && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    Thông tin chuyến bay
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <span className="font-medium">Số hiệu:</span>{" "}
                      {booking.flightId.flightNumber}
                    </p>
                    {typeof booking.flightId.departureAirport === "object" && (
                      <p>
                        <span className="font-medium">Điểm đi:</span>{" "}
                        {booking.flightId.departureAirport.city} (
                        {booking.flightId.departureAirport.iata})
                      </p>
                    )}
                    {typeof booking.flightId.arrivalAirport === "object" && (
                      <p>
                        <span className="font-medium">Điểm đến:</span>{" "}
                        {booking.flightId.arrivalAirport.city} (
                        {booking.flightId.arrivalAirport.iata})
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Ngày khởi hành:</span>{" "}
                      {formatDateTime(booking.flightId.departureTime)}
                    </p>
                    <p>
                      <span className="font-medium">Số hành khách:</span>{" "}
                      {booking.numberOfPeople} người
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

          {/* Pricing Details */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Thông tin giá
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-semibold">
                  {formatCurrency(booking.totalPrice)}
                </span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá:</span>
                  <span>-{formatCurrency(booking.discountAmount)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Phương thức thanh toán
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="capitalize">{booking.paymentMethod}</p>
            </div>
          </div>

          <Separator />

          {/* Booking Dates */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Thời gian booking
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p>
                <span className="font-medium">Ngày đặt:</span>{" "}
                {formatDateTime(booking.createdAt)}
              </p>
              {booking.updatedAt !== booking.createdAt && (
                <p>
                  <span className="font-medium">Cập nhật lần cuối:</span>{" "}
                  {formatDateTime(booking.updatedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
