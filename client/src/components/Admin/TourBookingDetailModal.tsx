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
  MapPin,
  Calendar,
  Clock,
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
  ChevronRight
} from "lucide-react";
import { Booking } from "@/services/bookingService";
import { tourService, TourBookingDetail } from "@/services/tourService";

interface TourBookingDetailModalProps {
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
    description: "Tour đã hoàn thành"
  }
};

const paymentMethodConfig: Record<
  string,
  { label: string; color: string; logo?: string; icon?: string }
> = {
  cash: {
    label: "Tiền mặt",
    icon: "💵",
    color: "text-green-600"
  },
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
  bank_transfer: {
    label: "Chuyển khoản",
    icon: "🏦",
    color: "text-blue-600"
  }
};

const passengerTypeConfig = {
  adult: {
    label: "Người lớn",
    color: "bg-blue-100 text-blue-800"
  },
  child: {
    label: "Trẻ em",
    color: "bg-green-100 text-green-800"
  },
  infant: {
    label: "Em bé",
    color: "bg-purple-100 text-purple-800"
  }
};

export function TourBookingDetailModal({
  booking,
  userId,
  trigger
}: TourBookingDetailModalProps) {
  const [open, setOpen] = useState(false);
  const [tourBooking, setTourBooking] = useState<TourBookingDetail | null>(
    null
  );
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

  // Fetch tour booking details when modal opens
  useEffect(() => {
    if (open && booking.bookingType === "tour") {
      fetchTourBookingDetails();
    }
  }, [open, booking._id]);

  const fetchTourBookingDetails = async () => {
    setIsLoading(true);
    try {
      const response = await tourService.getTourBookingDetails(booking._id);

      if (response.success && response.data) {
        setTourBooking(response.data);
      } else {
        console.error(
          "Failed to fetch tour booking details:",
          response.message
        );
        setTourBooking(null);
      }
    } catch (error) {
      console.error("Error fetching tour booking details:", error);
      setTourBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (booking.bookingType !== "tour") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            Chi tiết tour
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-green-50">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            Chi tiết tour
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
        ) : tourBooking ? (
          <div className="space-y-6">
            {/* Tour Info Card */}
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <MapPin className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {tourBooking.tourId.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {tourBooking.tourId.destination?.name || "Địa điểm"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-300"
                  >
                    {tourBooking.tourId.duration}
                  </Badge>
                </div>

                {/* Tour Route */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1">
                    <div className="text-sm text-gray-600 mb-1">Khởi hành</div>
                    <div className="text-lg font-bold text-gray-900">
                      {tourBooking.tourId.departureLocation.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tourBooking.tourId.departureLocation.region}
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="flex items-center">
                      <div className="flex-1 border-t border-gray-300 relative">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <MapPin className="h-4 w-4 text-green-600 bg-white p-1 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center mx-4">
                      <div className="text-sm font-medium text-gray-900">
                        {tourBooking.tourId.duration}
                      </div>
                      <div className="text-xs text-gray-500">Tour</div>
                    </div>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  <div className="text-center flex-1">
                    <div className="text-sm text-gray-600 mb-1">Đến</div>
                    <div className="text-lg font-bold text-gray-900">
                      {tourBooking.tourId.destination?.name || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tourBooking.tourId.destination?.region || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Tour Dates */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-sm text-gray-600">Ngày khởi hành</div>
                    <div className="font-semibold">
                      {formatDate(tourBooking.tourId.startDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Ngày kết thúc</div>
                    <div className="font-semibold">
                      {formatDate(tourBooking.tourId.endDate)}
                    </div>
                  </div>
                </div>

                {/* Tour Images */}
                {tourBooking.tourId.images &&
                  tourBooking.tourId.images.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Hình ảnh tour
                        </span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto">
                        {tourBooking.tourId.images
                          .slice(0, 3)
                          .map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Tour image ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Booking Details & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Chi tiết đặt chỗ & Giá
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Người lớn:</span>
                      <span className="font-semibold">
                        {tourBooking.numAdults} x{" "}
                        {formatCurrency(tourBooking.priceByAge.adult)}
                      </span>
                    </div>
                    {tourBooking.numChildren > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Trẻ em:</span>
                        <span className="font-semibold">
                          {tourBooking.numChildren} x{" "}
                          {formatCurrency(tourBooking.priceByAge.child)}
                        </span>
                      </div>
                    )}
                    {tourBooking.numInfants > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Em bé:</span>
                        <span className="font-semibold">
                          {tourBooking.numInfants} x{" "}
                          {formatCurrency(tourBooking.priceByAge.infant)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Tổng tiền:</span>
                      <span className="text-green-600">
                        {formatCurrency(tourBooking.subtotal)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tổng hành khách:</span>
                      <span className="font-semibold">
                        {tourBooking.numAdults +
                          tourBooking.numChildren +
                          tourBooking.numInfants}{" "}
                        người
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Trạng thái:</span>
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    {tourBooking.note && (
                      <div>
                        <span className="text-gray-600">Ghi chú:</span>
                        <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                          {tourBooking.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passengers */}
            {tourBooking.passengers && tourBooking.passengers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Thông tin hành khách
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tourBooking.passengers.map((passenger, index) => (
                      <div
                        key={passenger._id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            Hành khách {index + 1}
                          </h4>
                          <Badge
                            className={
                              passengerTypeConfig[passenger.type].color
                            }
                          >
                            {passengerTypeConfig[passenger.type].label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Họ tên</p>
                            <p className="font-medium">{passenger.fullName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Ngày sinh</p>
                            <p className="font-medium">
                              {new Date(
                                passenger.dateOfBirth
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Giới tính</p>
                            <p className="font-medium">{passenger.gender}</p>
                          </div>
                          {passenger.cccd && (
                            <div>
                              <p className="text-sm text-gray-600">CCCD</p>
                              <p className="font-medium font-mono">
                                {passenger.cccd}
                              </p>
                            </div>
                          )}
                          {passenger.phone && (
                            <div>
                              <p className="text-sm text-gray-600">
                                Số điện thoại
                              </p>
                              <p className="font-medium">{passenger.phone}</p>
                            </div>
                          )}
                          {passenger.email && (
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium">{passenger.email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                      {paymentMethodConfig[tourBooking.paymentMethod]?.logo ? (
                        <img
                          src={
                            paymentMethodConfig[tourBooking.paymentMethod]?.logo
                          }
                          alt={
                            paymentMethodConfig[tourBooking.paymentMethod]
                              ?.label
                          }
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <span className="text-2xl">
                          {paymentMethodConfig[tourBooking.paymentMethod]
                            ?.icon || "💳"}
                        </span>
                      )}
                      <div>
                        <p className="font-medium">
                          {paymentMethodConfig[tourBooking.paymentMethod]
                            ?.label || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Phương thức thanh toán
                        </p>
                      </div>
                    </div>
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
                        <span>{formatDate(tourBooking.createdAt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cập nhật:</span>
                        <span>{formatDate(tourBooking.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                  Tải voucher
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không thể tải thông tin tour
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
