import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Receipt, Loader2, Trash2 } from "lucide-react";
import { BookingDetailModal } from "@/components/Booking/BookingDetailModal";
import { FlightBookingDetailModal } from "@/components/Admin/FlightBookingDetailModal";
import { RoundTripFlightBookingDetailModal } from "@/components/Admin/RoundTripFlightBookingDetailModal";
import { TourBookingDetailModal } from "@/components/Admin/TourBookingDetailModal";
import { ActivityBookingDetailModal } from "@/components/Admin/ActivityBookingDetailModal";
import { Booking } from "@/services/bookingService";
import { statusConfig, bookingTypeConfig } from "./bookingConstants";
import { formatCurrency, formatDate } from "./bookingUtils";

interface BookingTableProps {
  bookings: Booking[];
  isLoading: boolean;
  onStatusChange: (bookingId: string, newStatus: string) => void;
  onDeleteBooking: (bookingId: string) => void;
}

export function BookingTable({
  bookings,
  isLoading,
  onStatusChange,
  onDeleteBooking
}: BookingTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Booking ({bookings.length})</CardTitle>
          <CardDescription>
            Quản lý và theo dõi tất cả các đơn đặt chỗ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Đang tải...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Booking (0)</CardTitle>
          <CardDescription>
            Quản lý và theo dõi tất cả các đơn đặt chỗ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy booking nào
            </h3>
            <p className="text-gray-600">
              Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách Booking ({bookings.length})</CardTitle>
        <CardDescription>
          Quản lý và theo dõi tất cả các đơn đặt chỗ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Booking</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const typeConfig = bookingTypeConfig[booking.bookingType];
                const statusInfo = statusConfig[booking.status];
                const TypeIcon = typeConfig.icon;
                const StatusIcon = statusInfo.icon;

                // Debug log for flight bookings
                if (booking.bookingType === "flight") {
                  console.log(`Booking ${booking._id}:`, {
                    isRoundTrip: booking.isRoundTrip,
                    actualTotal: booking.actualTotal,
                    totalPrice: booking.totalPrice
                  });
                }

                return (
                  <TableRow key={booking._id}>
                    <TableCell className="font-mono text-sm">
                      {booking._id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${typeConfig.bgColor}`}>
                          <TypeIcon className={`h-3 w-3 ${typeConfig.color}`} />
                        </div>
                        <span className="text-sm">{typeConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(booking.bookingDate)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(
                        booking.actualTotal || booking.totalPrice
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {booking.user?.fullName || "Khách hàng"}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {booking.user?.email ||
                            (typeof booking.userId === "string"
                              ? `ID: ${booking.userId.slice(-8).toUpperCase()}`
                              : "N/A")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(booking.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        {booking.bookingType === "flight" ? (
                          // Check if it's a round trip flight booking
                          booking.isRoundTrip ? (
                            <RoundTripFlightBookingDetailModal
                              booking={booking}
                            />
                          ) : (
                            <FlightBookingDetailModal booking={booking} />
                          )
                        ) : booking.bookingType === "tour" ? (
                          <TourBookingDetailModal booking={booking} />
                        ) : booking.bookingType === "activity" ? (
                          <ActivityBookingDetailModal booking={booking} />
                        ) : (
                          <BookingDetailModal booking={booking} />
                        )}

                        <Select
                          value={booking.status}
                          onValueChange={(value) =>
                            onStatusChange(booking._id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              Chờ xác nhận
                            </SelectItem>
                            <SelectItem value="confirmed">Xác nhận</SelectItem>
                            <SelectItem value="completed">
                              Hoàn thành
                            </SelectItem>
                            <SelectItem value="cancelled">Hủy</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteBooking(booking._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
