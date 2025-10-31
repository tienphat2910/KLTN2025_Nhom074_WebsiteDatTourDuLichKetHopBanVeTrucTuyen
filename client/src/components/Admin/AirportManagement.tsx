"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Building2, RefreshCw } from "lucide-react";
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

interface Airport {
  _id: string;
  name: string;
  city: string;
  iata: string;
  icao: string;
}

export default function AirportManagement() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAirports();
  }, []);

  const fetchAirports = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${env.API_BASE_URL}/airports`);
      if (Array.isArray(data)) {
        setAirports(data);
      } else if (data.success && Array.isArray(data.data)) {
        setAirports(data.data);
      } else {
        setAirports([]);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách sân bay");
      setAirports([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAirports = airports.filter(
    (airport) =>
      airport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airport.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airport.iata.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Danh sách Sân bay
            </CardTitle>
            <CardDescription>
              Quản lý các sân bay trong hệ thống
            </CardDescription>
          </div>
          <Button
            onClick={fetchAirports}
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
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm theo tên, thành phố, mã IATA..."
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
                <TableHead className="font-semibold">Mã IATA</TableHead>
                <TableHead className="font-semibold">Mã ICAO</TableHead>
                <TableHead className="font-semibold">Tên sân bay</TableHead>
                <TableHead className="font-semibold">Thành phố</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filteredAirports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Không tìm thấy sân bay nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredAirports.map((airport) => (
                  <TableRow key={airport._id}>
                    <TableCell className="font-medium">
                      {airport.iata}
                    </TableCell>
                    <TableCell>{airport.icao}</TableCell>
                    <TableCell>{airport.name}</TableCell>
                    <TableCell>{airport.city}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filteredAirports.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Hiển thị {filteredAirports.length} / {airports.length} sân bay
          </div>
        )}
      </CardContent>
    </Card>
  );
}
