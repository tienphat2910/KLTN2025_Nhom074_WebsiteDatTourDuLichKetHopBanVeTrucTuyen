"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Plus, Search, Edit, Trash2, Plane, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@/config/env";
import { Input } from "@/components/ui/input";
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
import FlightModal from "@/components/Admin/FlightModal";

interface Flight {
  _id: string;
  flightCode: string;
  airlineId: {
    _id: string;
    name: string;
    code: string;
  };
  departureAirportId: {
    _id: string;
    name: string;
    city: string;
    iata: string;
  };
  arrivalAirportId: {
    _id: string;
    name: string;
    city: string;
    iata: string;
  };
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  basePrice: number;
  availableSeats: number;
  status: string;
  aircraft?: {
    model: string;
    registration: string;
  };
}

export default function FlightManagement() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Increased from default
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);

  useEffect(() => {
    fetchFlights(1); // Reset to page 1 when search changes
  }, [searchTerm]);

  const fetchFlights = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });

      const { data } = await axios.get(`${env.API_BASE_URL}/flights?${params}`);
      if (data.success) {
        setFlights(data.data);
        setTotalPages(data.pagination?.totalPages || 0);
        setTotalCount(data.pagination?.totalCount || 0);
        setCurrentPage(data.pagination?.currentPage || 1);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách chuyến bay");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa chuyến bay này? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("lutrip_admin_token");
      const { data } = await axios.delete(`${env.API_BASE_URL}/flights/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (data.success) {
        toast.success("Xóa chuyến bay thành công");
        fetchFlights(currentPage);
      } else {
        toast.error(data.message || "Không thể xóa chuyến bay");
      }
    } catch (error) {
      toast.error("Lỗi khi xóa chuyến bay");
    }
  };

  const handleEdit = (flight: Flight) => {
    setEditingFlight(flight);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFlight(null);
  };

  const handleSuccess = () => {
    fetchFlights(currentPage);
    handleCloseModal();
  };

  const filteredFlights = flights.filter(
    (flight) =>
      flight.flightCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.airlineId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.departureAirportId?.city
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      flight.arrivalAirportId?.city
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Danh sách Chuyến bay
              </CardTitle>
              <CardDescription>
                Quản lý tất cả chuyến bay trong hệ thống
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchFlights(currentPage)}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Làm mới
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-sky-600 hover:bg-sky-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm chuyến bay
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo mã chuyến bay, hãng, địa điểm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Mã CB</TableHead>
                  <TableHead className="font-semibold">Hãng bay</TableHead>
                  <TableHead className="font-semibold">Tuyến bay</TableHead>
                  <TableHead className="font-semibold">Thời gian</TableHead>
                  <TableHead className="font-semibold">Giá</TableHead>
                  <TableHead className="font-semibold">Ghế</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="font-semibold text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-4 border-sky-600 border-t-transparent rounded-full"></div>
                        <span className="ml-2">Đang tải...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredFlights.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-400">
                        <Plane className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Không tìm thấy chuyến bay nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFlights.map((flight) => (
                    <TableRow key={flight._id}>
                      <TableCell className="font-medium">
                        {flight.flightCode}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {flight.airlineId?.code}
                          </span>
                          <span className="text-sm text-gray-500">
                            {flight.airlineId?.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {flight.departureAirportId?.iata}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium">
                              {flight.arrivalAirportId?.iata}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {flight.departureAirportId?.city} →{" "}
                            {flight.arrivalAirportId?.city}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="text-sm">
                            {formatTime(flight.departureTime)} -{" "}
                            {formatTime(flight.arrivalTime)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(flight.departureTime)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDuration(flight.durationMinutes)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-sky-600">
                          {flight.basePrice.toLocaleString("vi-VN")} đ
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{flight.availableSeats}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            flight.status === "active"
                              ? "default"
                              : flight.status === "inactive"
                              ? "secondary"
                              : "destructive"
                          }
                          className={
                            flight.status === "active"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : ""
                          }
                        >
                          {flight.status === "active"
                            ? "Hoạt động"
                            : flight.status === "inactive"
                            ? "Tạm dừng"
                            : "Hủy"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(flight)}
                            className="hover:bg-sky-50 hover:text-sky-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(flight._id)}
                            className="hover:bg-red-50 hover:text-red-600"
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

          {/* Summary & Pagination */}
          {!loading && totalCount > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, totalCount)} /{" "}
                {totalCount} chuyến bay
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    fetchFlights(newPage);
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
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          fetchFlights(pageNum);
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
                    fetchFlights(newPage);
                  }}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <FlightModal
          flight={editingFlight}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
