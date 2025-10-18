"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: ReportOptions) => void;
}

export interface ReportOptions {
  includeDetails: boolean;
  includeCharts: boolean;
  includeCustomerInfo: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export function ReportModal({ isOpen, onClose, onGenerate }: ReportModalProps) {
  const [options, setOptions] = useState<ReportOptions>({
    includeDetails: true,
    includeCharts: true,
    includeCustomerInfo: true
  });

  const handleGenerate = () => {
    onGenerate(options);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tùy chọn Báo cáo</DialogTitle>
          <DialogDescription>
            Chọn nội dung bạn muốn bao gồm trong báo cáo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="details"
              checked={options.includeDetails}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeDetails: checked as boolean })
              }
            />
            <Label htmlFor="details" className="cursor-pointer">
              Bao gồm danh sách chi tiết bookings
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="charts"
              checked={options.includeCharts}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeCharts: checked as boolean })
              }
            />
            <Label htmlFor="charts" className="cursor-pointer">
              Bao gồm biểu đồ thống kê (sẽ thêm trong tương lai)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="customer"
              checked={options.includeCustomerInfo}
              onCheckedChange={(checked) =>
                setOptions({
                  ...options,
                  includeCustomerInfo: checked as boolean
                })
              }
            />
            <Label htmlFor="customer" className="cursor-pointer">
              Bao gồm thông tin khách hàng chi tiết
            </Label>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Khoảng thời gian: Tất cả (sẽ thêm date picker sau)</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleGenerate}>Tạo báo cáo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
