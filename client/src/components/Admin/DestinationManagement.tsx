"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  Star,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DestinationModal } from "./DestinationModal";
import {
  Destination,
  DestinationFormData,
  DestinationRegion
} from "@/types/destination";
import { destinationService } from "@/services/destinationService";
import { toast } from "sonner";

const regionLabels: Record<DestinationRegion, string> = {
  "Miền Bắc": "Miền Bắc",
  "Miền Trung": "Miền Trung",
  "Miền Nam": "Miền Nam",
  "Tây Nguyên": "Tây Nguyên"
};

const regionColors: Record<
  DestinationRegion,
  "default" | "secondary" | "destructive" | "outline"
> = {
  "Miền Bắc": "default",
  "Miền Trung": "secondary",
  "Miền Nam": "destructive",
  "Tây Nguyên": "outline"
};

export function DestinationManagement() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [totalDestinations, setTotalDestinations] = useState(0);
  const [popularDestinationsCount, setPopularDestinationsCount] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [popularFilter, setPopularFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDestination, setEditingDestination] =
    useState<Destination | null>(null);

  // Load destinations data
  const loadDestinations = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await destinationService.getDestinations({
        page,
        limit: 10, // Load 10 destinations per page
        search: searchTerm || undefined,
        region: regionFilter !== "all" ? regionFilter : undefined,
        popular: popularFilter !== "all" ? popularFilter === "true" : undefined
      });

      if (response.success && response.data) {
        // Transform API data to match component interface
        const transformedDestinations: Destination[] =
          response.data.destinations.map((dest: any) => ({
            id: dest._id,
            name: dest.name,
            description: dest.description,
            image: dest.image,
            popular: dest.popular,
            slug: dest.slug,
            region: dest.region,
            createdAt: dest.createdAt
              ? new Date(dest.createdAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            updatedAt: dest.updatedAt
              ? new Date(dest.updatedAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0]
          }));

        // Sort destinations by ID
        transformedDestinations.sort((a, b) => {
          // Extract numbers from IDs like D001, D002, etc.
          const aMatch = a.id.match(/^D(\d+)$/);
          const bMatch = b.id.match(/^D(\d+)$/);

          if (aMatch && bMatch) {
            const aNum = parseInt(aMatch[1], 10);
            const bNum = parseInt(bMatch[1], 10);
            return aNum - bNum;
          }

          // Fallback to string comparison
          return a.id.localeCompare(b.id);
        });

        setDestinations(transformedDestinations);
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setFilteredTotal(response.data.pagination.totalDestinations);
      } else {
        setError(response.message || "Không thể tải danh sách địa điểm");
        setDestinations([]);
      }
    } catch (error) {
      console.error("Load destinations error:", error);
      setError("Có lỗi xảy ra khi tải dữ liệu");
      setDestinations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load destination statistics
  const loadStats = async () => {
    try {
      // Get all destinations to count popular ones (without filters)
      const allResponse = await destinationService.getDestinations({
        page: 1,
        limit: 1000 // Large limit to get all destinations
      });

      if (allResponse.success && allResponse.data) {
        setTotalDestinations(allResponse.data.pagination.totalDestinations);

        // Count popular destinations from all results
        const popularCount = allResponse.data.destinations.filter(
          (dest: any) => dest.popular
        ).length;
        setPopularDestinationsCount(popularCount);
      }
    } catch (error) {
      console.error("Load stats error:", error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadDestinations(1);
    loadStats();
  }, [searchTerm, regionFilter, popularFilter]);

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadDestinations(page);
  };

  const handleDestinationAction = async (
    action: string,
    destinationId: string
  ) => {
    try {
      let response;

      switch (action) {
        case "delete":
          // Show confirmation dialog
          if (window.confirm("Bạn có chắc chắn muốn xóa địa điểm này?")) {
            response = await destinationService.deleteDestination(
              destinationId
            );
            if (response.success) {
              toast.success("Đã xóa địa điểm thành công");
              loadDestinations(currentPage);
              loadStats();
            } else {
              toast.error(response.message || "Không thể xóa địa điểm");
            }
          }
          break;
      }
    } catch (error) {
      console.error("Destination action error:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleEditDestination = (destination: Destination) => {
    setEditingDestination(destination);
    setIsModalOpen(true);
  };

  const handleAddDestination = () => {
    setEditingDestination(null);
    setIsModalOpen(true);
  };

  const handleSaveDestination = async (
    destinationData: DestinationFormData
  ) => {
    try {
      if (editingDestination) {
        // Update existing destination
        const response = await destinationService.updateDestination(
          editingDestination.id,
          destinationData
        );
        if (response.success) {
          toast.success("Cập nhật địa điểm thành công");
          loadDestinations(currentPage);
          loadStats();
        } else {
          toast.error(response.message || "Không thể cập nhật địa điểm");
        }
      } else {
        // Create new destination
        const response = await destinationService.createDestination(
          destinationData
        );
        if (response.success) {
          toast.success("Tạo địa điểm mới thành công");
          loadDestinations(currentPage);
          loadStats();
        } else {
          toast.error(response.message || "Không thể tạo địa điểm");
        }
      }
    } catch (error) {
      console.error("Save destination error:", error);
      toast.error("Có lỗi xảy ra khi lưu thông tin");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Quản lý địa điểm
          </h2>
          <p className="text-muted-foreground">
            Quản lý các địa điểm du lịch trong hệ thống
          </p>
        </div>
        <Button onClick={handleAddDestination}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm địa điểm
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng địa điểm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : totalDestinations}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Địa điểm phổ biến
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : popularDestinationsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách địa điểm</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc địa điểm theo các tiêu chí khác nhau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên địa điểm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vùng miền" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vùng</SelectItem>
                <SelectItem value="Miền Bắc">Miền Bắc</SelectItem>
                <SelectItem value="Miền Trung">Miền Trung</SelectItem>
                <SelectItem value="Miền Nam">Miền Nam</SelectItem>
                <SelectItem value="Tây Nguyên">Tây Nguyên</SelectItem>
              </SelectContent>
            </Select>
            <Select value={popularFilter} onValueChange={setPopularFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Độ phổ biến" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Phổ biến</SelectItem>
                <SelectItem value="false">Không phổ biến</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Destinations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Vùng miền</TableHead>
                  <TableHead>Phổ biến</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {destinations.map((destination: Destination) => (
                  <TableRow key={destination.id}>
                    <TableCell className="font-mono text-sm">
                      {destination.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 rounded-md">
                          <AvatarImage
                            src={destination.image}
                            alt={destination.name}
                          />
                          <AvatarFallback className="rounded-md">
                            <MapPin className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{destination.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {destination.slug}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          regionColors[destination.region as DestinationRegion]
                        }
                      >
                        {regionLabels[destination.region as DestinationRegion]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {destination.popular ? (
                        <Badge variant="default" className="bg-yellow-500">
                          <Star className="mr-1 h-3 w-3" />
                          Phổ biến
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Bình thường</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate text-sm">
                        {destination.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(destination.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(destination.updatedAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Mở menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEditDestination(destination)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              handleDestinationAction("delete", destination.id)
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {destinations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Không tìm thấy địa điểm nào
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {destinations.length} trên tổng số {filteredTotal} địa
                điểm
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Trước
                </Button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
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
                        onClick={() => handlePageChange(pageNum)}
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
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Destination Modal */}
      <DestinationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        destination={editingDestination}
        onSave={handleSaveDestination}
      />
    </div>
  );
}
