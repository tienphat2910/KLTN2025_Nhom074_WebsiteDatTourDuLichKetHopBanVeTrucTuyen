"use client";

import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  Ticket
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import { tourService } from "@/services/tourService";
import { useSocket } from "@/hooks/useSocket";
import { RecentActivities } from "./RecentActivities";
import analyticsService from "@/services/analyticsService";
import Link from "next/link";
import { toast } from "sonner";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend?: {
    value: string;
    isPositive: boolean;
    isPercentage?: boolean;
  };
  bgColor?: string;
  iconColor?: string;
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  bgColor = "bg-blue-500",
  iconColor = "text-blue-500"
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
              {trend && (
                <div
                  className={`flex items-center text-sm font-medium ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend.isPositive ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  <span>{trend.value}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [userGrowth, setUserGrowth] = useState<{
    value: string;
    isPositive: boolean;
    isPercentage?: boolean;
  } | null>(null);
  const [tourStats, setTourStats] = useState<any>(null);
  const [isLoadingTourStats, setIsLoadingTourStats] = useState(true);
  const [tourGrowth, setTourGrowth] = useState<{
    value: string;
    isPositive: boolean;
    isPercentage?: boolean;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { socketService } = useSocket();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // Load user statistics
  const loadUserStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingStats(true);
      }
      const response = await userService.getUsers({ limit: 1000 }); // Get all users for stats

      if (response.success && response.data) {
        const users = response.data.users;

        // Calculate basic stats
        const stats = {
          total: users.length,
          active: users.filter((u: any) => u.status === "active").length,
          inactive: users.filter((u: any) => u.status === "inactive").length,
          banned: users.filter((u: any) => u.status === "banned").length,
          admins: users.filter((u: any) => u.role === "admin").length,
          totalBookings: users.reduce(
            (sum: number, u: any) => sum + u.totalBookings,
            0
          ),
          totalSpent: users.reduce(
            (sum: number, u: any) => sum + u.totalSpent,
            0
          )
        };

        // Calculate monthly growth
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthUsers = users.filter((u: any) => {
          const createdAt = new Date(u.createdAt);
          return createdAt >= currentMonth;
        }).length;

        const lastMonthUsers = users.filter((u: any) => {
          const createdAt = new Date(u.createdAt);
          return createdAt >= lastMonth && createdAt <= lastMonthEnd;
        }).length;

        // Calculate growth percentage
        let growthValue = "0%";
        let isPositive = true;
        let isPercentage = true;

        if (lastMonthUsers > 0) {
          const growth =
            ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;
          const roundedGrowth = Math.round(Math.abs(growth) * 10) / 10; // Round to 1 decimal place
          growthValue = `${growth >= 0 ? "+" : "-"}${roundedGrowth}%`;
          isPositive = growth >= 0;
        } else if (currentMonthUsers > 0) {
          // If no users last month but some this month, show the number of new users
          growthValue = `+${currentMonthUsers}`;
          isPositive = true;
          isPercentage = false;
        }

        setUserStats(stats);
        setUserGrowth({ value: growthValue, isPositive, isPercentage });
      } else {
        console.error("Failed to load user stats:", response.message);
        // Set default values if API fails
        setUserStats({
          total: 0,
          active: 0,
          inactive: 0,
          banned: 0,
          admins: 0,
          totalBookings: 0,
          totalSpent: 0
        });
        setUserGrowth({ value: "0%", isPositive: true, isPercentage: true });
      }
    } catch (error) {
      console.error("Load user stats error:", error);
      setUserStats({
        total: 0,
        active: 0,
        inactive: 0,
        banned: 0,
        admins: 0,
        totalBookings: 0,
        totalSpent: 0
      });
      setUserGrowth({ value: "0%", isPositive: true, isPercentage: true });
    } finally {
      setIsLoadingStats(false);
      setIsRefreshing(false);
    }
  };

  // Load tour statistics
  const loadTourStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingTourStats(true);
      }

      // Get all tours for stats calculation (limit 1000 should be sufficient)
      const response = await tourService.getTours({ limit: 1000 });

      if (response.success && response.data) {
        const tours = response.data.tours;

        // Calculate monthly growth
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthTours = tours.filter((tour: any) => {
          const createdAt = new Date(tour.createdAt);
          return createdAt >= currentMonth;
        }).length;

        const lastMonthTours = tours.filter((tour: any) => {
          const createdAt = new Date(tour.createdAt);
          return createdAt >= lastMonth && createdAt <= lastMonthEnd;
        }).length;

        // Calculate growth percentage
        let growthValue = "0%";
        let isPositive = true;
        let isPercentage = true;

        if (lastMonthTours > 0) {
          const growth =
            ((currentMonthTours - lastMonthTours) / lastMonthTours) * 100;
          const roundedGrowth = Math.round(Math.abs(growth) * 10) / 10; // Round to 1 decimal place
          growthValue = `${growth >= 0 ? "+" : "-"}${roundedGrowth}%`;
          isPositive = growth >= 0;
        } else if (currentMonthTours > 0) {
          // If no tours last month but some this month, show the number of new tours
          growthValue = `+${currentMonthTours}`;
          isPositive = true;
          isPercentage = false;
        }

        setTourStats({
          total: response.data.pagination.totalTours
        });
        setTourGrowth({ value: growthValue, isPositive, isPercentage });
      } else {
        console.error("Failed to load tour stats:", response.message);
        setTourStats({
          total: 0
        });
        setTourGrowth({ value: "0%", isPositive: true, isPercentage: true });
      }
    } catch (error) {
      console.error("Load tour stats error:", error);
      setTourStats({
        total: 0
      });
      setTourGrowth({ value: "0%", isPositive: true, isPercentage: true });
    } finally {
      setIsLoadingTourStats(false);
      setIsRefreshing(false);
    }
  };

  // Load analytics data
  const loadAnalyticsData = async () => {
    try {
      setIsLoadingAnalytics(true);
      const [overviewRes, revenueRes] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getRevenueTrends()
      ]);

      if (overviewRes) {
        setAnalyticsData(overviewRes);
      }

      if (revenueRes && Array.isArray(revenueRes)) {
        // Transform revenue data for line chart
        const chartData = [
          {
            id: "Doanh thu",
            color: "hsl(210, 70%, 50%)",
            data: revenueRes.map((item: any) => ({
              x: `Tháng ${item._id}`,
              y: item.revenue
            }))
          }
        ];
        setRevenueData(chartData);
      }
    } catch (error) {
      console.error("Load analytics error:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadUserStats();
    loadTourStats();
    loadAnalyticsData();

    // Set up socket connection status
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    socketService.on("connected", handleConnected);
    socketService.on("disconnected", handleDisconnected);

    // Set initial connection status
    setIsConnected(socketService.isConnected());

    // Set up real-time updates
    const handleUserRegistered = (data: any) => {
      // Refresh user stats and growth when new user registers
      loadUserStats(true);
      // Show notification
      toast.success("Người dùng mới đăng ký!", {
        description: `${
          data?.user?.fullName || "Người dùng mới"
        } đã tạo tài khoản`,
        duration: 5000,
        action: {
          label: "Xem",
          onClick: () => {
            // Could navigate to user management page
            window.location.href = "/admin/users";
          }
        }
      });
    };

    const handleUserStatusChanged = (data: any) => {
      // Refresh user stats when user status changes
      loadUserStats(true);
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

    const handleBookingCreated = (data: any) => {
      // Could refresh booking stats here if implemented
      toast.success("Đặt chỗ mới!", {
        description: `Đặt chỗ ${data?.booking?.type || "mới"} trị giá ${
          data?.booking?.totalPrice?.toLocaleString("vi-VN") || "N/A"
        } VND`,
        duration: 5000,
        action: {
          label: "Xem",
          onClick: () => {
            // Could navigate to bookings page
            console.log("Navigate to bookings");
          }
        }
      });
    };

    const handlePaymentCompleted = (data: any) => {
      // Could refresh payment stats here if implemented
      toast.success("Thanh toán hoàn tất!", {
        description: `Thanh toán ${
          data?.payment?.amount?.toLocaleString("vi-VN") || "N/A"
        } VND cho booking ${data?.payment?.bookingId || "N/A"}`,
        duration: 5000
      });
    };

    const handleTourCreated = (data: any) => {
      // Refresh tour stats when new tour is created
      loadTourStats(true);
      // Show notification
      toast.success("Tour mới được tạo!", {
        description: `${
          data?.tour?.title || "Tour mới"
        } đã được thêm vào hệ thống`,
        duration: 5000,
        action: {
          label: "Xem",
          onClick: () => {
            // Could navigate to tours management page
            console.log("Navigate to tours");
          }
        }
      });
    };

    socketService.on("user_registered", handleUserRegistered);
    socketService.on("user_status_changed", handleUserStatusChanged);
    socketService.on("booking_created", handleBookingCreated);
    socketService.on("payment_completed", handlePaymentCompleted);
    socketService.on("tour_created", handleTourCreated);

    // Cleanup listeners
    return () => {
      socketService.off("connected", handleConnected);
      socketService.off("disconnected", handleDisconnected);
      socketService.off("user_registered", handleUserRegistered);
      socketService.off("user_status_changed", handleUserStatusChanged);
      socketService.off("booking_created", handleBookingCreated);
      socketService.off("payment_completed", handlePaymentCompleted);
      socketService.off("tour_created", handleTourCreated);
    };
  }, []);
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Dashboard Tổng Quan
            </h2>
            {isRefreshing && (
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center space-x-4">
            <p className="text-muted-foreground">
              Theo dõi hiệu suất kinh doanh và các chỉ số quan trọng
            </p>
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
          </div>
        </div>
        <Button
          onClick={() => {
            loadUserStats(true);
            loadTourStats(true);
            loadAnalyticsData();
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng Doanh Thu"
          value={
            isLoadingAnalytics
              ? "..."
              : `${(analyticsData?.overview?.totalRevenue || 0).toLocaleString(
                  "vi-VN"
                )} ₫`
          }
          description="Tổng doanh thu từ tất cả dịch vụ"
          icon={DollarSign}
          bgColor="bg-green-500"
          iconColor="text-green-500"
        />
        <StatsCard
          title="Tổng Đặt Chỗ"
          value={
            isLoadingAnalytics
              ? "..."
              : (analyticsData?.overview?.totalBookings || 0).toLocaleString()
          }
          description="Số lượng đặt chỗ thành công"
          icon={Ticket}
          bgColor="bg-blue-500"
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Khách Hàng"
          value={
            isLoadingAnalytics
              ? "..."
              : (analyticsData?.overview?.totalCustomers || 0).toLocaleString()
          }
          description="Tổng số khách hàng đặt chỗ"
          icon={Users}
          bgColor="bg-purple-500"
          iconColor="text-purple-500"
          trend={
            userGrowth || { value: "0%", isPositive: true, isPercentage: true }
          }
        />
        <StatsCard
          title="Giá Trị Trung Bình"
          value={
            isLoadingAnalytics
              ? "..."
              : `${(
                  analyticsData?.overview?.averageOrderValue || 0
                ).toLocaleString("vi-VN")} ₫`
          }
          description="Giá trị đơn hàng trung bình"
          icon={TrendingUp}
          bgColor="bg-orange-500"
          iconColor="text-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Trend Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Xu Hướng Doanh Thu</CardTitle>
            <CardDescription>
              Biểu đồ doanh thu 12 tháng gần nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingAnalytics ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : revenueData.length > 0 ? (
                <ResponsiveLine
                  data={revenueData}
                  margin={{ top: 20, right: 20, bottom: 50, left: 80 }}
                  xScale={{ type: "point" }}
                  yScale={{
                    type: "linear",
                    min: "auto",
                    max: "auto",
                    stacked: false
                  }}
                  curve="monotoneX"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: "",
                    legendOffset: 36,
                    legendPosition: "middle"
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Doanh thu (₫)",
                    legendOffset: -70,
                    legendPosition: "middle",
                    format: (value) => `${(value / 1000000).toFixed(0)}M`
                  }}
                  enablePoints={true}
                  pointSize={8}
                  pointColor={{ theme: "background" }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: "serieColor" }}
                  enableArea={true}
                  areaOpacity={0.1}
                  useMesh={true}
                  colors={{ scheme: "category10" }}
                  tooltip={({ point }) => (
                    <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
                      <div className="text-sm font-medium">
                        {point.data.xFormatted}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Number(point.data.yFormatted).toLocaleString("vi-VN")}{" "}
                        ₫
                      </div>
                    </div>
                  )}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Service Type */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Doanh Thu Theo Loại Dịch Vụ</CardTitle>
            <CardDescription>Phân bổ doanh thu theo dịch vụ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingAnalytics ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : analyticsData?.revenueByType ? (
                <ResponsivePie
                  data={[
                    {
                      id: "Chuyến bay",
                      label: "Chuyến bay",
                      value: analyticsData.revenueByType.flights || 0,
                      color: "hsl(210, 70%, 50%)"
                    },
                    {
                      id: "Tour",
                      label: "Tour",
                      value: analyticsData.revenueByType.tours || 0,
                      color: "hsl(120, 70%, 50%)"
                    },
                    {
                      id: "Hoạt động",
                      label: "Hoạt động",
                      value: analyticsData.revenueByType.activities || 0,
                      color: "hsl(30, 70%, 50%)"
                    }
                  ]}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  innerRadius={0.6}
                  padAngle={2}
                  cornerRadius={4}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: "category10" }}
                  borderWidth={1}
                  borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: "color" }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor="#ffffff"
                  tooltip={({ datum }) => (
                    <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
                      <div className="text-sm font-medium">{datum.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {datum.value.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                  )}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Booking Status */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng Thái Đặt Chỗ</CardTitle>
            <CardDescription>Phân bổ theo trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData?.statusDistribution ? (
                Object.entries(analyticsData.statusDistribution).map(
                  ([status, count]: [string, any]) => {
                    const statusConfig: any = {
                      pending: { label: "Đang chờ", color: "bg-yellow-500" },
                      confirmed: { label: "Đã xác nhận", color: "bg-blue-500" },
                      completed: { label: "Hoàn thành", color: "bg-green-500" },
                      cancelled: { label: "Đã hủy", color: "bg-red-500" }
                    };
                    const config = statusConfig[status] || {
                      label: status,
                      color: "bg-gray-500"
                    };
                    const total = Object.values(
                      analyticsData.statusDistribution
                    ).reduce((sum: number, val: any) => sum + val, 0) as number;
                    const percentage =
                      total > 0 ? ((count / total) * 100).toFixed(1) : "0";

                    return (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${config.color}`}
                          />
                          <span className="text-sm font-medium">
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  }
                )
              ) : (
                <div className="text-center text-muted-foreground">
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Thống Kê Nhanh</CardTitle>
            <CardDescription>Các chỉ số quan trọng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Tổng Tour</span>
                </div>
                <span className="text-lg font-bold">
                  {isLoadingTourStats ? "..." : tourStats?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">
                    Người dùng hoạt động
                  </span>
                </div>
                <span className="text-lg font-bold">
                  {isLoadingStats ? "..." : userStats?.active || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Tỷ lệ hoàn thành</span>
                </div>
                <span className="text-lg font-bold">
                  {isLoadingAnalytics
                    ? "..."
                    : analyticsData?.statusDistribution
                    ? (() => {
                        const total = Object.values(
                          analyticsData.statusDistribution
                        ).reduce(
                          (sum: number, val: any) => sum + val,
                          0
                        ) as number;
                        const completed =
                          analyticsData.statusDistribution.completed || 0;
                        const rate = total > 0 ? (completed / total) * 100 : 0;
                        return `${rate.toFixed(1)}%`;
                      })()
                    : "0%"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium">Admin</span>
                </div>
                <span className="text-lg font-bold">
                  {isLoadingStats ? "..." : userStats?.admins || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <RecentActivities />
      </div>
    </div>
  );
}
