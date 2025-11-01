"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Search, Users, Edit, Trash2, RefreshCw } from "lucide-react";
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
import AirlineModal from "@/components/Admin/AirlineModal";

interface Airline {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  description?: string;
  isActive: boolean;
}

export default function AirlineManagement() {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);

  useEffect(() => {
    fetchAirlines();
  }, []);

  const fetchAirlines = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${env.API_BASE_URL}/airlines`);
      if (data.success) {
        setAirlines(data.data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách hãng hàng không");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hãng hàng không này?")) return;

    try {
      const token = localStorage.getItem("lutrip_admin_token");
      const { data } = await axios.delete(
        `${env.API_BASE_URL}/airlines/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (data.success) {
        toast.success("Xóa hãng hàng không thành công");
        fetchAirlines();
      } else {
        toast.error(data.message || "Không thể xóa hãng hàng không");
      }
    } catch (error) {
      toast.error("Lỗi khi xóa hãng hàng không");
    }
  };

  const filteredAirlines = airlines.filter(
    (airline) =>
      airline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airline.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Danh sách Hãng hàng không
              </CardTitle>
              <CardDescription>
                Quản lý các hãng hàng không trong hệ thống
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchAirlines}
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
                Thêm hãng bay
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mã..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Logo</TableHead>
                  <TableHead className="font-semibold">Mã</TableHead>
                  <TableHead className="font-semibold">Tên hãng</TableHead>
                  <TableHead className="font-semibold">Mô tả</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="font-semibold text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filteredAirlines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Không tìm thấy hãng hàng không nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAirlines.map((airline) => (
                    <TableRow key={airline._id}>
                      <TableCell>
                        {airline.logo ? (
                          <img
                            src={airline.logo}
                            alt={airline.name}
                            className="w-12 h-12 object-contain rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {airline.code}
                      </TableCell>
                      <TableCell>{airline.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {airline.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={airline.isActive ? "default" : "secondary"}
                          className={
                            airline.isActive
                              ? "bg-green-100 text-green-700"
                              : ""
                          }
                        >
                          {airline.isActive ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAirline(airline);
                              setShowModal(true);
                            }}
                            className="hover:bg-sky-50 hover:text-sky-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(airline._id)}
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
        </CardContent>
      </Card>

      {showModal && (
        <AirlineModal
          airline={editingAirline}
          onClose={() => {
            setShowModal(false);
            setEditingAirline(null);
          }}
          onSuccess={() => {
            fetchAirlines();
            setShowModal(false);
            setEditingAirline(null);
          }}
        />
      )}
    </>
  );
}
