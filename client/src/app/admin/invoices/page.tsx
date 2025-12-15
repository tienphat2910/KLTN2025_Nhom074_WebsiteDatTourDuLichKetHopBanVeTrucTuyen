"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminSidebar } from "@/components/Admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Users,
  Eye,
  MapPin,
  Calendar,
  Phone,
  Mail,
  User,
  DollarSign,
  Package,
  Activity as ActivityIcon,
} from "lucide-react";
import { invoiceService, type TourInvoiceSummary, type ActivityInvoiceSummary, type BookingUserDetail } from "@/services/invoiceService";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function AdminInvoicesPage() {
  const [tourInvoices, setTourInvoices] = useState<TourInvoiceSummary[]>([]);
  const [activityInvoices, setActivityInvoices] = useState<ActivityInvoiceSummary[]>([]);
  const [tourPage, setTourPage] = useState(1);
  const [tourPageSize, setTourPageSize] = useState(10);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<TourInvoiceSummary | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityInvoiceSummary | null>(null);
  const [tourBookings, setTourBookings] = useState<BookingUserDetail[]>([]);
  const [activityBookings, setActivityBookings] = useState<BookingUserDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [tourBookingPage, setTourBookingPage] = useState(1);
  const [tourBookingPageSize, setTourBookingPageSize] = useState(8);
  const [activityBookingPage, setActivityBookingPage] = useState(1);
  const [activityBookingPageSize, setActivityBookingPageSize] = useState(8);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const [toursRes, activitiesRes] = await Promise.all([
        invoiceService.getTourInvoices(),
        invoiceService.getActivityInvoices(),
      ]);

      if (toursRes.success && toursRes.data) {
        setTourInvoices(toursRes.data);
      }

      if (activitiesRes.success && activitiesRes.data) {
        setActivityInvoices(activitiesRes.data);
      }
    } catch (error) {
      console.error("Load invoices error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTourDetails = async (tour: TourInvoiceSummary) => {
    setSelectedTour(tour);
    setDetailsLoading(true);
    setTourBookingPage(1);
    try {
      const response = await invoiceService.getTourBookings(tour._id);
      if (response.success && response.data) {
        setTourBookings(response.data.bookings);
      }
    } catch (error) {
      console.error("Load tour bookings error:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewActivityDetails = async (activity: ActivityInvoiceSummary) => {
    setSelectedActivity(activity);
    setDetailsLoading(true);
    setActivityBookingPage(1);
    try {
      const response = await invoiceService.getActivityBookings(activity._id);
      if (response.success && response.data) {
        setActivityBookings(response.data.bookings);
      }
    } catch (error) {
      console.error("Load activity bookings error:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const tourStats = useMemo(() => {
    return {
      totalRevenue: tourInvoices.reduce((sum, t) => sum + t.totalRevenue, 0),
      totalBookings: tourInvoices.reduce((sum, t) => sum + t.totalBookings, 0),
      totalTours: tourInvoices.length,
    };
  }, [tourInvoices]);

  const paginatedTours = useMemo(() => {
    const start = (tourPage - 1) * tourPageSize;
    return tourInvoices.slice(start, start + tourPageSize);
  }, [tourInvoices, tourPage, tourPageSize]);

  const tourTotalPages = Math.max(1, Math.ceil(tourInvoices.length / tourPageSize));

  const activityStats = useMemo(() => {
    return {
      totalRevenue: activityInvoices.reduce((sum, a) => sum + a.totalRevenue, 0),
      totalBookings: activityInvoices.reduce((sum, a) => sum + a.totalBookings, 0),
      totalActivities: activityInvoices.length,
    };
  }, [activityInvoices]);

  const paginatedActivities = useMemo(() => {
    const start = (activityPage - 1) * activityPageSize;
    return activityInvoices.slice(start, start + activityPageSize);
  }, [activityInvoices, activityPage, activityPageSize]);

  const activityTotalPages = Math.max(1, Math.ceil(activityInvoices.length / activityPageSize));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Chờ xử lý" },
      confirmed: { variant: "default", label: "Đã xác nhận" },
      completed: { variant: "outline", label: "Hoàn thành" },
      cancelled: { variant: "destructive", label: "Đã hủy" },
    };
    const config = statusMap[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const paginatedTourBookings = useMemo(() => {
    const start = (tourBookingPage - 1) * tourBookingPageSize;
    return tourBookings.slice(start, start + tourBookingPageSize);
  }, [tourBookings, tourBookingPage, tourBookingPageSize]);

  const tourBookingTotalPages = Math.max(1, Math.ceil(tourBookings.length / tourBookingPageSize));

  const paginatedActivityBookings = useMemo(() => {
    const start = (activityBookingPage - 1) * activityBookingPageSize;
    return activityBookings.slice(start, start + activityBookingPageSize);
  }, [activityBookings, activityBookingPage, activityBookingPageSize]);

  const activityBookingTotalPages = Math.max(1, Math.ceil(activityBookings.length / activityBookingPageSize));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý Hóa đơn
          </h1>
          <p className="text-gray-600">
            Theo dõi và quản lý hóa đơn đặt tour và hoạt động
          </p>
        </div>

        <Tabs defaultValue="tours" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tours" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Tours
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <ActivityIcon className="h-4 w-4" />
              Hoạt động
            </TabsTrigger>
          </TabsList>

          {/* Tours Tab */}
          <TabsContent value="tours" className="space-y-6">
            {/* Tour Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(tourStats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Từ {tourStats.totalBookings} đặt chỗ</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng đặt chỗ</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tourStats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">Trên {tourStats.totalTours} tour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng tour</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tourStats.totalTours}</div>
                  <p className="text-xs text-muted-foreground">Tour đang hoạt động</p>
                </CardContent>
              </Card>
            </div>

            {/* Tours Table */}
            <Card>
              <CardHeader>
                <CardTitle>Danh sách Tours</CardTitle>
                <CardDescription>
                  Xem thống kê đặt chỗ và người dùng của từng tour
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tour</TableHead>
                          <TableHead>Điểm đến</TableHead>
                          <TableHead className="text-right">Giá</TableHead>
                          <TableHead className="text-center">Đặt chỗ</TableHead>
                          <TableHead className="text-right">Doanh thu</TableHead>
                          <TableHead className="text-center">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tourInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Không có tour nào
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedTours.map((tour) => (
                            <TableRow key={tour._id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative h-12 w-12 rounded-md overflow-hidden bg-gray-100">
                                    {tour.image ? (
                                      <Image src={tour.image} alt={tour.title} fill className="object-cover" />
                                    ) : (
                                      <MapPin className="h-6 w-6 text-gray-400 absolute inset-0 m-auto" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium">{tour.title}</div>
                                    <div className="text-sm text-muted-foreground">{tour.duration}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{tour.destinationId?.name || "N/A"}</TableCell>
                              <TableCell className="text-right">{formatCurrency(tour.price)}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-bold">{tour.totalBookings}</span>
                                  <span className="text-xs text-muted-foreground">{tour.activeBookings} hoạt động</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(tour.totalRevenue)}</TableCell>
                              <TableCell className="text-center">
                                <Button variant="ghost" size="sm" onClick={() => handleViewTourDetails(tour)}>
                                  <Eye className="h-4 w-4 mr-1" /> Xem chi tiết
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    {tourInvoices.length > tourPageSize && (
                      <div className="flex items-center justify-end gap-2 mt-4">
                        <div className="text-sm text-muted-foreground">Trang</div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" disabled={tourPage === 1} onClick={() => setTourPage((p) => Math.max(1, p - 1))}>Prev</Button>
                          <div className="px-3">{tourPage} / {tourTotalPages}</div>
                          <Button variant="outline" size="sm" disabled={tourPage === tourTotalPages} onClick={() => setTourPage((p) => Math.min(tourTotalPages, p + 1))}>Next</Button>
                        </div>
                        <select className="ml-3 rounded border px-2 py-1 text-sm" value={tourPageSize} onChange={(e) => { setTourPageSize(Number(e.target.value)); setTourPage(1); }}>
                          {[5,10,20,50].map(s => (<option key={s} value={s}>{s} / trang</option>))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            {/* Activity Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(activityStats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Từ {activityStats.totalBookings} đặt chỗ</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng đặt chỗ</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activityStats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">Trên {activityStats.totalActivities} hoạt động</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng hoạt động</CardTitle>
                  <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activityStats.totalActivities}</div>
                  <p className="text-xs text-muted-foreground">Hoạt động đang mở</p>
                </CardContent>
              </Card>
            </div>

            {/* Activities Table */}
            <Card>
              <CardHeader>
                <CardTitle>Danh sách Hoạt động</CardTitle>
                <CardDescription>
                  Xem thống kê đặt chỗ và người dùng của từng hoạt động
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hoạt động</TableHead>
                          <TableHead>Địa điểm</TableHead>
                          <TableHead className="text-right">Giá</TableHead>
                          <TableHead className="text-center">Đặt chỗ</TableHead>
                          <TableHead className="text-right">Doanh thu</TableHead>
                          <TableHead className="text-center">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Không có hoạt động nào
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedActivities.map((activity) => (
                            <TableRow key={activity._id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative h-12 w-12 rounded-md overflow-hidden bg-gray-100">
                                    {activity.image ? (
                                      <Image src={activity.image} alt={activity.name} fill className="object-cover" />
                                    ) : (
                                      <ActivityIcon className="h-6 w-6 text-gray-400 absolute inset-0 m-auto" />
                                    )}
                                  </div>
                                  <div className="font-medium">{activity.name}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {typeof activity.location === 'string' ? activity.location : activity.location?.name || activity.location?.address || 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(
                                  typeof activity.price === 'number' 
                                    ? activity.price 
                                    : activity.price?.retail?.adult || 0
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-bold">{activity.totalBookings}</span>
                                  <span className="text-xs text-muted-foreground">{activity.activeBookings} hoạt động</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(activity.totalRevenue)}</TableCell>
                              <TableCell className="text-center">
                                <Button variant="ghost" size="sm" onClick={() => handleViewActivityDetails(activity)}>
                                  <Eye className="h-4 w-4 mr-1" /> Xem chi tiết
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    {activityInvoices.length > activityPageSize && (
                      <div className="flex items-center justify-end gap-2 mt-4">
                        <div className="text-sm text-muted-foreground">Trang</div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" disabled={activityPage === 1} onClick={() => setActivityPage((p) => Math.max(1, p - 1))}>Prev</Button>
                          <div className="px-3">{activityPage} / {activityTotalPages}</div>
                          <Button variant="outline" size="sm" disabled={activityPage === activityTotalPages} onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}>Next</Button>
                        </div>
                        <select className="ml-3 rounded border px-2 py-1 text-sm" value={activityPageSize} onChange={(e) => { setActivityPageSize(Number(e.target.value)); setActivityPage(1); }}>
                          {[5,10,20,50].map(s => (<option key={s} value={s}>{s} / trang</option>))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tour Details Dialog */}
        <Dialog open={!!selectedTour} onOpenChange={() => setSelectedTour(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chi tiết đặt tour: {selectedTour?.title}
              </DialogTitle>
              <DialogDescription>Danh sách người dùng đã đặt tour này</DialogDescription>
            </DialogHeader>

            {detailsLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-24 w-full" />))}</div>
            ) : tourBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Chưa có đặt chỗ nào cho tour này</div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Email / Điện thoại</TableHead>
                      <TableHead>Ngày đặt</TableHead>
                      <TableHead className="text-center">Số lượng</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTourBookings.map((booking, idx) => (
                      <TableRow key={booking._id}>
                        <TableCell className="font-medium">{(tourBookingPage - 1) * tourBookingPageSize + idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.user.fullName || booking.user.displayName || '—'}</span>
                            <span className="text-xs text-muted-foreground">{booking.user._id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{booking.user.email}</div>
                          {booking.user.phone && <div className="text-xs text-muted-foreground">{booking.user.phone}</div>}
                        </TableCell>
                        <TableCell>{new Date(booking.bookingDate).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell className="text-center">{booking.numAdults || 0} / {booking.numChildren || 0}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(booking.totalPrice)}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {tourBookings.length > tourBookingPageSize && (
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={tourBookingPage === 1} onClick={() => setTourBookingPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <div className="px-3 text-sm">{tourBookingPage} / {tourBookingTotalPages}</div>
                    <Button variant="outline" size="sm" disabled={tourBookingPage === tourBookingTotalPages} onClick={() => setTourBookingPage((p) => Math.min(tourBookingTotalPages, p + 1))}>Next</Button>
                    <select className="ml-3 rounded border px-2 py-1 text-sm" value={tourBookingPageSize} onChange={(e) => { setTourBookingPageSize(Number(e.target.value)); setTourBookingPage(1); }}>
                      {[5,8,10,20].map(s => (<option key={s} value={s}>{s} / trang</option>))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chi tiết đặt hoạt động: {selectedActivity?.name}
              </DialogTitle>
              <DialogDescription>Danh sách người dùng đã đặt hoạt động này</DialogDescription>
            </DialogHeader>

            {detailsLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-24 w-full" />))}</div>
            ) : activityBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Chưa có đặt chỗ nào cho hoạt động này</div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Email / Điện thoại</TableHead>
                      <TableHead>Ngày đặt</TableHead>
                      <TableHead className="text-center">Số lượng</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedActivityBookings.map((booking, idx) => (
                      <TableRow key={booking._id}>
                        <TableCell className="font-medium">{(activityBookingPage - 1) * activityBookingPageSize + idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.user.fullName || booking.user.displayName || '—'}</span>
                            <span className="text-xs text-muted-foreground">{booking.user._id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{booking.user.email}</div>
                          {booking.user.phone && <div className="text-xs text-muted-foreground">{booking.user.phone}</div>}
                        </TableCell>
                        <TableCell>{new Date(booking.bookingDate).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell className="text-center">{booking.quantity || 1}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(booking.totalPrice)}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {activityBookings.length > activityBookingPageSize && (
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={activityBookingPage === 1} onClick={() => setActivityBookingPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <div className="px-3 text-sm">{activityBookingPage} / {activityBookingTotalPages}</div>
                    <Button variant="outline" size="sm" disabled={activityBookingPage === activityBookingTotalPages} onClick={() => setActivityBookingPage((p) => Math.min(activityBookingTotalPages, p + 1))}>Next</Button>
                    <select className="ml-3 rounded border px-2 py-1 text-sm" value={activityBookingPageSize} onChange={(e) => { setActivityBookingPageSize(Number(e.target.value)); setActivityBookingPage(1); }}>
                      {[5,8,10,20].map(s => (<option key={s} value={s}>{s} / trang</option>))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
