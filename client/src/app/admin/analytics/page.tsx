"use client";

import React, { useEffect, useState } from "react";
import analyticsService, {
  AnalyticsOverview,
  FlightAnalytics,
  TourAnalytics,
  ActivityAnalytics
} from "@/services/analyticsService";
import StatCard from "@/components/Admin/Analytics/StatCard";
import RevenueChart from "@/components/Admin/Analytics/RevenueChart";
import RevenueByTypeChart from "@/components/Admin/Analytics/RevenueByTypeChart";
import BookingStatusChart from "@/components/Admin/Analytics/BookingStatusChart";
import TopDestinationsChart from "@/components/Admin/Analytics/TopDestinationsChart";
import AirlineRevenueChart from "@/components/Admin/Analytics/AirlineRevenueChart";
import TicketDistributionChart from "@/components/Admin/Analytics/TicketDistributionChart";
import { AdminLayout } from "@/components/Admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Loader2,
  Plane,
  Map,
  Ticket,
  LayoutDashboard
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [flightData, setFlightData] = useState<FlightAnalytics | null>(null);
  const [tourData, setTourData] = useState<TourAnalytics | null>(null);
  const [activityData, setActivityData] = useState<ActivityAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    // Load data for specific tab when switching
    if (activeTab === "flights" && !flightData) {
      loadFlightAnalytics();
    } else if (activeTab === "tours" && !tourData) {
      loadTourAnalytics();
    } else if (activeTab === "activities" && !activityData) {
      loadActivityAnalytics();
    }
  }, [activeTab]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getOverview();
      setData(result);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  const loadFlightAnalytics = async () => {
    try {
      const result = await analyticsService.getFlightAnalytics();
      setFlightData(result);
    } catch (err) {
      console.error("Error loading flight analytics:", err);
    }
  };

  const loadTourAnalytics = async () => {
    try {
      const result = await analyticsService.getTourAnalytics();
      setTourData(result);
    } catch (err) {
      console.error("Error loading tour analytics:", err);
    }
  };

  const loadActivityAnalytics = async () => {
    try {
      const result = await analyticsService.getActivityAnalytics();
      setActivityData(result);
    } catch (err) {
      console.error("Error loading activity analytics:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout
        title="Thống kê"
        breadcrumbs={[{ label: "Thống kê & Phân tích" }]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        title="Thống kê"
        breadcrumbs={[{ label: "Thống kê & Phân tích" }]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadAnalytics}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Thử lại
              </button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  return (
    <AdminLayout
      title="Thống kê"
      breadcrumbs={[{ label: "Thống kê & Phân tích" }]}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tổng doanh thu"
            value={formatCurrency(data.overview.totalRevenue)}
            icon={<DollarSign className="h-6 w-6" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            title="Tổng đặt chỗ"
            value={data.overview.totalBookings.toLocaleString("vi-VN")}
            icon={<ShoppingCart className="h-6 w-6" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Tổng khách hàng"
            value={data.overview.totalCustomers.toLocaleString("vi-VN")}
            icon={<Users className="h-6 w-6" />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatCard
            title="Giá trị trung bình"
            value={formatCurrency(data.overview.averageOrderValue)}
            icon={<TrendingUp className="h-6 w-6" />}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
          />
        </div>

        {/* Tabs for different views */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="overview">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <DollarSign className="h-4 w-4 mr-2" />
              Doanh thu
            </TabsTrigger>
            <TabsTrigger value="flights">
              <Plane className="h-4 w-4 mr-2" />
              Chuyến bay
            </TabsTrigger>
            <TabsTrigger value="tours">
              <Map className="h-4 w-4 mr-2" />
              Tour
            </TabsTrigger>
            <TabsTrigger value="activities">
              <Ticket className="h-4 w-4 mr-2" />
              Hoạt động
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="h-4 w-4 mr-2" />
              Khách hàng
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={data.monthlyRevenue} />
              <RevenueByTypeChart data={data.revenueByType} />
            </div>
            <BookingStatusChart data={data.statusDistribution} />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueChart data={data.monthlyRevenue} />
            <RevenueByTypeChart data={data.revenueByType} />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top khách hàng</h3>
                <div className="space-y-4">
                  {data.topCustomers.map((customer, index) => (
                    <div
                      key={customer._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {customer.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(customer.totalSpent)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {customer.bookingCount} đặt chỗ
                        </p>
                      </div>
                    </div>
                  ))}
                  {data.topCustomers.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Chưa có dữ liệu khách hàng
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flight Analytics Tab */}
          <TabsContent value="flights" className="space-y-6">
            {flightData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Tổng booking chuyến bay"
                    value={flightData.totalFlightBookings.toLocaleString(
                      "vi-VN"
                    )}
                    icon={<Plane className="h-6 w-6" />}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                  />
                  <StatCard
                    title="Booking hoàn thành"
                    value={flightData.completedFlightBookings.toLocaleString(
                      "vi-VN"
                    )}
                    icon={<ShoppingCart className="h-6 w-6" />}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                  />
                  <StatCard
                    title="Tỷ lệ hủy vé"
                    value={`${flightData.cancellationRate}%`}
                    icon={<TrendingUp className="h-6 w-6" />}
                    iconBg="bg-red-100"
                    iconColor="text-red-600"
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AirlineRevenueChart data={flightData.revenueByAirline} />
                  <TopDestinationsChart data={flightData.topDestinations} />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
          </TabsContent>

          {/* Tour Analytics Tab */}
          <TabsContent value="tours" className="space-y-6">
            {tourData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard
                    title="Tổng booking tour"
                    value={tourData.totalTourBookings.toLocaleString("vi-VN")}
                    icon={<Map className="h-6 w-6" />}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                  />
                  <StatCard
                    title="Booking hoàn thành"
                    value={tourData.completedTourBookings.toLocaleString(
                      "vi-VN"
                    )}
                    icon={<ShoppingCart className="h-6 w-6" />}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                  />
                </div>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Top 10 Tour bán chạy
                    </h3>
                    <div className="space-y-3">
                      {tourData.topTours.map((tour, index) => (
                        <div
                          key={tour._id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {tour.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {tour.destination}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(tour.revenue)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {tour.bookings} booking
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Doanh thu theo điểm đến
                    </h3>
                    <div className="space-y-3">
                      {tourData.revenueByDestination.map((dest) => (
                        <div
                          key={dest._id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <p className="font-medium text-gray-900">
                            {dest.name}
                          </p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(dest.revenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
          </TabsContent>

          {/* Activity Analytics Tab */}
          <TabsContent value="activities" className="space-y-6">
            {activityData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard
                    title="Tổng booking hoạt động"
                    value={activityData.totalActivityBookings.toLocaleString(
                      "vi-VN"
                    )}
                    icon={<Ticket className="h-6 w-6" />}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                  />
                  <StatCard
                    title="Booking hoàn thành"
                    value={activityData.completedActivityBookings.toLocaleString(
                      "vi-VN"
                    )}
                    icon={<ShoppingCart className="h-6 w-6" />}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TicketDistributionChart
                    data={activityData.ticketDistribution}
                  />
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Top 10 Hoạt động bán chạy
                      </h3>
                      <div className="space-y-3">
                        {activityData.topActivities.map((activity, index) => (
                          <div
                            key={activity._id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {activity.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {activity.destination}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(activity.revenue)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {activity.bookings} booking
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
