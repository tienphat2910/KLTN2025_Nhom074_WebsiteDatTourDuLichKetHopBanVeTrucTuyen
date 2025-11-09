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

  // Effect to refetch when filters change
  useEffect(() => {
    fetchSchedules(1); // Reset to page 1 when filters change
  }, [searchTerm, statusFilter]);

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
            </CardTitle>
            <CardDescription>Quản lý lịch trình các chuyến bay</CardDescription>
          </div>
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
      </CardHeader>
      <CardContent>
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
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="boarding">Đang lên máy bay</SelectItem>
                <SelectItem value="departed">Đã khởi hành</SelectItem>
                <SelectItem value="arrived">Đã đến</SelectItem>
                <SelectItem value="delayed">Bị trễ</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
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
