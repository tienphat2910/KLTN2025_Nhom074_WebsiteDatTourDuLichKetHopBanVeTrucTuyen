"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { env } from "@/config/env";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface FlightSchedule {
  _id: string;
  flightCode: string;
  departureDate: string;
  arrivalDate: string;
  status: string;
  remainingSeats: number;
  currentPrice: number;
  delay?: number;
  gate?: string;
}

interface FlightScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schedule: FlightSchedule | null;
}

export default function FlightScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  schedule
}: FlightScheduleModalProps) {
  const [formData, setFormData] = useState({
    flightCode: "",
    departureDate: "",
    arrivalDate: "",
    status: "scheduled",
    remainingSeats: 0,
    currentPrice: 0,
    delay: 0,
    gate: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schedule) {
      setFormData({
        flightCode: schedule.flightCode,
        departureDate: schedule.departureDate.split(".")[0],
        arrivalDate: schedule.arrivalDate.split(".")[0],
        status: schedule.status,
        remainingSeats: schedule.remainingSeats,
        currentPrice: schedule.currentPrice,
        delay: schedule.delay || 0,
        gate: schedule.gate || ""
      });
    } else {
      setFormData({
        flightCode: "",
        departureDate: "",
        arrivalDate: "",
        status: "scheduled",
        remainingSeats: 0,
        currentPrice: 0,
        delay: 0,
        gate: ""
      });
    }
  }, [schedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("lutrip_admin_token");
      const url = schedule
        ? `${env.API_BASE_URL}/flight-schedules/${schedule._id}`
        : `${env.API_BASE_URL}/flight-schedules`;

      const response = await fetch(url, {
        method: schedule ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          delay: formData.delay || undefined,
          gate: formData.gate || undefined
        })
      });

      if (response.ok) {
        toast.success(
          schedule ? "Cập nhật lịch bay thành công" : "Tạo lịch bay thành công"
        );
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu lịch bay");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Chỉnh sửa lịch bay" : "Thêm lịch bay mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flightCode">
                Mã chuyến bay <span className="text-red-500">*</span>
              </Label>
              <Input
                id="flightCode"
                value={formData.flightCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    flightCode: e.target.value.toUpperCase()
                  })
                }
                placeholder="VN123"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                  <SelectItem value="boarding">Đang lên máy bay</SelectItem>
                  <SelectItem value="departed">Đã khởi hành</SelectItem>
                  <SelectItem value="arrived">Đã đến</SelectItem>
                  <SelectItem value="delayed">Bị trễ</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departureDate">
                Ngày khởi hành <span className="text-red-500">*</span>
              </Label>
              <Input
                id="departureDate"
                type="datetime-local"
                value={formData.departureDate}
                onChange={(e) =>
                  setFormData({ ...formData, departureDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrivalDate">
                Ngày đến <span className="text-red-500">*</span>
              </Label>
              <Input
                id="arrivalDate"
                type="datetime-local"
                value={formData.arrivalDate}
                onChange={(e) =>
                  setFormData({ ...formData, arrivalDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remainingSeats">
                Ghế còn lại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="remainingSeats"
                type="number"
                min="0"
                value={formData.remainingSeats}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    remainingSeats: parseInt(e.target.value) || 0
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPrice">
                Giá hiện tại (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="currentPrice"
                type="number"
                min="0"
                value={formData.currentPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentPrice: parseInt(e.target.value) || 0
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delay">Độ trễ (phút)</Label>
              <Input
                id="delay"
                type="number"
                min="0"
                value={formData.delay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delay: parseInt(e.target.value) || 0
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gate">Cổng</Label>
              <Input
                id="gate"
                value={formData.gate}
                onChange={(e) =>
                  setFormData({ ...formData, gate: e.target.value })
                }
                placeholder="A12"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : schedule ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
