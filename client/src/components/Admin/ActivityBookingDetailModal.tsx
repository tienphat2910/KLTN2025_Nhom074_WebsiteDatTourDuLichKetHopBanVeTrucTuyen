"use client";

import { useState, useEffect } from "react";
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
  Activity,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Receipt,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  X,
  Camera,
  Star,
  ChevronRight
} from "lucide-react";
import {
  Booking,
  bookingService,
  ActivityBookingDetail
} from "@/services/bookingService";

interface ActivityBookingDetailModalProps {
  booking: Booking;
  userId?: any;
  trigger?: React.ReactNode;
}

const statusConfig = {
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
    description: "Hoạt động đã hoàn thành"
  }
};

const paymentMethodConfig: Record<
  string,
  { label: string; color: string; logo?: string; icon?: string }
> = {
  momo: {
    label: "Ví MoMo",
    logo: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png",
    color: "text-pink-600"
  },
  zalopay: {
    label: "ZaloPay",
    logo: "https://upload.wikimedia.org/wikipedia/vi/7/77/ZaloPay_Logo.png",
    color: "text-blue-500"
  },
  cash: {
    label: "Tiền mặt",
    icon: "💵",
    color: "text-green-600"
  },
  bank_transfer: {
    label: "Chuyển khoản",
    icon: "🏦",
    color: "text-blue-600"
  }
};

export function ActivityBookingDetailModal({
  booking,
  userId,
  trigger
}: ActivityBookingDetailModalProps) {
  const [open, setOpen] = useState(false);
  const [activityBooking, setActivityBooking] =
    useState<ActivityBookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const statusInfo = statusConfig[booking.status];
  const StatusIcon = statusInfo.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Fetch activity booking details when modal opens
  useEffect(() => {
    if (open && booking.bookingType === "activity") {
      fetchActivityBookingDetails();
    }
  }, [open, booking._id]);

  const fetchActivityBookingDetails = async () => {
    setIsLoading(true);
    try {
      const response = await bookingService.getActivityBookingDetails(
        booking._id
      );

      if (response.success && response.data) {
        console.log("✅ Activity booking data:", response.data);
        console.log("📱 QR Code URL:", response.data.qrCode);
        setActivityBooking(response.data);
      } else {
        console.error(
          "Failed to fetch activity booking details:",
          response.message
        );
        setActivityBooking(null);
      }
    } catch (error) {
      console.error("Error fetching activity booking details:", error);
      setActivityBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (booking.bookingType !== "activity") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700"
          >
            Chi tiết hoạt động
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-green-50">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            Chi tiết hoạt động
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            Mã booking: {booking._id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2">Đang tải thông tin...</span>
          </div>
        ) : activityBooking ? (
          <div className="space-y-6">
            {/* Activity Information Card */}
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {activityBooking.activityId.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {activityBooking.activityId.destination?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-300"
                  >
                    Hoạt động
                  </Badge>
                </div>

                {/* Activity Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Thông tin hoạt động
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {typeof activityBooking.activityId.location ===
                          "object"
                            ? activityBooking.activityId.location?.name ||
                              activityBooking.activityId.location?.address ||
                              "N/A"
                            : activityBooking.activityId.location || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {typeof activityBooking.activityId.operating_hours ===
                          "object"
                            ? activityBooking.activityId.operating_hours
                                ?.mon_to_sat ||
                              activityBooking.activityId.operating_hours
                                ?.sunday_holidays ||
                              "N/A"
                            : activityBooking.activityId.operating_hours ||
                              "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          Ngày tham gia:{" "}
                          {formatDate(activityBooking.scheduledDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Mô tả</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {activityBooking.activityId.description}
                    </p>
                  </div>
                </div>

                {/* Features */}
                {activityBooking.activityId.features &&
                  activityBooking.activityId.features.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Tính năng nổi bật
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {activityBooking.activityId.features.map(
                          (feature, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {feature}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Gallery */}
                {activityBooking.activityId.gallery &&
                  activityBooking.activityId.gallery.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Hình ảnh
                      </h4>
                      <div className="flex gap-2 overflow-x-auto">
                        {activityBooking.activityId.gallery
                          .slice(0, 4)
                          .map((image, index) => (
                            <div
                              key={index}
                              className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                            >
                              <img
                                src={image}
                                alt={`Activity image ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML =
                                      '<div class="w-full h-full flex items-center justify-center"><svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                                  }
                                }}
                              />
                            </div>
                          ))}
                        {activityBooking.activityId.gallery.length > 4 && (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-gray-500">
                              +{activityBooking.activityId.gallery.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Participants & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Số lượng người tham gia & Giá cả
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Số lượng người tham gia
                    </h4>
                    <div className="space-y-2">
                      {activityBooking.numAdults > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Người lớn:</span>
                          <span className="font-semibold">
                            {activityBooking.numAdults}
                          </span>
                        </div>
                      )}
                      {activityBooking.numChildren > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Trẻ em:</span>
                          <span className="font-semibold">
                            {activityBooking.numChildren}
                          </span>
                        </div>
                      )}
                      {activityBooking.numBabies > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Em bé:</span>
                          <span className="font-semibold">
                            {activityBooking.numBabies}
                          </span>
                        </div>
                      )}
                      {activityBooking.numSeniors > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Người cao tuổi:</span>
                          <span className="font-semibold">
                            {activityBooking.numSeniors}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center font-semibold text-gray-900 pt-2 border-t">
                        <span>Tổng số:</span>
                        <span>
                          {activityBooking.numAdults +
                            activityBooking.numChildren +
                            activityBooking.numBabies +
                            activityBooking.numSeniors}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Giá cơ bản:</span>
                      <span className="font-semibold">
                        {formatCurrency(activityBooking.price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Thành tiền:</span>
                      <span className="font-semibold">
                        {formatCurrency(activityBooking.subtotal)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Tổng tiền:</span>
                      <span className="text-green-600">
                        {formatCurrency(activityBooking.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {paymentMethodConfig[activityBooking.paymentMethod]
                        ?.logo ? (
                        <img
                          src={
                            paymentMethodConfig[activityBooking.paymentMethod]
                              .logo
                          }
                          alt={
                            paymentMethodConfig[activityBooking.paymentMethod]
                              .label
                          }
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <span className="text-2xl">
                          {paymentMethodConfig[activityBooking.paymentMethod]
                            ?.icon || "💳"}
                        </span>
                      )}
                      <div>
                        <p className="font-medium">
                          {paymentMethodConfig[activityBooking.paymentMethod]
                            ?.label || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Phương thức thanh toán
                        </p>
                      </div>
                    </div>
                    {activityBooking.note && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600">Ghi chú</p>
                        <p className="text-sm">{activityBooking.note}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Trạng thái & Lịch sử
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Badge
                        className={`${statusInfo.color} w-full justify-center py-2`}
                      >
                        <StatusIcon className="h-4 w-4 mr-2" />
                        {statusInfo.label}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-2">
                        {statusInfo.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ngày đặt:</span>
                        <span>{formatDate(activityBooking.createdAt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cập nhật:</span>
                        <span>{formatDate(activityBooking.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* QR Code Section */}
            {activityBooking.qrCode && (
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Camera className="h-5 w-5" />
                    Mã QR Check-in
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <img
                        src={activityBooking.qrCode}
                        alt="QR Code"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">
                        Vui lòng xuất trình mã QR này khi check-in
                      </p>
                      <p className="text-xs text-gray-500">
                        Mã booking:{" "}
                        <span className="font-semibold text-green-700">
                          {booking._id.slice(-8).toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            {(booking.user || booking.userId || userId) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Thông tin liên hệ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Tên khách hàng</p>
                        <p className="font-medium">
                          {(typeof userId === "object" && userId?.fullName) ||
                            booking.user?.fullName ||
                            (typeof booking.userId === "object" &&
                              booking.userId?.fullName) ||
                            "N/A"}
                        </p>
                      </div>
                    </div>

                    {((typeof userId === "object" && userId?.email) ||
                      booking.user?.email ||
                      (typeof booking.userId === "object" &&
                        booking.userId?.email)) && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">
                            {(typeof userId === "object" && userId?.email) ||
                              booking.user?.email ||
                              (typeof booking.userId === "object" &&
                                booking.userId?.email)}
                          </p>
                        </div>
                      </div>
                    )}

                    {((typeof userId === "object" && userId?.phone) ||
                      booking.user?.phone ||
                      (typeof booking.userId === "object" &&
                        booking.userId?.phone)) && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Số điện thoại</p>
                          <p className="font-medium">
                            {(typeof userId === "object" && userId?.phone) ||
                              booking.user?.phone ||
                              (typeof booking.userId === "object" &&
                                booking.userId?.phone)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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
                  Hủy đặt chỗ
                </Button>
              )}

              {booking.status === "confirmed" && (
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => {
                    // Handle contact support or download ticket
                    setOpen(false);
                  }}
                >
                  Xác nhận tham gia
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không thể tải thông tin hoạt động
            </h3>
            <p className="text-gray-600">
              Vui lòng thử lại sau hoặc liên hệ hỗ trợ.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
