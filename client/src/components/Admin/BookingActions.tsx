import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Download, TrendingUp } from "lucide-react";

interface BookingActionsProps {
  isSocketConnected: boolean;
  onRefreshStats: () => void;
  onExportExcel: () => void;
  onGenerateReport: () => void;
}

export function BookingActions({
  isSocketConnected,
  onRefreshStats,
  onExportExcel,
  onGenerateReport
}: BookingActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Booking</h2>
          <Badge
            variant={isSocketConnected ? "default" : "secondary"}
            className={`flex items-center gap-1 ${
              isSocketConnected
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isSocketConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            ></span>
            {isSocketConnected ? "Real-time" : "Offline"}
          </Badge>
        </div>
        <p className="text-gray-600 mt-1">
          Quản lý tất cả các đơn đặt chỗ trong hệ thống
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onRefreshStats}
        >
          <Activity className="h-4 w-4" />
          Refresh Stats
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onExportExcel}
        >
          <Download className="h-4 w-4" />
          Xuất Excel
        </Button>
        <Button className="flex items-center gap-2" onClick={onGenerateReport}>
          <TrendingUp className="h-4 w-4" />
          Báo cáo
        </Button>
      </div>
    </div>
  );
}
