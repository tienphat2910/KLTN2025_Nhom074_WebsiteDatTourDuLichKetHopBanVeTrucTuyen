"use client";

import {
  Users,
  Package,
  Plane,
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
  ArrowUpRight,
  ArrowDownRight
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
import Link from "next/link";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {trend && (
            <div
              className={`flex items-center ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [tourStats, setTourStats] = useState<any>(null);
  const [isLoadingTourStats, setIsLoadingTourStats] = useState(true);

  // Load user statistics
  const loadUserStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await userService.getUserStats();

      if (response.success && response.data) {
        setUserStats(response.data);
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
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Load tour statistics
  const loadTourStats = async () => {
    try {
      setIsLoadingTourStats(true);
      // Get total tours count by fetching with limit 1 to get pagination info
      const response = await tourService.getTours({ limit: 1 });

      if (response.success && response.data) {
        setTourStats({
          total: response.data.pagination.totalTours
        });
      } else {
        console.error("Failed to load tour stats:", response.message);
        setTourStats({
          total: 0
        });
      }
    } catch (error) {
      console.error("Load tour stats error:", error);
      setTourStats({
        total: 0
      });
    } finally {
      setIsLoadingTourStats(false);
    }
  };

  useEffect(() => {
    loadUserStats();
    loadTourStats();
  }, []);
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Chào mừng trở lại, Quản trị viên!
        </h2>
        <p className="text-muted-foreground">
          Đây là những gì đang diễn ra với LuTrip hôm nay.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng người dùng"
          value={
            isLoadingStats ? "..." : (userStats?.total || 0).toLocaleString()
          }
          description="Người dùng đang hoạt động"
          icon={Users}
          trend={{ value: "+12.5%", isPositive: true }}
        />
        <StatsCard
          title="Tổng tour"
          value={
            isLoadingTourStats
              ? "..."
              : (tourStats?.total || 0).toLocaleString()
          }
          description="Gói tour có sẵn"
          icon={Package}
          trend={{ value: "+8.2%", isPositive: true }}
        />
        <StatsCard
          title="Đặt vé máy bay"
          value="856"
          description="Tháng này"
          icon={Plane}
          trend={{ value: "+23.1%", isPositive: true }}
        />
        <StatsCard
          title="Doanh thu"
          value="$54,231"
          description="Tháng này"
          icon={DollarSign}
          trend={{ value: "-2.4%", isPositive: false }}
        />
      </div>

      {/* Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Bookings */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Đặt chỗ gần đây</CardTitle>
            <CardDescription>Hoạt động đặt chỗ mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: "TUR001",
                  customer: "Nguyen Van A",
                  service: "Ha Long Bay Tour",
                  amount: "$299",
                  status: "confirmed",
                  time: "2 hours ago"
                },
                {
                  id: "FLT002",
                  customer: "Tran Thi B",
                  service: "SGN → HAN Flight",
                  amount: "$150",
                  status: "pending",
                  time: "4 hours ago"
                },
                {
                  id: "TUR003",
                  customer: "Le Van C",
                  service: "Sapa Trekking Tour",
                  amount: "$189",
                  status: "confirmed",
                  time: "6 hours ago"
                },
                {
                  id: "ACT004",
                  customer: "Pham Thi D",
                  service: "Cooking Class HCMC",
                  amount: "$45",
                  status: "completed",
                  time: "8 hours ago"
                }
              ].map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{booking.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.service}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.time}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">{booking.amount}</p>
                    <Badge
                      variant={
                        booking.status === "confirmed"
                          ? "default"
                          : booking.status === "pending"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {booking.status === "confirmed"
                        ? "Đã xác nhận"
                        : booking.status === "pending"
                        ? "Đang chờ"
                        : "Hoàn thành"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <Button variant="outline" className="w-full">
              Xem tất cả đặt chỗ
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Các tác vụ quản trị thường dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Thêm tour mới
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Plane className="mr-2 h-4 w-4" />
                Quản lý chuyến bay
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MapPin className="mr-2 h-4 w-4" />
                Thêm điểm đến
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                Tạo hoạt động
              </Button>
              <Link href="/admin/users">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Quản lý người dùng
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Popular Destinations */}
        <Card>
          <CardHeader>
            <CardTitle>Điểm đến phổ biến</CardTitle>
            <CardDescription>Được đặt nhiều nhất trong tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Ha Long Bay", bookings: 234, trend: "+15%" },
                { name: "Ho Chi Minh City", bookings: 189, trend: "+8%" },
                { name: "Hoi An", bookings: 156, trend: "+23%" },
                { name: "Sapa", bookings: 134, trend: "+5%" },
                { name: "Da Nang", bookings: 98, trend: "+12%" }
              ].map((destination, index) => (
                <div
                  key={destination.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{destination.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {destination.bookings} lượt đặt
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {destination.trend}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Nhật ký hoạt động hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "Đăng ký người dùng mới",
                  user: "john.doe@email.com",
                  time: "5 phút trước",
                  type: "user"
                },
                {
                  action: "Xác nhận đặt tour",
                  user: "admin",
                  time: "12 phút trước",
                  type: "booking"
                },
                {
                  action: "Thêm chuyến bay vào hệ thống",
                  user: "admin",
                  time: "1 giờ trước",
                  type: "system"
                },
                {
                  action: "Xử lý thanh toán",
                  user: "mary.jane@email.com",
                  time: "2 giờ trước",
                  type: "payment"
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div
                    className={`h-2 w-2 rounded-full mt-2 ${
                      activity.type === "user"
                        ? "bg-blue-500"
                        : activity.type === "booking"
                        ? "bg-green-500"
                        : activity.type === "payment"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    }`}
                  ></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      bởi {activity.user}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
