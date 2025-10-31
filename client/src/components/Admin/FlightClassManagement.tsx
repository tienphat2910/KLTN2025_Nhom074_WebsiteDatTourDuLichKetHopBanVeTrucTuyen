"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Grid3x3, RefreshCw } from "lucide-react";
import axios from "axios";
import { env } from "@/config/env";
import { Button } from "@/components/ui/button";
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

interface FlightClass {
  _id: string;
  flightCode: string;
  className: string;
  price: number;
  baggageAllowance: number;
  cabinBaggage: number;
  availableSeats: number;
  amenities: string[];
}

export default function FlightClassManagement() {
  const [classes, setClasses] = useState<FlightClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("lutrip_admin_token");
      const { data } = await axios.get(`${env.API_BASE_URL}/flight-classes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (Array.isArray(data)) {
        setClasses(data);
      } else if (data.success && Array.isArray(data.data)) {
        setClasses(data.data);
      } else {
        setClasses([]);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách hạng ghế");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };

  const getClassBadge = (className: string) => {
    const classMap: Record<string, { label: string; className: string }> = {
      Business: {
        label: "Thương gia",
        className: "bg-purple-100 text-purple-700"
      },
      "Premium Economy": {
        label: "Phổ thông đặc biệt",
        className: "bg-blue-100 text-blue-700"
      },
      Economy: {
        label: "Phổ thông",
        className: "bg-green-100 text-green-700"
      },
      "First Class": {
        label: "Hạng nhất",
        className: "bg-yellow-100 text-yellow-700"
      }
    };
    const { label, className: badgeClass } = classMap[className] || {
      label: className,
      className: ""
    };
    return <Badge className={badgeClass}>{label}</Badge>;
  };

  // Filter classes
  const filteredClasses = classes.filter((flightClass) => {
    const matchesSearch =
      flightClass.flightCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flightClass.className.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5" />
              Hạng ghế
            </CardTitle>
            <CardDescription>
              Quản lý các hạng ghế của chuyến bay
            </CardDescription>
          </div>
          <Button
            onClick={fetchClasses}
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
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm theo mã chuyến bay, hạng ghế..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Mã chuyến bay</TableHead>
                <TableHead className="font-semibold">Hạng ghế</TableHead>
                <TableHead className="font-semibold">Giá</TableHead>
                <TableHead className="font-semibold">Hành lý ký gửi</TableHead>
                <TableHead className="font-semibold">
                  Hành lý xách tay
                </TableHead>
                <TableHead className="font-semibold">Số ghế</TableHead>
                <TableHead className="font-semibold">Tiện ích</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : paginatedClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Grid3x3 className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Không tìm thấy hạng ghế nào</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClasses.map((flightClass) => (
                  <TableRow key={flightClass._id}>
                    <TableCell className="font-medium">
                      {flightClass.flightCode}
                    </TableCell>
                    <TableCell>
                      {getClassBadge(flightClass.className)}
                    </TableCell>
                    <TableCell>{formatPrice(flightClass.price)}</TableCell>
                    <TableCell>{flightClass.baggageAllowance} kg</TableCell>
                    <TableCell>{flightClass.cabinBaggage} kg</TableCell>
                    <TableCell>{flightClass.availableSeats}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {flightClass.amenities.map((amenity, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && filteredClasses.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Hiển thị {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredClasses.length)} /{" "}
              {filteredClasses.length} hạng ghế
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, idx, arr) => {
                    const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
