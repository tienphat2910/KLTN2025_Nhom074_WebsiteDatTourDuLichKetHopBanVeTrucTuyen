"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { bookingService, Booking } from "@/services/bookingService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Plane,
  Mountain,
  Clock,
  DollarSign,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookingDetailModal } from "@/components/Booking/BookingDetailModal";
import { FlightBookingDetailModal } from "@/components/Admin/FlightBookingDetailModal";
import { TourBookingDetailModal } from "@/components/Admin/TourBookingDetailModal";
import { ActivityBookingDetailModal } from "@/components/Admin/ActivityBookingDetailModal";
import { CancelBookingDialog } from "@/components/Booking/CancelBookingDialog";

const statusConfig = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: X
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  }
};

const bookingTypeConfig = {
  tour: {
    label: "Tour du lịch",
    icon: Mountain,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  activity: {
    label: "Hoạt động",
    icon: MapPin,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  flight: {
    label: "Chuyến bay",
    icon: Plane,
    color: "text-green-600",
    bgColor: "bg-green-50"
  }
};

export default function BookingPage() {
  const { user, isAuthLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Load bookings
  useEffect(() => {
    if (!isAuthLoading && user) {
      loadBookings();
    }
  }, [isAuthLoading, user]);

  // Filter bookings when tab changes
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(
        bookings.filter((booking) => booking.bookingType === activeTab)
      );
    }
  }, [bookings, activeTab]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const response = await bookingService.getUserBookings();

      if (response.success) {
        // Sort bookings by creation date (newest first)
        const sortedBookings = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setBookings(sortedBookings);
      } else {
        toast.error(response.message || "Không thể tải danh sách booking");
      }
    } catch (error) {
      console.error("Load bookings error:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    // This function is no longer needed as we're using the dialog
    // Keeping it for backward compatibility
    loadBookings();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getBookingStats = () => {
    const stats = {
      all: bookings.length,
      tour: bookings.filter((b) => b.bookingType === "tour").length,
      activity: bookings.filter((b) => b.bookingType === "activity").length,
      flight: bookings.filter((b) => b.bookingType === "flight").length
    };
    return stats;
  };

  const stats = getBookingStats();

  // Don't render anything while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-24">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Yêu cầu đăng nhập</CardTitle>
              <CardDescription>
                Vui lòng đăng nhập để xem danh sách booking của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/login">
                <Button>Đăng nhập</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lịch sử đặt chỗ
          </h1>
          <p className="text-gray-600">Quản lý tất cả các booking của bạn</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tất cả</p>
                  <p className="text-2xl font-bold">{stats.all}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Mountain className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tour</p>
                  <p className="text-2xl font-bold">{stats.tour}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hoạt động</p>
                  <p className="text-2xl font-bold">{stats.activity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Plane className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Chuyến bay</p>
                  <p className="text-2xl font-bold">{stats.flight}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tất cả ({stats.all})
            </TabsTrigger>
            <TabsTrigger value="tour" className="flex items-center gap-2">
              <Mountain className="h-4 w-4" />
              Tour ({stats.tour})
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Hoạt động ({stats.activity})
            </TabsTrigger>
            <TabsTrigger value="flight" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Chuyến bay ({stats.flight})
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Đang tải...</span>
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Chưa có booking nào
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {activeTab === "all"
                          ? "Bạn chưa đặt chỗ nào. Hãy bắt đầu đặt tour, hoạt động hoặc chuyến bay!"
                          : `Bạn chưa đặt ${bookingTypeConfig[
                              activeTab as keyof typeof bookingTypeConfig
                            ]?.label.toLowerCase()} nào.`}
                      </p>
                      <Link href="/">
                        <Button>Khám phá ngay</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredBookings.map((booking) => {
                  const typeConfig = bookingTypeConfig[booking.bookingType];
                  const statusInfo = statusConfig[booking.status];
                  const StatusIcon = statusInfo.icon;
                  const TypeIcon = typeConfig.icon;

                  return (
                    <Card
                      key={booking._id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Left side - Booking info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${typeConfig.bgColor}`}
                              >
                                <TypeIcon
                                  className={`h-5 w-5 ${typeConfig.color}`}
                                />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {typeConfig.label}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  ID: {booking._id.slice(-8).toUpperCase()}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Ngày đặt:</span>
                                <span className="font-medium">
                                  {formatDate(booking.bookingDate)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Tổng tiền:
                                </span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(booking.totalPrice)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Trạng thái:
                                </span>
                                <Badge className={statusInfo.color}>
                                  {statusInfo.label}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Right side - Actions */}
                          <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:items-end">
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1">
                                Cập nhật lần cuối
                              </p>
                              <p className="text-sm text-gray-700">
                                {formatDate(booking.updatedAt)}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              {booking.bookingType === "flight" ? (
                                <FlightBookingDetailModal booking={booking} />
                              ) : booking.bookingType === "tour" ? (
                                <TourBookingDetailModal booking={booking} />
                              ) : booking.bookingType === "activity" ? (
                                <ActivityBookingDetailModal booking={booking} />
                              ) : (
                                <BookingDetailModal booking={booking} />
                              )}

                              {booking.status === "pending" && (
                                <CancelBookingDialog
                                  booking={booking}
                                  onSuccess={loadBookings}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
