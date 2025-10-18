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
import {
  Calendar,
  MapPin,
  Plane,
  Mountain,
  Clock,
  DollarSign,
  X,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  CreditCard,
  Receipt,
  Info
} from "lucide-react";
import { Booking } from "@/services/bookingService";

interface BookingDetailModalProps {
  booking: Booking;
  trigger?: React.ReactNode;
}

const statusConfig = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    description: "Đơn hàng đang được xử lý"
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
    description: "Đơn hàng đã được xác nhận"
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: X,
    description: "Đơn hàng đã bị hủy"
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    description: "Đơn hàng đã hoàn thành"
  }
};

const bookingTypeConfig = {
  tour: {
    label: "Tour du lịch",
    icon: Mountain,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Chuyến đi tham quan và trải nghiệm"
  },
  activity: {
    label: "Hoạt động",
    icon: MapPin,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    description: "Vé tham gia hoạt động giải trí"
  },
  flight: {
    label: "Chuyến bay",
    icon: Plane,
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Vé máy bay nội địa/quốc tế"
  }
};

export function BookingDetailModal({
  booking,
  trigger
}: BookingDetailModalProps) {
  const [open, setOpen] = useState(false);

  const typeConfig = bookingTypeConfig[booking.bookingType];
  const statusInfo = statusConfig[booking.status];
  const StatusIcon = statusInfo.icon;
  const TypeIcon = typeConfig.icon;

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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Chi tiết
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
              <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
            </div>
            Chi tiết booking
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            {typeConfig.description} - ID: {booking._id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Type & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                <span className="font-medium text-gray-900">Loại booking</span>
              </div>
              <p className="text-gray-600">{typeConfig.label}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">Trạng thái</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                <span className="text-sm text-gray-500">
                  {statusInfo.description}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          {(booking.user || booking.userId) && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin khách hàng
                </h3>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Tên khách hàng</p>
                      <p className="font-medium">
                        {booking.user?.fullName ||
                          (typeof booking.userId === "object" &&
                            booking.userId?.fullName) ||
                          "N/A"}
                      </p>
                    </div>
                  </div>

                  {(booking.user?.email ||
                    (typeof booking.userId === "object" &&
                      booking.userId?.email)) && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">
                          {booking.user?.email ||
                            (typeof booking.userId === "object" &&
                              booking.userId?.email)}
                        </p>
                      </div>
                    </div>
                  )}

                  {(booking.user?.phone ||
                    (typeof booking.userId === "object" &&
                      booking.userId?.phone)) && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Số điện thoại</p>
                        <p className="font-medium">
                          {booking.user?.phone ||
                            (typeof booking.userId === "object" &&
                              booking.userId?.phone)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Booking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Thông tin booking
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Ngày đặt</p>
                    <p className="font-medium">
                      {formatDate(booking.bookingDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Tổng tiền</p>
                    <p className="font-semibold text-green-600 text-lg">
                      {formatCurrency(booking.totalPrice)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Mã booking</p>
                    <p className="font-medium font-mono">
                      {booking._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Loại hình</p>
                    <p className="font-medium">{typeConfig.label}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lịch sử cập nhật
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Đặt booking</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(booking.createdAt)}
                  </p>
                </div>
              </div>

              {booking.createdAt !== booking.updatedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Cập nhật lần cuối
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(booking.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Đóng
            </Button>

            {booking.status === "pending" && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  // Handle cancel booking
                  setOpen(false);
                }}
              >
                Hủy booking
              </Button>
            )}

            {booking.status === "confirmed" && (
              <Button
                variant="default"
                className="flex-1"
                onClick={() => {
                  // Handle contact support or something
                  setOpen(false);
                }}
              >
                Liên hệ hỗ trợ
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
