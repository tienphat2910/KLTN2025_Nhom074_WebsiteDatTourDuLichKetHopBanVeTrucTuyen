"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
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
import { UserModal } from "./UserModal";
import { User, UserFormData, UserRole, UserStatus } from "@/types/user";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";

// Mock data for users
const mockUsers: User[] = [
  {
    id: "1",
    name: "Nguyễn Văn An",
    email: "nguyenvanan@email.com",
    phone: "0123456789",
    avatar: "",
    role: "user",
    status: "active",
    createdAt: "2024-01-15",
    lastLogin: "2024-10-12",
    totalBookings: 5,
    totalSpent: 2500000
  },
  {
    id: "2",
    name: "Trần Thị Bình",
    email: "tranthibibinh@email.com",
    phone: "0987654321",
    avatar: "",
    role: "user",
    status: "active",
    createdAt: "2024-02-20",
    lastLogin: "2024-10-11",
    totalBookings: 12,
    totalSpent: 5800000
  },
  {
    id: "3",
    name: "Lê Văn Cường",
    email: "levancuong@email.com",
    phone: "0369852147",
    avatar: "",
    role: "user",
    status: "banned",
    createdAt: "2024-03-10",
    lastLogin: "2024-09-28",
    totalBookings: 2,
    totalSpent: 800000
  },
  {
    id: "4",
    name: "Phạm Thị Dung",
    email: "phamthidung@email.com",
    phone: "0258741369",
    avatar: "",
    role: "user",
    status: "inactive",
    createdAt: "2024-01-05",
    lastLogin: "2024-08-15",
    totalBookings: 8,
    totalSpent: 3200000
  },
  {
    id: "5",
    name: "Hoàng Văn Em",
    email: "hoangvanem@email.com",
    phone: "0147258369",
    avatar: "",
    role: "admin",
    status: "active",
    createdAt: "2023-12-01",
    lastLogin: "2024-10-12",
    totalBookings: 0,
    totalSpent: 0
  }
];

const statusColors: Record<
  UserStatus,
  "default" | "secondary" | "destructive"
> = {
  active: "default",
  inactive: "secondary",
  banned: "destructive"
};

const statusLabels: Record<UserStatus, string> = {
  active: "Hoạt động",
  inactive: "Không hoạt động",
  banned: "Bị cấm"
};

const roleLabels: Record<UserRole, string> = {
  user: "Người dùng",
  admin: "Quản trị viên"
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { socketService } = useSocket();

  // Load users data
  const loadUsers = async (page = 1, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await userService.getUsers({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        role: roleFilter !== "all" ? roleFilter : undefined
      });

      if (response.success && response.data) {
        // Transform API data to match component interface
        const transformedUsers: User[] = response.data.users.map(
          (user: any) => ({
            id: user._id,
            name: user.fullName,
            email: user.email,
            phone: user.phone || "",
            avatar: user.avatar || "",
            role: user.role,
            status: user.status,
            createdAt: new Date(user.createdAt).toISOString().split("T")[0],
            lastLogin: user.lastLogin
              ? new Date(user.lastLogin).toISOString().split("T")[0]
              : "",
            totalBookings: user.totalBookings || 0,
            totalSpent: user.totalSpent || 0
          })
        );

        setUsers(transformedUsers);
        setCurrentPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.pages);
        setTotalUsers(response.data.pagination.total);
      } else {
        setError(response.message || "Không thể tải danh sách người dùng");
        setUsers([]);
      }
    } catch (error) {
      console.error("Load users error:", error);
      setError("Có lỗi xảy ra khi tải dữ liệu");
      setUsers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load user statistics
  const loadStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingStats(true);
      }
      const response = await userService.getUserStats();

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        console.error("Failed to load stats:", response.message);
      }
    } catch (error) {
      console.error("Load stats error:", error);
    } finally {
      setIsLoadingStats(false);
      setIsRefreshing(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadUsers(1);
  }, [searchTerm, statusFilter, roleFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  // Set up socket connection and real-time updates
  useEffect(() => {
    // Set up socket connection status
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    socketService.on("connected", handleConnected);
    socketService.on("disconnected", handleDisconnected);

    // Set initial connection status
    setIsConnected(socketService.isConnected());

    // Set up real-time updates for user management
    const handleUserRegistered = (data: any) => {
      // Refresh user list and stats when new user registers
      loadUsers(currentPage, true);
      loadStats(true);
      // Show notification
      toast.success("Người dùng mới đăng ký!", {
        description: `${
          data?.user?.fullName || "Người dùng mới"
        } đã tạo tài khoản`,
        duration: 5000,
        action: {
          label: "Xem",
          onClick: () => {
            // Scroll to the new user or refresh the list
            loadUsers(1, true);
          }
        }
      });
    };

    const handleUserStatusChanged = (data: any) => {
      // Refresh user list and stats when user status changes
      loadUsers(currentPage, true);
      loadStats(true);
      // Show notification
      const statusText =
        data.newStatus === "banned"
          ? "bị cấm"
          : data.newStatus === "active"
          ? "được kích hoạt"
          : "bị vô hiệu hóa";
      toast.info("Trạng thái người dùng thay đổi", {
        description: `Người dùng ${data.userId} đã ${statusText}`,
        duration: 4000
      });
    };

    const handleUserDeleted = (data: any) => {
      // Refresh user list and stats when user is deleted
      loadUsers(currentPage, true);
      loadStats(true);
      // Show notification
      toast.warning("Người dùng đã bị xóa", {
        description: `Tài khoản người dùng ${data.userId} đã được xóa khỏi hệ thống`,
        duration: 4000
      });
    };

    const handleUserUpdated = (data: any) => {
      // Refresh user list when user is updated
      loadUsers(currentPage, true);
      // Show notification
      toast.info("Thông tin người dùng đã được cập nhật", {
        description: `Thông tin của ${
          data?.user?.fullName || "người dùng"
        } đã thay đổi`,
        duration: 3000
      });
    };

    socketService.on("user_registered", handleUserRegistered);
    socketService.on("user_status_changed", handleUserStatusChanged);
    socketService.on("user_deleted", handleUserDeleted);
    socketService.on("user_updated", handleUserUpdated);

    // Cleanup listeners
    return () => {
      socketService.off("connected", handleConnected);
      socketService.off("disconnected", handleDisconnected);
      socketService.off("user_registered", handleUserRegistered);
      socketService.off("user_status_changed", handleUserStatusChanged);
      socketService.off("user_deleted", handleUserDeleted);
      socketService.off("user_updated", handleUserUpdated);
    };
  }, [currentPage]);

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadUsers(page);
  };

  const handleUserAction = async (action: string, userId: string) => {
    try {
      let response;

      switch (action) {
        case "ban":
          response = await userService.banUser(userId);
          if (response.success) {
            toast.success("Đã cấm người dùng thành công");
            loadUsers(currentPage, true);
            loadStats(true);
          } else {
            toast.error(response.message || "Không thể cấm người dùng");
          }
          break;
        case "unban":
          response = await userService.unbanUser(userId);
          if (response.success) {
            toast.success("Đã bỏ cấm người dùng thành công");
            loadUsers(currentPage, true);
            loadStats(true);
          } else {
            toast.error(response.message || "Không thể bỏ cấm người dùng");
          }
          break;
        case "delete":
          // Find the user to check their role
          const userToDelete = users.find((u) => u.id === userId);
          if (!userToDelete) {
            toast.error("Không tìm thấy người dùng");
            return;
          }

          // Prevent deleting admin accounts or self
          const currentUser = JSON.parse(
            localStorage.getItem("lutrip_admin_user") || "{}"
          );
          if (userToDelete.role === "admin") {
            toast.error("Không thể xóa tài khoản quản trị viên");
            return;
          }
          if (currentUser._id === userId) {
            toast.error("Không thể xóa tài khoản của chính mình");
            return;
          }

          // Show confirmation dialog
          if (
            window.confirm(
              "Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác."
            )
          ) {
            response = await userService.deleteUser(userId);
            if (response.success) {
              toast.success("Đã xóa người dùng thành công");
              loadUsers(currentPage, true);
              loadStats(true);
            } else {
              toast.error(response.message || "Không thể xóa người dùng");
            }
          }
          break;
      }
    } catch (error) {
      console.error("User action error:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData: UserFormData) => {
    try {
      if (editingUser) {
        // Update existing user
        const response = await userService.updateUser(editingUser.id, userData);
        if (response.success) {
          toast.success("Cập nhật người dùng thành công");
          loadUsers(currentPage, true);
          loadStats(true);
        } else {
          toast.error(response.message || "Không thể cập nhật người dùng");
        }
      } else {
        // For now, we'll show a message that adding users should be done through registration
        toast.info("Vui lòng hướng dẫn người dùng đăng ký tài khoản mới");
      }
    } catch (error) {
      console.error("Save user error:", error);
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
              Quản lý người dùng
            </h2>
            <p className="text-muted-foreground">
              Quản lý tài khoản và quyền hạn người dùng trong hệ thống
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
              loadUsers(currentPage, true);
              loadStats(true);
            }}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Button onClick={handleAddUser} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng người dùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats || isRefreshing ? "..." : stats.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats || isRefreshing ? "..." : stats.active || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bị cấm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats || isRefreshing ? "..." : stats.banned || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quản trị viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats || isRefreshing ? "..." : stats.admins || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc người dùng theo các tiêu chí khác nhau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="banned">Bị cấm</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="user">Người dùng</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">STT</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Liên hệ
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Vai trò
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Trạng thái
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Thống kê
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Ngày tạo
                    </TableHead>
                    <TableHead className="hidden 2xl:table-cell">
                      Lần cuối online
                    </TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading || isRefreshing ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          {isRefreshing ? "Đang cập nhật..." : "Đang tải..."}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <AlertCircle className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {error || "Không tìm thấy người dùng nào"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: User, index: number) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {(currentPage - 1) * 10 + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {user.name}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </div>
                              <div className="text-xs text-muted-foreground sm:hidden">
                                {user.phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="mr-1 h-3 w-3" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="mr-1 h-3 w-3" />
                              {user.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                          >
                            {roleLabels[user.role as UserRole]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            variant={statusColors[user.status as UserStatus]}
                          >
                            {statusLabels[user.status as UserStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="space-y-1">
                            <div className="text-sm">
                              {user.totalBookings} đặt chỗ
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(user.totalSpent)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(user.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden 2xl:table-cell">
                          <div className="text-sm">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "Chưa đăng nhập"}
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
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "banned" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction("unban", user.id)
                                  }
                                  className="text-green-600"
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Bỏ cấm
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction("ban", user.id)
                                  }
                                  className="text-orange-600"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Cấm người dùng
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUserAction("delete", user.id)
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Hiển thị {users.length} trong tổng số {totalUsers} người dùng
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Trang</p>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const pageNumber =
                            Math.max(
                              1,
                              Math.min(totalPages - 4, currentPage - 2)
                            ) + i;
                          if (pageNumber > totalPages) return null;
                          return (
                            <Button
                              key={pageNumber}
                              variant={
                                currentPage === pageNumber
                                  ? "default"
                                  : "outline"
                              }
                              className="h-8 w-8 p-0"
                              onClick={() => handlePageChange(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {isLoading || isRefreshing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                {isRefreshing ? "Đang cập nhật..." : "Đang tải..."}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {error || "Không tìm thấy người dùng nào"}
                  </p>
                </div>
              </div>
            ) : (
              users.map((user: User) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.phone}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Mở menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1">
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {roleLabels[user.role as UserRole]}
                          </Badge>
                          <Badge
                            variant={statusColors[user.status as UserStatus]}
                            className="text-xs ml-2"
                          >
                            {statusLabels[user.status as UserStatus]}
                          </Badge>
                        </div>
                        <DropdownMenuSeparator />
                        {user.status === "banned" ? (
                          <DropdownMenuItem
                            onClick={() => handleUserAction("unban", user.id)}
                            className="text-green-600"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Bỏ cấm
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleUserAction("ban", user.id)}
                            className="text-orange-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Cấm người dùng
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleUserAction("delete", user.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Đặt chỗ:</span>
                        <span className="ml-1 font-medium">
                          {user.totalBookings}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Chi tiêu:</span>
                        <span className="ml-1 font-medium">
                          {formatCurrency(user.totalSpent)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ngày tạo:</span>
                        <span className="ml-1">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lần cuối:</span>
                        <span className="ml-1">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString(
                                "vi-VN"
                              )
                            : "Chưa đăng nhập"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Modal */}
      <UserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  );
}
