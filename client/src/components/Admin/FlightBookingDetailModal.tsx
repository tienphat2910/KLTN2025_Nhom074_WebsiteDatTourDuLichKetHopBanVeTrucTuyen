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
  Plane,
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
  ArrowRight,
  Luggage,
  Wifi,
  Coffee,
  Monitor,
  ChevronRight
} from "lucide-react";
import {
  Booking,
  bookingService,
  FlightBookingDetail
} from "@/services/bookingService";

interface FlightBookingDetailModalProps {
  booking: Booking;
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
    description: "Chuyến bay đã hoàn thành"
  }
};

const paymentMethodConfig = {
  momo: {
    label: "Ví MoMo",
    icon: "💳",
    color: "text-pink-600"
  },
  bank_transfer: {
    label: "Chuyển khoản",
    icon: "🏦",
    color: "text-blue-600"
  }
};

export function FlightBookingDetailModal({
  booking,
  trigger
}: FlightBookingDetailModalProps) {
  const [open, setOpen] = useState(false);
  const [flightBooking, setFlightBooking] =
    useState<FlightBookingDetail | null>(null);
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

  const formatDuration = (duration: string) => {
    // Convert duration format like "2h 30m" to readable format
    return duration.replace(/(\d+)h\s*(\d+)m/, "$1 giờ $2 phút");
  };

  // Fetch flight booking details when modal opens
  useEffect(() => {
    if (open && booking.bookingType === "flight") {
      fetchFlightBookingDetails();
    }
  }, [open, booking._id]);

  const fetchFlightBookingDetails = async () => {
    setIsLoading(true);
    try {
      const response = await bookingService.getFlightBookingDetails(
        booking._id
      );

      if (response.success && response.data) {
        setFlightBooking(response.data);
      } else {
        console.error(
          "Failed to fetch flight booking details:",
          response.message
        );
        setFlightBooking(null);
      }
    } catch (error) {
      console.error("Error fetching flight booking details:", error);
      setFlightBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for development/testing
  const getMockFlightBooking = (): FlightBookingDetail => ({
    _id: "flight_booking_123",
    bookingId: booking._id,
    flightId: {
      _id: "flight_123",
      flightCode: "VN123",
      airline: {
        _id: "airline_123",
        name: "Vietnam Airlines",
        code: "VN",
        logo: "/images/airlines/vietnam-airlines.png"
      },
      departureAirport: {
        _id: "airport_sgn",
        name: "Tân Sơn Nhất",
        code: "SGN",
        city: "Hồ Chí Minh",
        country: "Việt Nam"
      },
      arrivalAirport: {
        _id: "airport_han",
        name: "Nội Bài",
        code: "HAN",
        city: "Hà Nội",
        country: "Việt Nam"
      },
      departureTime: "2024-12-25T10:00:00Z",
      arrivalTime: "2024-12-25T12:30:00Z",
      duration: "2h 30m",
      aircraft: "Airbus A321"
    },
    flightClassId: {
      _id: "class_eco",
      name: "Phổ thông",
      code: "ECO",
      description: "Hạng phổ thông với tiện nghi cơ bản",
      amenities: ["Bữa ăn nhẹ", "Nước uống", "WiFi"]
    },
    numTickets: 2,
    pricePerTicket: 1500000,
    totalFlightPrice: 3000000,
    status: booking.status,
    paymentMethod: "momo",
    discountAmount: 0,
    passengers: [
      {
        _id: "pass_1",
        fullName: "Nguyễn Văn A",
        dateOfBirth: "1990-01-01",
        gender: "male",
        passportNumber: "P123456789",
        seatNumber: "12A"
      },
      {
        _id: "pass_2",
        fullName: "Trần Thị B",
        dateOfBirth: "1992-05-15",
        gender: "female",
        passportNumber: "P987654321",
        seatNumber: "12B"
      }
    ],
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  });

  if (booking.bookingType !== "flight") {
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
            Chi tiết chuyến bay
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-blue-50">
              <Plane className="h-5 w-5 text-blue-600" />
            </div>
            Chi tiết chuyến bay
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            Mã booking: {booking._id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Đang tải thông tin...</span>
          </div>
        ) : flightBooking ? (
          <div className="space-y-6">
            {/* Flight Route Card */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Plane className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {flightBooking.flightId.flightCode}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {flightBooking.flightId.airline?.name ||
                          "Hãng hàng không"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-300"
                  >
                    {flightBooking.flightClassId?.name || "N/A"}
                  </Badge>
                </div>

                {/* Route */}
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatTime(flightBooking.flightId.departureTime)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {flightBooking.flightId.departureAirport?.code || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {flightBooking.flightId.departureAirport?.city || "N/A"}
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="flex items-center">
                      <div className="flex-1 border-t border-gray-300 relative">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <Plane className="h-4 w-4 text-blue-600 bg-white p-1 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center mx-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDuration(flightBooking.flightId.duration)}
                      </div>
                      <div className="text-xs text-gray-500">Bay thẳng</div>
                    </div>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatTime(flightBooking.flightId.arrivalTime)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {flightBooking.flightId.arrivalAirport?.code || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {flightBooking.flightId.arrivalAirport?.city || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <strong>Ngày bay:</strong>{" "}
                    {formatDate(flightBooking.flightId.departureTime)}
                  </div>
                  {flightBooking.flightId.aircraft && (
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>Máy bay:</strong>{" "}
                      {flightBooking.flightId.aircraft}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Flight Class & Amenities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Luggage className="h-5 w-5" />
                  Hạng vé & Tiện nghi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {flightBooking.flightClassId?.name || "N/A"}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {flightBooking.flightClassId?.description ||
                        "Không có mô tả"}
                    </p>
                    <div className="space-y-2">
                      {flightBooking.flightClassId?.amenities?.map(
                        (amenity, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {amenity}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Số lượng vé:</span>
                      <span className="font-semibold">
                        {flightBooking.numTickets}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Giá mỗi vé:</span>
                      <span className="font-semibold">
                        {formatCurrency(flightBooking.pricePerTicket)}
                      </span>
                    </div>
                    {flightBooking.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Giảm giá:</span>
                        <span>
                          -{formatCurrency(flightBooking.discountAmount)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Tổng tiền:</span>
                      <span className="text-blue-600">
                        {formatCurrency(flightBooking.totalFlightPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passengers */}
            {flightBooking.passengers &&
              flightBooking.passengers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Thông tin hành khách
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {flightBooking.passengers.map((passenger, index) => (
                        <div
                          key={passenger._id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              Hành khách {index + 1}
                            </h4>
                            {passenger.seatNumber && (
                              <Badge variant="outline">
                                Ghế {passenger.seatNumber}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Họ tên</p>
                              <p className="font-medium">
                                {passenger.fullName}
                              </p>
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
                              <p className="font-medium">
                                {passenger.gender === "male" ||
                                passenger.gender === "Male"
                                  ? "Nam"
                                  : passenger.gender === "female" ||
                                    passenger.gender === "Female"
                                  ? "Nữ"
                                  : passenger.gender === "Nam"
                                  ? "Nam"
                                  : passenger.gender === "Nữ"
                                  ? "Nữ"
                                  : "Khác"}
                              </p>
                            </div>
                            {passenger.passportNumber && (
                              <div>
                                <p className="text-sm text-gray-600">
                                  Số hộ chiếu
                                </p>
                                <p className="font-medium font-mono">
                                  {passenger.passportNumber}
                                </p>
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
                      <span className="text-2xl">
                        {paymentMethodConfig[flightBooking.paymentMethod]
                          ?.icon || "💳"}
                      </span>
                      <div>
                        <p className="font-medium">
                          {paymentMethodConfig[flightBooking.paymentMethod]
                            ?.label || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Phương thức thanh toán
                        </p>
                      </div>
                    </div>
                    {flightBooking.discountCode && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600">Mã giảm giá</p>
                        <p className="font-medium font-mono">
                          {flightBooking.discountCode}
                        </p>
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
                        <span>{formatDate(flightBooking.createdAt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cập nhật:</span>
                        <span>{formatDate(flightBooking.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Information */}
            {(booking.user || booking.userId) && (
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
                        <Mail className="h-4 w-4 text-gray-400" />
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
                        <Phone className="h-4 w-4 text-gray-400" />
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
                  Tải vé điện tử
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không thể tải thông tin chuyến bay
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
