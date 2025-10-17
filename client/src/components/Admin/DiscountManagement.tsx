"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Percent,
  DollarSign,
  Tag,
  Clock,
  Users,
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
import { Discount, DiscountFormData, DiscountType } from "@/types/discount";
import { DiscountModal } from "./DiscountModal";
import { discountService } from "@/services/discountService";
import { toast } from "sonner";

const discountTypeLabels = {
  percentage: "Phần trăm",
  fixed: "Số tiền cố định"
};

export function DiscountManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [totalDiscounts, setTotalDiscounts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  // Load discounts data
  const loadDiscounts = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await discountService.getDiscounts({
        page,
        limit: 10, // Load 10 discounts per page
        search: searchTerm || undefined,
        discountType: typeFilter !== "all" ? typeFilter : undefined,
        isActive:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
            ? false
            : undefined
      });

      if (response.success && response.data) {
        // Transform API data to match component interface
        const transformedDiscounts: Discount[] = response.data.discounts.map(
          (discount: any) => ({
            ...discount,
            validFrom: new Date(discount.validFrom),
            validUntil: new Date(discount.validUntil)
          })
        );

        setDiscounts(transformedDiscounts);
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setTotalDiscounts(response.data.pagination.totalDiscounts);
      } else {
        setError(response.message || "Không thể tải danh sách mã giảm giá");
        setDiscounts([]);
      }
    } catch (error) {
      console.error("Load discounts error:", error);
      setError("Có lỗi xảy ra khi tải dữ liệu");
      setDiscounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadDiscounts(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    // loadDiscounts will be triggered by useEffect
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadDiscounts(page);
  };

  // Helper function to check if discount is active
  const isDiscountActive = (discount: Discount) => {
    const now = new Date();
    return now >= discount.validFrom && now <= discount.validUntil;
  };

  // Helper function to check if discount is expired
  const isDiscountExpired = (discount: Discount) => {
    const now = new Date();
    return now > discount.validUntil;
  };

  // Helper function to check if discount is upcoming
  const isDiscountUpcoming = (discount: Discount) => {
    const now = new Date();
    return now < discount.validFrom;
  };

  // Helper function to get discount status
  const getDiscountStatus = (discount: Discount) => {
    if (discount.usedCount >= discount.usageLimit) return "exhausted";
    if (isDiscountExpired(discount)) return "expired";
    if (isDiscountUpcoming(discount)) return "upcoming";
    if (isDiscountActive(discount)) return "active";
    return "inactive";
  };

  // Filter discounts based on search and filters
  // Note: Filtering is done on the server side via API

  const handleDiscountAction = async (action: string, discountId: string) => {
    try {
      let response;

      switch (action) {
        case "copy":
          navigator.clipboard.writeText(
            discounts.find((d) => d._id === discountId)?.code || ""
          );
          toast.success("Đã sao chép mã giảm giá");
          break;
        case "delete":
          // Show confirmation dialog
          if (window.confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) {
            response = await discountService.deleteDiscount(discountId);
            if (response.success) {
              toast.success("Đã xóa mã giảm giá thành công");
              loadDiscounts(currentPage);
            } else {
              toast.error(response.message || "Không thể xóa mã giảm giá");
            }
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Discount action error:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setIsModalOpen(true);
  };

  const handleAddDiscount = () => {
    setEditingDiscount(null);
    setIsModalOpen(true);
  };

  const handleSaveDiscount = async (discountData: DiscountFormData) => {
    try {
      if (editingDiscount) {
        // Update existing discount
        const response = await discountService.updateDiscount(
          editingDiscount._id,
          discountData
        );
        if (response.success) {
          toast.success("Cập nhật mã giảm giá thành công");
          loadDiscounts(currentPage);
        } else {
          toast.error(response.message || "Không thể cập nhật mã giảm giá");
        }
      } else {
        // Create new discount
        const response = await discountService.createDiscount(discountData);
        if (response.success) {
          toast.success("Tạo mã giảm giá mới thành công");
          loadDiscounts(currentPage);
        } else {
          toast.error(response.message || "Không thể tạo mã giảm giá");
        }
      }
    } catch (error) {
      console.error("Save discount error:", error);
      toast.error("Có lỗi xảy ra khi lưu thông tin");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (discount: Discount) => {
    const status = getDiscountStatus(discount);

    switch (status) {
      case "active":
        return <Badge variant="default">Đang hoạt động</Badge>;
      case "expired":
        return <Badge variant="destructive">Đã hết hạn</Badge>;
      case "upcoming":
        return <Badge variant="secondary">Sắp diễn ra</Badge>;
      case "exhausted":
        return <Badge variant="outline">Đã hết lượt</Badge>;
      default:
        return <Badge variant="secondary">Không hoạt động</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Quản lý mã giảm giá
          </h2>
          <p className="text-muted-foreground">
            Tạo và quản lý các mã giảm giá cho khách hàng
          </p>
        </div>
        <Button onClick={handleAddDiscount}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo mã giảm giá
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng mã giảm giá
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : totalDiscounts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang hoạt động
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "..."
                : discounts.filter((d) => getDiscountStatus(d) === "active")
                    .length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã sử dụng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "..."
                : discounts.reduce((total, d) => total + d.usedCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ sử dụng</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "..."
                : discounts.length > 0
                ? Math.round(
                    (discounts.reduce((total, d) => total + d.usedCount, 0) /
                      discounts.reduce((total, d) => total + d.usageLimit, 0)) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách mã giảm giá</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc mã giảm giá theo các tiêu chí khác nhau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại giảm giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="percentage">Phần trăm</SelectItem>
                <SelectItem value="fixed">Số tiền cố định</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
                <SelectItem value="expired">Đã hết hạn</SelectItem>
                <SelectItem value="exhausted">Đã hết lượt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discounts Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã giảm giá</TableHead>
                  <TableHead>Loại & Giá trị</TableHead>
                  <TableHead>Thời gian áp dụng</TableHead>
                  <TableHead>Sử dụng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-muted-foreground">Đang tải...</p>
                    </TableCell>
                  </TableRow>
                ) : discounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        Không tìm thấy mã giảm giá nào
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  discounts.map((discount) => (
                    <TableRow key={discount._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-mono font-medium text-sm bg-muted px-2 py-1 rounded inline-block">
                            {discount.code}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {discount.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {discount.discountType === "percentage" ? (
                            <Percent className="h-4 w-4 text-green-600" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-blue-600" />
                          )}
                          <div>
                            <div className="font-medium">
                              {discount.discountType === "percentage"
                                ? `${discount.value}%`
                                : formatCurrency(discount.value)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {discountTypeLabels[discount.discountType]}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-3 w-3" />
                            {formatDate(discount.validFrom)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            đến {formatDate(discount.validUntil)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {discount.usedCount} / {discount.usageLimit}
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  (discount.usedCount / discount.usageLimit) *
                                    100,
                                  100
                                )}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(discount)}</TableCell>
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
                              onClick={() => handleEditDiscount(discount)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDiscountAction("copy", discount._id)
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Sao chép mã
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleDiscountAction("delete", discount._id)
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa
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
          {totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(currentPage - 1) * 10 + 1}-
                {Math.min(currentPage * 10, totalDiscounts)} trên tổng số{" "}
                {totalDiscounts} mã giảm giá
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

      {/* Discount Modal */}
      <DiscountModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        discount={editingDiscount}
        onSave={handleSaveDiscount}
      />
    </div>
  );
}
