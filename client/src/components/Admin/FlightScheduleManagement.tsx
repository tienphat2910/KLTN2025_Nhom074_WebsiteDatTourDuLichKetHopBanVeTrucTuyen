"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import {
  Search,
  Calendar,
  Edit,
  Trash2,
  Filter,
  RefreshCw
} from "lucide-react";
import { env } from "@/config/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FlightScheduleModal from "@/components/Admin/FlightScheduleModal";

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
  flight?: any;
}

export default function FlightScheduleManagement() {
  const [schedules, setSchedules] = useState<FlightSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Increased from 10 to 20
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FlightSchedule | null>(
    null
  );
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);

  // Effect to refetch when filters change
  useEffect(() => {
    fetchSchedules(1); // Reset to page 1 when filters change
  }, [searchTerm, statusFilter]);

  // Socket.IO real-time updates
  useEffect(() => {
    const token = localStorage.getItem("lutrip_admin_token");
    if (!token) return;

    // Dynamic import to avoid SSR issues
    import("socket.io-client").then(({ default: io }) => {
      const socket = io((env.API_BASE_URL || "").replace("/api", ""), {
        auth: { token },
        transports: ["websocket", "polling"]
      });

      socket.on("connect", () => {
        console.log("✅ Connected to flight schedule updates");
      });

      socket.on("flight_status_changed", (data) => {
        console.log("📡 Flight status changed:", data);
        toast.info(
          `Chuyến bay ${
            data.flightCode
          } đã chuyển sang trạng thái: ${getStatusLabel(data.status)}`
        );

        // Update the schedule in the list
        setSchedules((prev) =>
          prev.map((s) =>
            s._id === data.scheduleId ? { ...s, status: data.status } : s
          )
        );
      });

      socket.on("disconnect", () => {
        console.log("❌ Disconnected from flight schedule updates");
      });

      return () => {
        socket.disconnect();
      };
    });
  }, []);

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      scheduled: "Đã lên lịch",
      boarding: "Đang lên máy bay",
      departed: "Đã khởi hành",
      arrived: "Đã đến",
      delayed: "Bị trễ",
      cancelled: "Đã hủy"
    };
    return statusMap[status] || status;
  };

  const fetchSchedules = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("lutrip_admin_token");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });

      // Add filters
      if (searchTerm) params.append("flightCode", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      // Exclude 'arrived' status by default
      if (statusFilter === "all") params.append("excludeArrived", "true");

      const { data } = await axios.get(
        `${env.API_BASE_URL}/flight-schedules?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (data.success) {
        setSchedules(data.data || []);
        setTotalPages(data.pagination?.totalPages || 0);
        setTotalCount(data.pagination?.totalCount || 0);
        setCurrentPage(data.pagination?.currentPage || 1);
      } else {
        setSchedules([]);
        setTotalPages(0);
        setTotalCount(0);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách lịch bay");
      setSchedules([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lịch bay này?")) return;

    try {
      const token = localStorage.getItem("lutrip_admin_token");
      await axios.delete(`${env.API_BASE_URL}/flight-schedules/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("Xóa lịch bay thành công");
      fetchSchedules(currentPage);
    } catch (error) {
      toast.error("Lỗi khi xóa lịch bay");
    }
  };

  const handleManualUpdate = async () => {
    setIsAutoUpdating(true);
    try {
      const token = localStorage.getItem("lutrip_admin_token");
      const response = await axios.post(
        `${env.API_BASE_URL}/flight-schedules/auto-update`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Đã cập nhật ${response.data.updatedCount} lịch bay`);
        fetchSchedules(currentPage);
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật tự động");
    } finally {
      setIsAutoUpdating(false);
    }
  };

  const handleStatusCheck = async () => {
    try {
      const token = localStorage.getItem("lutrip_admin_token");
      const response = await axios.get(
        `${env.API_BASE_URL}/flight-schedules/status-check`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        console.log("📊 Status Check Results:", response.data);
        const needsUpdate = response.data.schedules.filter(
          (s: any) =>
            s.shouldBeBoarding || s.shouldBeDeparted || s.shouldBeArrived
        );
        toast.info(
          `Tìm thấy ${needsUpdate.length} lịch bay cần cập nhật. Xem console để biết chi tiết.`
        );
      }
    } catch (error) {
      toast.error("Lỗi khi kiểm tra trạng thái");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };

  // Filter schedules (client-side filtering for search)
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch = schedule.flightCode
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      scheduled: {
        label: "Đã lên lịch",
        className: "bg-blue-100 text-blue-700"
      },
      boarding: {
        label: "Đang lên máy bay",
        className: "bg-yellow-100 text-yellow-700"
      },
      departed: {
        label: "Đã khởi hành",
        className: "bg-green-100 text-green-700"
      },
      arrived: { label: "Đã đến", className: "bg-purple-100 text-purple-700" },
      delayed: { label: "Bị trễ", className: "bg-orange-100 text-orange-700" },
      cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-700" }
    };
    const { label, className } = statusMap[status] || {
      label: status,
      className: ""
    };
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Lịch bay
              <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Auto-Update
              </Badge>
            </CardTitle>
            <CardDescription>
              Quản lý lịch trình các chuyến bay - Tự động cập nhật mỗi 1 phút
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleStatusCheck}
              variant="outline"
              size="sm"
              className="bg-purple-50 hover:bg-purple-100"
            >
              <Search className="w-4 h-4 mr-2" />
              Debug
            </Button>
            <Button
              onClick={handleManualUpdate}
              variant="outline"
              size="sm"
              disabled={isAutoUpdating}
              className="bg-blue-50 hover:bg-blue-100"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${
                  isAutoUpdating ? "animate-spin" : ""
                }`}
              />
              Cập nhật ngay
            </Button>
            <Button
              onClick={() => fetchSchedules(currentPage)}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Auto-Update Info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">
                Tự động cập nhật trạng thái
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 2 giờ trước giờ bay: Đã lên lịch → Đang lên máy bay</li>
                <li>• Đúng giờ khởi hành: Đang lên máy bay → Đã khởi hành</li>
                <li>• Đúng giờ đến: Đã khởi hành → Đã đến</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm theo mã chuyến bay..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="boarding">Đang lên máy bay</SelectItem>
                <SelectItem value="departed">Đã khởi hành</SelectItem>
                <SelectItem value="delayed">Bị trễ</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="arrived">Đã đến</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Mã chuyến bay</TableHead>
                <TableHead className="font-semibold">Ngày khởi hành</TableHead>
                <TableHead className="font-semibold">Ngày đến</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold">Ghế còn lại</TableHead>
                <TableHead className="font-semibold">Giá hiện tại</TableHead>
                <TableHead className="font-semibold text-right">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Không tìm thấy lịch bay nào</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((schedule) => (
                  <TableRow key={schedule._id}>
                    <TableCell className="font-medium">
                      {schedule.flightCode}
                    </TableCell>
                    <TableCell>{formatDate(schedule.departureDate)}</TableCell>
                    <TableCell>{formatDate(schedule.arrivalDate)}</TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>{schedule.remainingSeats}</TableCell>
                    <TableCell>{formatPrice(schedule.currentPrice)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSchedule(schedule);
                            setShowModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(schedule._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, totalCount)} / {totalCount}{" "}
              lịch bay
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = currentPage - 1;
                  setCurrentPage(newPage);
                  fetchSchedules(newPage);
                }}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        fetchSchedules(pageNum);
                      }}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = currentPage + 1;
                  setCurrentPage(newPage);
                  fetchSchedules(newPage);
                }}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <FlightScheduleModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSchedule(null);
        }}
        onSuccess={() => fetchSchedules(currentPage)}
        schedule={editingSchedule}
      />
    </Card>
  );
}
