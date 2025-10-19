"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw
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
import { Tour, ToursResponse } from "@/services/tourService";
import { TourModal } from "@/components/Admin/TourModal";
import { AddTourModal } from "@/components/Admin/AddTourModal";
import { tourService } from "@/services/tourService";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";

export function TourManagement() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [totalTours, setTotalTours] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { socketService } = useSocket();

  // Load tours data
  const loadTours = async (page = 1, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await tourService.getTours({
        page,
        limit: 10, // Load 10 tours per page
        title: searchTerm || undefined
        // Note: Regular API doesn't support isActive/isFeatured filters directly
        // We'll filter on the client side for now
      });

      if (response.success && response.data) {
        let tours = response.data.tours;

        // Apply client-side filtering for admin features
        if (activeFilter !== "all") {
          if (activeFilter === "active") {
            // Show tours that are available for booking (not expired, not full, regardless of isActive)
            tours = tours.filter((tour) => {
              const status = getTourStatus(tour);
              return status !== "expired" && status !== "full";
            });
          } else if (activeFilter === "inactive") {
            // Show tours that are manually deactivated
            tours = tours.filter((tour) => tour.isActive === false);
          }
        }

        if (featuredFilter !== "all") {
          const isFeatured = featuredFilter === "featured";
          tours = tours.filter((tour) => tour.isFeatured === isFeatured);
        }

        setTours(tours);
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setTotalTours(response.data.pagination.totalTours);
      } else {
        setError(response.message || "Không thể tải danh sách tour");
        setTours([]);
      }
    } catch (error) {
      console.error("Load tours error:", error);
      setError("Có lỗi xảy ra khi tải dữ liệu");
      setTours([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadTours(1);
  }, [searchTerm, activeFilter, featuredFilter]);

  // Set up socket connection and real-time updates
  useEffect(() => {
    // Set up socket connection status
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    socketService.on("connected", handleConnected);
    socketService.on("disconnected", handleDisconnected);

    // Set initial connection status
    setIsConnected(socketService.isConnected());

    // Set up real-time updates for tour management
    const handleTourCreated = (data: any) => {
      // Refresh tour list when new tour is created
      loadTours(currentPage, true);
      // Show notification
      toast.success("Tour mới được tạo!", {
        description: `${
          data?.tour?.title || "Tour mới"
        } đã được thêm vào hệ thống`,
        duration: 5000,
        action: {
          label: "Xem",
          onClick: () => {
            // Scroll to the new tour or refresh the list
            loadTours(1, true);
          }
        }
      });
    };

    const handleTourUpdated = (data: any) => {
      // Refresh tour list when tour is updated
      loadTours(currentPage, true);
      // Show notification
      toast.info("Tour đã được cập nhật", {
        description: `Thông tin của ${data?.tour?.title || "tour"} đã thay đổi`,
        duration: 3000
      });
    };

    const handleTourDeleted = (data: any) => {
      // Refresh tour list when tour is deleted
      loadTours(currentPage, true);
      // Show notification
      toast.warning("Tour đã bị ẩn", {
        description: `Tour ${data.tourId} đã được ẩn khỏi hệ thống`,
        duration: 4000
      });
    };

    socketService.on("tour_created", handleTourCreated);
    socketService.on("tour_updated", handleTourUpdated);
    socketService.on("tour_deleted", handleTourDeleted);

    // Cleanup listeners
    return () => {
      socketService.off("connected", handleConnected);
      socketService.off("disconnected", handleDisconnected);
      socketService.off("tour_created", handleTourCreated);
      socketService.off("tour_updated", handleTourUpdated);
      socketService.off("tour_deleted", handleTourDeleted);
    };
  }, [currentPage]);

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    // loadTours will be triggered by useEffect
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadTours(page);
  };

  // Helper function to get tour status
  const getTourStatus = (tour: Tour) => {
    const now = new Date();
    const startDate = new Date(tour.startDate);
    const endDate = new Date(tour.endDate);

    // Check if tour is manually deactivated
    if (tour.isActive === false) return "inactive";

    // Check if tour is full
    if (tour.availableSeats === 0) return "full";

    // Check tour timeline
    if (now > endDate) return "expired"; // Tour has ended
    if (now >= startDate && now <= endDate) return "ongoing"; // Tour is currently running
    if (now < startDate) return "upcoming"; // Tour hasn't started yet

    // Default active status
    return "active";
  };

  // Filter tours based on search and filters
  // Note: Filtering is done on the server side via API

  const handleTourAction = async (action: string, tourId: string) => {
    try {
      let response;

      switch (action) {
        case "toggle-active":
          const tour = tours.find((t) => t._id === tourId);
          if (tour) {
            response = await tourService.updateTour(tourId, {
              isActive: !tour.isActive
            });
            if (response.success) {
              toast.success(
                tour.isActive
                  ? "Đã ẩn tour thành công"
                  : "Đã hiện tour thành công"
              );
              loadTours(currentPage, true);
            } else {
              toast.error(
                response.message || "Không thể cập nhật trạng thái tour"
              );
            }
          }
          break;
        case "toggle-featured":
          const featuredTour = tours.find((t) => t._id === tourId);
          if (featuredTour) {
            response = await tourService.updateTour(tourId, {
              isFeatured: !featuredTour.isFeatured
            });
            if (response.success) {
              toast.success(
                featuredTour.isFeatured
                  ? "Đã bỏ đánh dấu nổi bật"
                  : "Đã đánh dấu nổi bật"
              );
              loadTours(currentPage, true);
            } else {
              toast.error(
                response.message || "Không thể cập nhật trạng thái nổi bật"
              );
            }
          }
          break;
        case "delete":
          // Show confirmation dialog
          if (window.confirm("Bạn có chắc chắn muốn ẩn tour này?")) {
            response = await tourService.updateTour(tourId, {
              isActive: false
            });
            if (response.success) {
              toast.success("Đã ẩn tour thành công");
              loadTours(currentPage, true);
            } else {
              toast.error(response.message || "Không thể ẩn tour");
            }
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Tour action error:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour);
    setIsModalOpen(true);
  };

  const handleAddTour = () => {
    setEditingTour(null);
    setIsAddModalOpen(true);
  };

  const handleSaveTour = async (tourData: Partial<Tour>) => {
    try {
      if (editingTour) {
        // Update existing tour
        const response = await tourService.updateTour(
          editingTour._id,
          tourData
        );
        if (response.success) {
          toast.success("Cập nhật tour thành công");
          loadTours(currentPage, true);
        } else {
          toast.error(response.message || "Không thể cập nhật tour");
        }
      } else {
        // Create new tour
        const response = await tourService.createTour(tourData);
        if (response.success) {
          toast.success("Tạo tour mới thành công");
          loadTours(currentPage, true);
        } else {
          toast.error(response.message || "Không thể tạo tour");
        }
      }
    } catch (error) {
      console.error("Save tour error:", error);
      toast.error("Có lỗi xảy ra khi lưu thông tin");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (tour: Tour) => {
    const status = getTourStatus(tour);

    switch (status) {
      case "active":
        return <Badge variant="default">Đang hoạt động</Badge>;
      case "inactive":
        return <Badge variant="secondary">Đã ẩn</Badge>;
      case "full":
        return <Badge variant="destructive">Hết chỗ</Badge>;
      case "ongoing":
        return <Badge variant="outline">Đang diễn ra</Badge>;
      case "upcoming":
        return <Badge variant="secondary">Sắp diễn ra</Badge>;
      case "expired":
        return <Badge variant="destructive">Đã kết thúc</Badge>;
      default:
        return <Badge variant="secondary">Không hoạt động</Badge>;
    }
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Số ngày = diffDays + 1 (vì tính cả ngày bắt đầu và ngày kết thúc)
    const totalDays = diffDays + 1;
    const nights = diffDays;
    return `${totalDays}N${nights}Đ`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Quản lý tour</h2>
            <p className="text-muted-foreground">
              Tạo và quản lý các tour du lịch
            </p>
          </div>
          {isRefreshing && (
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Real-time" : "Offline"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadTours(currentPage, true);
            }}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Button onClick={handleAddTour}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo tour mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng tour</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || isRefreshing ? "..." : totalTours}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang hoạt động
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || isRefreshing
                ? "..."
                : tours.filter((t) => {
                    const status = getTourStatus(t);
                    return (
                      status !== "expired" &&
                      status !== "full" &&
                      status !== "inactive"
                    );
                  }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tour nổi bật</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || isRefreshing
                ? "..."
                : tours.filter((t) => t.isFeatured).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chỗ ngồi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || isRefreshing
                ? "..."
                : tours.reduce((total, t) => total + t.seats, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách tour</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc tour theo các tiêu chí khác nhau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên tour hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái hoạt động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Có thể đặt</SelectItem>
                <SelectItem value="inactive">Đã ẩn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Nổi bật" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="featured">Nổi bật</SelectItem>
                <SelectItem value="not-featured">Không nổi bật</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tours Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">STT</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Giá & Chỗ ngồi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isRefreshing ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-muted-foreground">
                        {isRefreshing ? "Đang cập nhật..." : "Đang tải..."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : tours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        Không tìm thấy tour nào
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  tours.map((tour, index) => (
                    <TableRow key={tour._id}>
                      <TableCell className="font-medium">
                        {(currentPage - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {tour.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tour.slug}
                          </div>
                          {tour.isFeatured && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Nổi bật
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <MapPin className="mr-1 h-3 w-3" />
                            {(tour as any).destinationId?.name ||
                              tour.departureLocation.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Khởi hành: {tour.departureLocation.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-3 w-3" />
                            {formatDate(tour.startDate)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tour.duration ||
                              getDuration(tour.startDate, tour.endDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {formatCurrency(tour.price)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tour.availableSeats}/{tour.seats} chỗ
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tour)}</TableCell>
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
                              onClick={() => handleEditTour(tour)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleTourAction("toggle-active", tour._id)
                              }
                            >
                              {tour.isActive !== false ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Ẩn tour
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Hiện tour
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleTourAction("toggle-featured", tour._id)
                              }
                            >
                              <Star className="mr-2 h-4 w-4" />
                              {tour.isFeatured
                                ? "Bỏ nổi bật"
                                : "Đánh dấu nổi bật"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleTourAction("delete", tour._id)
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Ẩn tour
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && !isLoading && !isRefreshing && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalTours)} trên tổng số{" "}
                {totalTours} tour
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

      {/* Tour Modal */}
      <TourModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        tour={editingTour}
        onSave={handleSaveTour}
      />

      {/* Add Tour Modal */}
      <AddTourModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleSaveTour}
      />
    </div>
  );
}
