"use client";

import { useState } from "react";
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
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  cancellationRequestService,
  CancellationRequest
} from "@/services/cancellationRequestService";

interface ProcessCancellationDialogProps {
  request: CancellationRequest;
  onSuccess?: () => void;
}

export function ProcessCancellationDialog({
  request,
  onSuccess
}: ProcessCancellationDialogProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!action) return;

    if (action === "reject" && !adminNote.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setIsSubmitting(true);
      const response =
        action === "approve"
          ? await cancellationRequestService.approveRequest(
              request._id,
              adminNote.trim()
            )
          : await cancellationRequestService.rejectRequest(
              request._id,
              adminNote.trim()
            );

      if (response.success) {
        toast.success(
          action === "approve"
            ? "Đã chấp nhận yêu cầu hủy"
            : "Đã từ chối yêu cầu hủy"
        );
        setOpen(false);
        setAction(null);
        setAdminNote("");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(response.message || "Không thể xử lý yêu cầu");
      }
    } catch (error) {
      console.error("Process request error:", error);
      toast.error("Có lỗi xảy ra khi xử lý yêu cầu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        setAction(null);
        setAdminNote("");
      }
    }
  };

  const booking =
    typeof request.bookingId === "object" ? request.bookingId : null;
  const requestUser =
    typeof request.userId === "object" ? request.userId : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Xử lý
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Xử lý yêu cầu hủy booking</DialogTitle>
          <DialogDescription>
            Chọn hành động và cung cấp ghi chú cho khách hàng
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Request Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">
              Thông tin yêu cầu
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {requestUser && (
                <div>
                  <p className="text-xs text-gray-500">Khách hàng</p>
                  <p className="font-medium">{requestUser.fullName}</p>
                  <p className="text-xs text-gray-600">{requestUser.email}</p>
                </div>
              )}
              {booking && (
                <div>
                  <p className="text-xs text-gray-500">Giá trị</p>
                  <p className="font-semibold text-green-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND"
                    }).format(booking.totalPrice)}
                  </p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Lý do hủy</p>
                <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                  {request.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          {!action && (
            <div className="space-y-3">
              <Label>Chọn hành động</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 border-green-200 hover:bg-green-50 hover:border-green-300"
                  onClick={() => setAction("approve")}
                >
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Chấp nhận</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={() => setAction("reject")}
                >
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="text-sm font-medium">Từ chối</span>
                </Button>
              </div>
            </div>
          )}

          {/* Note Input */}
          {action && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="adminNote">
                  Ghi chú{" "}
                  {action === "reject" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAction(null);
                    setAdminNote("");
                  }}
                >
                  Thay đổi
                </Button>
              </div>

              {action === "approve" && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 mb-3">
                  <p className="text-sm text-green-800">
                    <strong>Chấp nhận yêu cầu:</strong> Booking sẽ được đánh dấu
                    là đã hủy và khách hàng sẽ nhận được thông báo.
                  </p>
                </div>
              )}

              {action === "reject" && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200 mb-3">
                  <p className="text-sm text-red-800">
                    <strong>Từ chối yêu cầu:</strong> Vui lòng cung cấp lý do từ
                    chối rõ ràng cho khách hàng.
                  </p>
                </div>
              )}

              <Textarea
                id="adminNote"
                placeholder={
                  action === "approve"
                    ? "Ghi chú cho khách hàng (tùy chọn)..."
                    : "Lý do từ chối (bắt buộc)..."
                }
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {adminNote.length}/500 ký tự
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          {action && (
            <Button
              type="button"
              variant={action === "approve" ? "default" : "destructive"}
              onClick={handleSubmit}
              disabled={
                isSubmitting || (action === "reject" && !adminNote.trim())
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  {action === "approve" ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Chấp nhận
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Từ chối
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
