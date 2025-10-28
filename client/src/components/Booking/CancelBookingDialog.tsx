"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cancellationRequestService } from "@/services/cancellationRequestService";
import { Booking } from "@/services/bookingService";

interface CancelBookingDialogProps {
  booking: Booking;
  onSuccess?: () => void;
}

export function CancelBookingDialog({
  booking,
  onSuccess
}: CancelBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);

  // Check if there's already a pending cancellation request for this booking
  useEffect(() => {
    checkPendingRequest();
  }, [booking._id]);

  const checkPendingRequest = async () => {
    try {
      setIsCheckingRequest(true);
      const response = await cancellationRequestService.getByBookingId(
        booking._id
      );

      if (response.success && response.data) {
        // Check if data is a single request (not an array) and has pending status
        if (
          !Array.isArray(response.data) &&
          response.data.status === "pending"
        ) {
          setHasPendingRequest(true);
        }
      }
    } catch (error) {
      console.error("Check pending request error:", error);
    } finally {
      setIsCheckingRequest(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do hủy");
      return;
    }

    if (reason.trim().length < 10) {
      toast.error("Lý do hủy phải có ít nhất 10 ký tự");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await cancellationRequestService.createRequest({
        bookingId: booking._id,
        reason: reason.trim()
      });

      if (response.success) {
        toast.success("Đã gửi yêu cầu hủy thành công");
        setOpen(false);
        setReason("");
        setHasPendingRequest(true); // Update state to show pending status
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(response.message || "Không thể gửi yêu cầu hủy");
      }
    } catch (error) {
      console.error("Cancel request error:", error);
      toast.error("Có lỗi xảy ra khi gửi yêu cầu hủy");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking for pending request
  if (isCheckingRequest) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // If there's already a pending request, show disabled button
  if (hasPendingRequest) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <CheckCircle className="h-4 w-4" />
        Đã gửi yêu cầu
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Yêu cầu hủy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yêu cầu hủy booking</DialogTitle>
          <DialogDescription>
            Vui lòng cung cấp lý do hủy booking. Admin sẽ xem xét và phản hồi
            yêu cầu của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Lưu ý quan trọng:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Yêu cầu hủy sẽ được gửi đến admin để xem xét</li>
                <li>Quá trình xử lý có thể mất 1-3 ngày làm việc</li>
                <li>Bạn sẽ nhận được thông báo khi yêu cầu được xử lý</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Lý do hủy <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Vui lòng nhập lý do hủy booking (tối thiểu 10 ký tự)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{reason.length}/500 ký tự</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Thông tin booking:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <span className="font-medium">Mã:</span>{" "}
                {booking._id.slice(-8).toUpperCase()}
              </p>
              <p>
                <span className="font-medium">Loại:</span>{" "}
                {booking.bookingType === "tour"
                  ? "Tour du lịch"
                  : booking.bookingType === "activity"
                  ? "Hoạt động"
                  : "Chuyến bay"}
              </p>
              <p>
                <span className="font-medium">Tổng tiền:</span>{" "}
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND"
                }).format(booking.totalPrice)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={
              isSubmitting || !reason.trim() || reason.trim().length < 10
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
