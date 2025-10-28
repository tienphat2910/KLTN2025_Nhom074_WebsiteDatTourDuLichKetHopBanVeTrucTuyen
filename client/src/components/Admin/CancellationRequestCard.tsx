"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  User,
  FileText
} from "lucide-react";
import { CancellationRequest } from "@/services/cancellationRequestService";
import { ProcessCancellationDialog } from "./ProcessCancellationDialog";
import { FlightBookingDetailModal } from "./FlightBookingDetailModal";
import { TourBookingDetailModal } from "./TourBookingDetailModal";
import { ActivityBookingDetailModal } from "./ActivityBookingDetailModal";

const statusConfig = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock
  },
  approved: {
    label: "Đã chấp nhận",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  },
  rejected: {
    label: "Đã từ chối",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle
  }
};

const bookingTypeConfig = {
  tour: {
    label: "Tour du lịch",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  activity: {
    label: "Hoạt động",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  flight: {
    label: "Chuyến bay",
    color: "text-green-600",
    bgColor: "bg-green-50"
  }
};

interface CancellationRequestCardProps {
  request: CancellationRequest;
  onSuccess: () => void;
}

export function CancellationRequestCard({
  request,
  onSuccess
}: CancellationRequestCardProps) {
  const statusInfo = statusConfig[request.status];
  const typeConfig = bookingTypeConfig[request.bookingType];
  const StatusIcon = statusInfo.icon;
  const booking =
    typeof request.bookingId === "object" ? request.bookingId : null;
  const requestUser =
    typeof request.userId === "object" ? request.userId : null;

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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Left side - Request info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                  <AlertCircle className={`h-5 w-5 ${typeConfig.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {typeConfig.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Yêu cầu hủy #{request._id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requestUser && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Khách hàng</p>
                    <p className="text-sm font-medium">
                      {requestUser.fullName}
                    </p>
                    <p className="text-xs text-gray-600">{requestUser.email}</p>
                  </div>
                </div>
              )}

              {booking && (
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Giá trị đơn hàng</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(booking.totalPrice)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Thời gian gửi</p>
                  <p className="text-sm font-medium">
                    {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>

              {request.processedAt && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Thời gian xử lý</p>
                    <p className="text-sm font-medium">
                      {formatDate(request.processedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-600 mt-0.5" />
                <p className="text-xs font-medium text-gray-700">Lý do hủy:</p>
              </div>
              <p className="text-sm text-gray-800 ml-6">{request.reason}</p>
            </div>

            {request.adminNote && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-xs font-medium text-blue-700">
                    Ghi chú từ admin:
                  </p>
                </div>
                <p className="text-sm text-blue-900 ml-6">
                  {request.adminNote}
                </p>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex gap-2">
              {booking && (
                <>
                  {request.bookingType === "flight" && (
                    <FlightBookingDetailModal
                      booking={booking}
                      userId={request.userId}
                    />
                  )}
                  {request.bookingType === "tour" && (
                    <TourBookingDetailModal
                      booking={booking}
                      userId={request.userId}
                    />
                  )}
                  {request.bookingType === "activity" && (
                    <ActivityBookingDetailModal
                      booking={booking}
                      userId={request.userId}
                    />
                  )}
                </>
              )}

              {request.status === "pending" && (
                <ProcessCancellationDialog
                  request={request}
                  onSuccess={onSuccess}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
