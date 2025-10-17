"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  DollarSign,
  MapPin,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Image as ImageIcon
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
import { Activity } from "@/types/activity";
import { activityService, ActivitiesResponse } from "@/services/activityService";
import { ActivityModal } from "./ActivityModal";
import { toast } from "sonner";

export function ActivityManagement() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [popularFilter, setPopularFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load activities data
  const loadActivities = async (page = 1, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await activityService.getActivities({
        page,
        limit: 10,
        search: searchTerm || undefined,
        popular: popularFilter === "all" ? undefined : popularFilter === "popular"
      });

      if (response.success && response.data) {
        setActivities(response.data.activities || []);
        setCurrentPage(response.data.pagination?.currentPage || 1);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalActivities(response.data.pagination?.totalActivities || 0);
      } else {
        setError(response.message || "Không thể tải danh sách hoạt động");
        setActivities([]);
      }
    } catch (error) {
      console.error("Load activities error:", error);
      setError("Có lỗi xảy ra khi tải dữ liệu");
      setActivities([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadActivities(1);
  }, [searchTerm, popularFilter]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadActivities(page);
  };

  const handleActivityAction = async (action: string, activityId: string) => {
    try {
      let response;

      switch (action) {
        case "toggle-popular":
          const activity = activities.find((a) => a._id === activityId);
          if (activity) {
            response = await activityService.togglePopular(
              activityId,
              !activity.popular
            );
            if (response.success) {
              toast.success(
                activity.popular
                  ? "Đã bỏ đánh dấu nổi bật"
                  : "Đã đánh dấu nổi bật"
              );
              loadActivities(currentPage, true);
            } else {
              toast.error(
                response.message || "Không thể cập nhật trạng thái nổi bật"
              );
            }
          }
          break;
        case "delete":
          if (window.confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) {
            response = await activityService.deleteActivity(activityId);
            if (response.success) {
              toast.success("Đã xóa hoạt động thành công");
              loadActivities(currentPage, true);
            } else {
              toast.error(response.message || "Không thể xóa hoạt động");
            }
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Activity action error:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setIsModalOpen(true);
  };

  const handleAddActivity = () => {
    setEditingActivity(null);
    setIsModalOpen(true);
  };

  const handleSaveActivity = async (activityData: Partial<Activity>) => {
    try {
      if (editingActivity) {
        const response = await activityService.updateActivity(
          editingActivity._id,
          activityData
        );
        if (response.success) {
          toast.success("Cập nhật hoạt động thành công");
          loadActivities(currentPage, true);
        } else {
          toast.error(response.message || "Không thể cập nhật hoạt động");
        }
      } else {
        const response = await activityService.createActivity(activityData);
        if (response.success) {
          toast.success("Tạo hoạt động mới thành công");
          loadActivities(currentPage, true);
        } else {
          toast.error(response.message || "Không thể tạo hoạt động");
        }
      }
    } catch (error) {
      console.error("Save activity error:", error);
      toast.error("Có lỗi xảy ra khi lưu thông tin");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Quản lý hoạt động
            </h2>
            <p className="text-muted-foreground">
              Tạo và quản lý các hoạt động vui chơi
            </p>
          </div>
          {isRefreshing && (
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadActivities(currentPage, true);
            }}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Button onClick={handleAddActivity}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo hoạt động mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng hoạt động
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || isRefreshing ? "..." : totalActivities}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hoạt động nổi bật
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || isRefreshing
                ? "..."
                : activities.filter((a) => a.popular).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Có hình ảnh
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || isRefreshing
                ? "..."
                : activities.filter((a) => a.gallery && a.gallery.length > 0)
                    .length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Giá trung bình
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || isRefreshing
                ? "..."
                : activities.length > 0
                ? formatCurrency(
                    Math.round(
                      activities.reduce(
                        (sum, a) => sum + (a.price?.retail?.adult || 0),
                        0
                      ) / activities.length
                    )
                  )
                : "0đ"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hoạt động</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc hoạt động theo các tiêu chí khác nhau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc địa điểm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={popularFilter} onValueChange={setPopularFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Nổi bật" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="popular">Nổi bật</SelectItem>
                <SelectItem value="not-popular">Không nổi bật</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activities Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Hoạt động</TableHead>
                  <TableHead className="min-w-[150px]">Địa điểm</TableHead>
                  <TableHead className="min-w-[120px]">Giá vé</TableHead>
                  <TableHead className="min-w-[150px]">Giờ hoạt động</TableHead>
                  <TableHead className="min-w-[100px]">Trạng thái</TableHead>
                  <TableHead className="text-right min-w-[80px]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isRefreshing ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-muted-foreground">
                        {isRefreshing ? "Đang cập nhật..." : "Đang tải..."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        Không tìm thấy hoạt động nào
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((activity) => (
                    <TableRow key={activity._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {activity.name}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {activity.description}
                          </div>
                          {activity.popular && (
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
                            {activity.location?.name || "Chưa cập nhật"}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {activity.location?.address || ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            NL: {formatCurrency(activity.price?.retail?.adult || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            TE: {formatCurrency(activity.price?.retail?.child || 0)}
                          </div>
                          {activity.price?.retail?.senior !== undefined &&
                            activity.price?.retail?.senior > 0 && (
                              <div className="text-xs text-muted-foreground">
                                NCT:{" "}
                                {formatCurrency(activity.price.retail.senior)}
                              </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            T2-T7
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.operating_hours?.mon_to_sat || "Chưa cập nhật"}
                          </div>
                          {activity.operating_hours?.sunday_holidays && (
                            <div className="text-xs text-muted-foreground">
                              CN: {activity.operating_hours.sunday_holidays}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {activity.popular ? (
                            <Badge variant="default">Nổi bật</Badge>
                          ) : (
                            <Badge variant="secondary">Thường</Badge>
                          )}
                          {activity.gallery && activity.gallery.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {activity.gallery.length} ảnh
                            </div>
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
                              onClick={() => handleEditActivity(activity)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleActivityAction(
                                  "toggle-popular",
                                  activity._id
                                )
                              }
                            >
                              <Star className="mr-2 h-4 w-4" />
                              {activity.popular
                                ? "Bỏ nổi bật"
                                : "Đánh dấu nổi bật"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleActivityAction("delete", activity._id)
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa hoạt động
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
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 space-y-2 sm:space-y-0">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalActivities)} trên tổng số{" "}
                {totalActivities} hoạt động
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

      {/* Activity Modal */}
      <ActivityModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        activity={editingActivity}
        onSave={handleSaveActivity}
      />
    </div>
  );
}
