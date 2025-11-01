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
  Camera,
  ArrowLeftRight
} from "lucide-react";
import {
  Booking,
  bookingService,
  FlightBookingDetail,
  RoundTripFlightBookingDetail
} from "@/services/bookingService";

interface RoundTripFlightBookingDetailModalProps {
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
    description: "Chuyến bay đã hoàn thành"
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
  bank_transfer: {
    label: "Chuyển khoản",
    icon: "🏦",
    color: "text-blue-600"
  }
};

export function RoundTripFlightBookingDetailModal({
  booking,
  userId,
  trigger
}: RoundTripFlightBookingDetailModalProps) {
  const [open, setOpen] = useState(false);
  const [flightData, setFlightData] = useState<
    (FlightBookingDetail & Partial<RoundTripFlightBookingDetail>) | null
  >(null);
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
      minute: "2-digit",
      hour12: false
    });
  };

  const formatDuration = (duration: string) => {
    return duration.replace(/(\d+)h\s*(\d+)m/, "$1 giờ $2 phút");
  };

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
        console.log("✅ Round trip flight booking data:", response.data);
        setFlightData(response.data);
      } else {
        console.error(
          "Failed to fetch flight booking details:",
          response.message
        );
        setFlightData(null);
      }
    } catch (error) {
      console.error("Error fetching flight booking details:", error);
      setFlightData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFlightCard = (
    flight: FlightBookingDetail,
    type: "outbound" | "return"
  ) => {
    const title = type === "outbound" ? "Chuyến đi" : "Chuyến về";
    const bgGradient =
      type === "outbound"
        ? "from-blue-50 to-indigo-50"
        : "from-green-50 to-emerald-50";

    return (
      <Card className={`border-blue-200 bg-gradient-to-r ${bgGradient}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Plane className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                  {title} - {flight.flightId.flightCode}
                </h3>
                <p className="text-sm text-gray-600">
                  {flight.flightId.airline?.name || "Hãng hàng không"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              {flight.flightClassId?.name || "N/A"}
            </Badge>
          </div>

          {/* Route */}
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(flight.flightId.departureTime)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {flight.flightId.departureAirport?.code || "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {flight.flightId.departureAirport?.city || "N/A"}
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
                  {formatDuration(flight.flightId.duration)}
                </div>
                <div className="text-xs text-gray-500">Bay thẳng</div>
              </div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(flight.flightId.arrivalTime)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {flight.flightId.arrivalAirport?.code || "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {flight.flightId.arrivalAirport?.city || "N/A"}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <strong>Ngày bay:</strong>{" "}
              {formatDate(flight.flightId.departureTime)}
            </div>
            {flight.flightId.aircraft && (
              <div className="text-sm text-gray-600 mt-1">
                <strong>Máy bay:</strong> {flight.flightId.aircraft}
              </div>
            )}
            {flight.selectedSeats && flight.selectedSeats.length > 0 && (
              <div className="text-sm text-gray-600 mt-1">
                <strong>Ghế đã chọn:</strong> {flight.selectedSeats.join(", ")}
              </div>
            )}
          </div>

          {/* Price for this leg */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Giá chuyến bay:</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(flight.totalFlightPrice)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPassengers = (flight: FlightBookingDetail, type: string) => {
    if (!flight.passengers || flight.passengers.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Hành khách - {type}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flight.passengers.map((passenger, index) => (
              <div key={passenger._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Hành khách {index + 1}
                  </h4>
                  {passenger.seatNumber && (
                    <Badge variant="outline">Ghế {passenger.seatNumber}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Họ tên</p>
                    <p className="font-medium">{passenger.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày sinh</p>
                    <p className="font-medium">
                      {new Date(passenger.dateOfBirth).toLocaleDateString(
                        "vi-VN"
                      )}
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
                      <p className="text-sm text-gray-600">Số hộ chiếu</p>
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
    );
  };

  if (booking.bookingType !== "flight") {
    return null;
  }

  const isRoundTrip = flightData?.isRoundTrip || false;
  const outboundFlight = flightData?.outboundFlight || flightData;
  const returnFlight = flightData?.returnFlight;

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-blue-50">
              {isRoundTrip ? (
                <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              ) : (
                <Plane className="h-5 w-5 text-blue-600" />
              )}
            </div>
            {isRoundTrip
              ? "Chi tiết chuyến bay khứ hồi"
              : "Chi tiết chuyến bay"}
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
        ) : flightData ? (
          <div className="space-y-6">
            {/* Outbound Flight */}
            {outboundFlight &&
              renderFlightCard(
                outboundFlight as FlightBookingDetail,
                "outbound"
              )}

            {/* Return Flight */}
            {isRoundTrip &&
              returnFlight &&
              renderFlightCard(returnFlight, "return")}

            {/* Total Price Summary */}
            {isRoundTrip && (
              <Card className="border-green-200 bg-gradient-to-r from-emerald-50 to-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Tổng chi phí
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Số lượng vé:</span>
                      <span className="font-semibold">
                        {outboundFlight?.numTickets || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tổng giá vé:</span>
                      <span className="font-semibold">
                        {formatCurrency(flightData.totalPrice || 0)}
                      </span>
                    </div>
                    {(flightData.totalDiscount || 0) > 0 && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Tổng giảm giá:</span>
                        <span className="font-semibold">
                          -{formatCurrency(flightData.totalDiscount || 0)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Tổng thanh toán:</span>
                      <span className="text-green-600">
                        {formatCurrency(
                          (flightData.totalPrice || 0) -
                            (flightData.totalDiscount || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Passengers for Outbound */}
            {outboundFlight &&
              renderPassengers(
                outboundFlight as FlightBookingDetail,
                "Chuyến đi"
              )}

            {/* Passengers for Return */}
            {isRoundTrip &&
              returnFlight &&
              renderPassengers(returnFlight, "Chuyến về")}

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
                      {outboundFlight &&
                      paymentMethodConfig[
                        (outboundFlight as FlightBookingDetail).paymentMethod
                      ]?.logo ? (
                        <img
                          src={
                            paymentMethodConfig[
                              (outboundFlight as FlightBookingDetail)
                                .paymentMethod
                            ].logo
                          }
                          alt={
                            paymentMethodConfig[
                              (outboundFlight as FlightBookingDetail)
                                .paymentMethod
                            ].label
                          }
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <span className="text-2xl">
                          {(outboundFlight &&
                            paymentMethodConfig[
                              (outboundFlight as FlightBookingDetail)
                                .paymentMethod
                            ]?.icon) ||
                            "💳"}
                        </span>
                      )}
                      <div>
                        <p className="font-medium">
                          {(outboundFlight &&
                            paymentMethodConfig[
                              (outboundFlight as FlightBookingDetail)
                                .paymentMethod
                            ]?.label) ||
                            "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Phương thức thanh toán
                        </p>
                      </div>
                    </div>
                    {outboundFlight &&
                      (outboundFlight as FlightBookingDetail).discountCode && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-gray-600">Mã giảm giá</p>
                          <p className="font-medium font-mono">
                            {
                              (outboundFlight as FlightBookingDetail)
                                .discountCode
                            }
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
                      {outboundFlight && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Ngày đặt:</span>
                            <span>
                              {formatDate(
                                (outboundFlight as FlightBookingDetail)
                                  .createdAt
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Cập nhật:</span>
                            <span>
                              {formatDate(
                                (outboundFlight as FlightBookingDetail)
                                  .updatedAt
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* QR Codes */}
            {((outboundFlight as FlightBookingDetail)?.qrCode ||
              returnFlight?.qrCode) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(outboundFlight as FlightBookingDetail)?.qrCode && (
                  <Card className="border-green-200 bg-gradient-to-br from-blue-50 to-sky-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700">
                        <Camera className="h-5 w-5" />
                        QR Code - Chuyến đi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-md">
                          <img
                            src={(outboundFlight as FlightBookingDetail).qrCode}
                            alt="QR Code Outbound"
                            className="w-48 h-48 object-contain"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">
                            Vui lòng xuất trình mã QR này khi check-in
                          </p>
                          <p className="text-xs text-gray-500">
                            Mã chuyến bay:{" "}
                            <span className="font-semibold text-blue-700">
                              {
                                (outboundFlight as FlightBookingDetail)
                                  .flightCode
                              }
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isRoundTrip && returnFlight?.qrCode && (
                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <Camera className="h-5 w-5" />
                        QR Code - Chuyến về
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-md">
                          <img
                            src={returnFlight.qrCode}
                            alt="QR Code Return"
                            className="w-48 h-48 object-contain"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">
                            Vui lòng xuất trình mã QR này khi check-in
                          </p>
                          <p className="text-xs text-gray-500">
                            Mã chuyến bay:{" "}
                            <span className="font-semibold text-green-700">
                              {returnFlight.flightCode}
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
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
