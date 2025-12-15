"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin";
import { BookingDetailModal } from "@/components/Booking/BookingDetailModal";
import { Booking, bookingService } from "@/services/bookingService";
import { socketService } from "@/services/socketService";
import { toast } from "sonner";
import { env } from "@/config/env";
import { BookingStats } from "@/components/Admin/BookingStats";
import { BookingActions } from "@/components/Admin/BookingActions";
import { BookingFilters } from "@/components/Admin/BookingFilters";
import { BookingTable } from "@/components/Admin/BookingTable";
import { BookingPagination } from "@/components/Admin/BookingPagination";
import { formatCurrency, formatDate } from "@/components/Admin/bookingUtils";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { CreateBookingModal } from "@/components/Admin/CreateBookingModal";

export default function StaffBookingPage() {
  const { user, isAuthLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0
  });

  const processedBookingsRef = useRef<Set<string>>(new Set());
  const processedUpdatesRef = useRef<Set<string>>(new Set());
  const processedPaymentsRef = useRef<Set<string>>(new Set());
  const processedCancellationsRef = useRef<Set<string>>(new Set());

  // Filter bookings based on search and filters
  useEffect(() => {
    let filtered = bookings;

    if (statusFilter === "all") {
      filtered = filtered.filter((booking) => booking.status !== "completed");
    } else if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (booking) => booking.bookingType === typeFilter
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.user?.fullName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.user?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (typeof booking.userId === "string" &&
            booking.userId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredBookings(filtered);

    const totalFiltered = filtered.length;
    const totalPagesFiltered = Math.ceil(totalFiltered / 10);
    setTotalPages(totalPagesFiltered);
    setTotalBookings(totalFiltered);

    if (currentPage > totalPagesFiltered && totalPagesFiltered > 0) {
      setCurrentPage(1);
    }
  }, [bookings, searchTerm, statusFilter, typeFilter, currentPage]);

  // Paginate filtered bookings based on current page
  useEffect(() => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    const paginated = filteredBookings.slice(startIndex, endIndex);
    setPaginatedBookings(paginated);
  }, [filteredBookings, currentPage]);

  // Reload bookings when status or type filter changes
  useEffect(() => {
    loadBookings(1, undefined, undefined);
  }, [statusFilter, typeFilter]);

  // Real-time updates via socket
  useEffect(() => {
    const token =
      localStorage.getItem("lutrip_admin_token") ||
      localStorage.getItem("lutrip_token");
    if (!token) return;

    let isMounted = true;

    const handleSocketConnected = () => {
      if (!isMounted) return;
      setIsSocketConnected(true);
      socketService.joinAdminRoom();
    };

    const handleSocketDisconnected = () => {
      if (!isMounted) return;
      setIsSocketConnected(false);
    };

    const handleBookingCreated = (data: any) => {
      if (!isMounted || !data?.booking) return;
      const bookingId = data.booking._id;
      if (!bookingId || processedBookingsRef.current.has(bookingId)) return;

      processedBookingsRef.current.add(bookingId);

      try {
        const audio = new Audio("/noti/notification.mp3");
        audio.play().catch(() => {});
      } catch (e) {}

      loadBookings(1, undefined, undefined);
      loadStats();

      const bookingTypeLabels: any = {
        tour: "Tour du lịch",
        activity: "Hoạt động",
        flight: "Chuyến bay",
        amadeus_flight: "Chuyến bay"
      };
      const typeLabel =
        bookingTypeLabels[data.booking.bookingType] || "Booking mới";
      const customerName =
        data.booking.user?.fullName ||
        data.booking.userId?.fullName ||
        "Khách hàng";
      const totalPrice =
        data.booking.totalPrice || data.booking.totalAmount || 0;
      const bookingIdDisplay = bookingId.toString().slice(-8).toUpperCase();

      toast.success("🎉 ĐẶT CHỖ MỚI!", {
        description: (
          <div className="space-y-1">
            <div className="font-semibold">{customerName}</div>
            <div>{typeLabel}</div>
            <div className="text-green-600 font-bold">
              {totalPrice.toLocaleString("vi-VN")} VND
            </div>
            <div className="text-xs text-gray-500">ID: {bookingIdDisplay}</div>
          </div>
        ),
        duration: 8000
      });
    };

    const handleBookingUpdated = (data: any) => {
      if (!isMounted || !data?.booking) return;
      const bookingId = data.booking._id;
      if (!bookingId) return;

      const updateKey = `${bookingId}_${data.booking.status}_${
        data.timestamp || Date.now()
      }`;
      if (processedUpdatesRef.current.has(updateKey)) return;

      processedUpdatesRef.current.add(updateKey);
      setTimeout(() => processedUpdatesRef.current.delete(updateKey), 5000);

      loadBookings(1, undefined, undefined);
      loadStats();

      const statusLabels: any = {
        pending: "Chờ xác nhận",
        confirmed: "Đã xác nhận",
        completed: "Hoàn thành",
        cancelled: "Đã hủy"
      };
      const statusLabel = statusLabels[data.booking.status] || "Không xác định";
      const bookingIdDisplay = bookingId.toString().slice(-8).toUpperCase();

      toast.info("📝 Booking được cập nhật", {
        description: (
          <div className="space-y-1">
            <div className="font-semibold">Trạng thái: {statusLabel}</div>
            <div className="text-xs text-gray-500">ID: {bookingIdDisplay}</div>
          </div>
        ),
        duration: 4000
      });
    };

    const handlePaymentCompleted = (data: any) => {
      if (!isMounted || !data) return;
      const bookingId = data.booking?._id || data.payment?.bookingId;
      if (!bookingId) return;

      const paymentKey = `${bookingId}_payment_${data.timestamp || Date.now()}`;
      if (processedPaymentsRef.current.has(paymentKey)) return;

      processedPaymentsRef.current.add(paymentKey);
      setTimeout(() => processedPaymentsRef.current.delete(paymentKey), 5000);

      try {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {});
      } catch (e) {}

      loadBookings(1, undefined, undefined);
      loadStats();

      const paymentMethod = data.payment?.paymentMethod || "Chưa xác định";
      const amount = data.payment?.amount || data.booking?.totalPrice || 0;
      const bookingIdDisplay = bookingId.toString().slice(-8).toUpperCase();

      toast.success("💳 THANH TOÁN HOÀN TẤT!", {
        description: (
          <div className="space-y-1">
            <div className="font-bold text-green-600">
              {amount.toLocaleString("vi-VN")} VND
            </div>
            <div className="text-sm">Phương thức: {paymentMethod}</div>
            <div className="text-xs text-gray-500">
              Booking ID: {bookingIdDisplay}
            </div>
          </div>
        ),
        duration: 7000
      });
    };

    const handleBookingCancelled = (data: any) => {
      if (!isMounted || !data?.booking) return;
      const bookingId = data.booking._id;
      if (!bookingId) return;

      const cancelKey = `${bookingId}_cancel_${data.timestamp || Date.now()}`;
      if (processedCancellationsRef.current.has(cancelKey)) return;

      processedCancellationsRef.current.add(cancelKey);
      setTimeout(
        () => processedCancellationsRef.current.delete(cancelKey),
        5000
      );

      loadBookings(1, undefined, undefined);
      loadStats();

      const customerName =
        data.booking.user?.fullName ||
        data.booking.userId?.fullName ||
        "Khách hàng";
      const amount = data.booking.totalPrice || 0;
      const bookingIdDisplay = bookingId.toString().slice(-8).toUpperCase();

      toast.warning("⚠️ Booking bị hủy", {
        description: (
          <div className="space-y-1">
            <div className="font-semibold">{customerName}</div>
            <div className="text-orange-600">
              {amount.toLocaleString("vi-VN")} VND
            </div>
            <div className="text-xs text-gray-500">ID: {bookingIdDisplay}</div>
            {data.reason && (
              <div className="text-xs text-gray-600">Lý do: {data.reason}</div>
            )}
          </div>
        ),
        duration: 6000
      });
    };

    const connectAndSetup = async () => {
      await socketService.connect(token);
      let attempts = 0;
      while (!socketService.isConnected() && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      if (socketService.isConnected()) {
        socketService.joinAdminRoom();
      }
    };

    connectAndSetup();

    socketService.on("connected", handleSocketConnected);
    socketService.on("disconnected", handleSocketDisconnected);
    socketService.on("booking_created", handleBookingCreated);
    socketService.on("booking_updated", handleBookingUpdated);
    socketService.on("payment_completed", handlePaymentCompleted);
    socketService.on("booking_cancelled", handleBookingCancelled);

    return () => {
      isMounted = false;
      socketService.off("connected", handleSocketConnected);
      socketService.off("disconnected", handleSocketDisconnected);
      socketService.off("booking_created", handleBookingCreated);
      socketService.off("booking_updated", handleBookingUpdated);
      socketService.off("payment_completed", handlePaymentCompleted);
      socketService.off("booking_cancelled", handleBookingCancelled);
      socketService.leaveAdminRoom();
    };
  }, []);

  const loadBookings = async (
    page = 1,
    status?: string,
    bookingType?: string
  ) => {
    try {
      setIsLoading(true);
      const response = await bookingService.getAllBookings(
        1,
        10000,
        undefined,
        undefined
      );

      if (response.success) {
        setBookings(response.data);
      } else {
        toast.error(response.message || "Không thể tải danh sách booking");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await bookingService.getBookingStats();
      if (response.success) {
        setStats({
          totalBookings: response.data.totalBookings || 0,
          pendingBookings: response.data.pendingBookings || 0,
          confirmedBookings: response.data.confirmedBookings || 0,
          completedBookings: response.data.completedBookings || 0,
          cancelledBookings: response.data.cancelledBookings || 0,
          totalRevenue: response.data.totalRevenue || 0
        });
      }
    } catch (error) {
      setStats({
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0
      });
    }
  };

  useEffect(() => {
    if (!isAuthLoading && user) {
      loadBookings(1, undefined, undefined);
      loadStats();
    }
  }, [isAuthLoading, user]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      const response = await bookingService.updateBookingStatus(
        bookingId,
        newStatus as any
      );

      if (response.success) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === bookingId
              ? {
                  ...booking,
                  status: newStatus as any,
                  updatedAt: new Date().toISOString()
                }
              : booking
          )
        );
        toast.success("Cập nhật trạng thái thành công");
        loadStats();
      } else {
        toast.error(response.message || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  

  const handleExportExcel = async () => {
    try {
      toast.info("Đang chuẩn bị xuất file Excel...");
      const XLSX = await import("xlsx");

      const getTypeLabel = (type: string) => {
        const labels: any = {
          tour: "Tour du lịch",
          activity: "Hoạt động",
          flight: "Chuyến bay"
        };
        return labels[type] || type;
      };

      const getStatusLabel = (status: string) => {
        const labels: any = {
          pending: "Chờ xác nhận",
          confirmed: "Đã xác nhận",
          completed: "Hoàn thành",
          cancelled: "Đã hủy"
        };
        return labels[status] || status;
      };

      const excelData = filteredBookings.map((booking, index) => {
        const customer =
          typeof booking.userId === "object"
            ? booking.userId.fullName
            : booking.user?.fullName || "N/A";
        const email =
          typeof booking.userId === "object"
            ? booking.userId.email
            : booking.user?.email || "N/A";
        const phone =
          typeof booking.userId === "object"
            ? booking.userId.phone
            : booking.user?.phone || "N/A";

        return {
          STT: index + 1,
          "Mã Booking": booking._id.slice(-8).toUpperCase(),
          "Khách hàng": customer,
          Email: email,
          "Số điện thoại": phone || "N/A",
          "Loại booking": getTypeLabel(booking.bookingType),
          "Trạng thái": getStatusLabel(booking.status),
          "Tổng tiền": booking.totalPrice,
          "Ngày đặt": formatDate(booking.createdAt),
          "Cập nhật": formatDate(booking.updatedAt)
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 18 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");

      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const filename = `Bookings_Report_${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success(`Xuất file Excel thành công: ${filename}`);
    } catch (error) {
      toast.error("Lỗi khi xuất file Excel. Vui lòng thử lại!");
    }
  };

  const handleGenerateReport = async () => {
    toast.info("Chức năng đang được phát triển");
  };

  const handleAutoComplete = async () => {
    toast.info("Chức năng đang được phát triển");
  };

  // Redirect if not staff
  if (!isAuthLoading && user?.role !== "staff") {
    router.push("/");
    return null;
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout
      title="Quản lý Booking"
      breadcrumbs={[
        { label: "Dashboard", href: "/staff" },
        { label: "Booking" }
      ]}
    >
      <div className="space-y-6">
        <BookingActions
          isSocketConnected={isSocketConnected}
          onRefreshStats={loadStats}
          onExportExcel={handleExportExcel}
          onGenerateReport={handleGenerateReport}
          onAutoComplete={handleAutoComplete}
          onCreateBooking={() => setIsCreateModalOpen(true)}
        />

        <BookingStats stats={stats} />

        <BookingFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          onSearchTermChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onTypeFilterChange={setTypeFilter}
          onClearFilters={() => {
            setSearchTerm("");
            setStatusFilter("all");
            setTypeFilter("all");
          }}
        />

        <BookingTable
          bookings={paginatedBookings}
          isLoading={isLoading}
          onStatusChange={handleStatusChange}
          isUpdatingStatus={isUpdatingStatus}
          totalBookings={totalBookings}
        />

        <BookingPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalBookings={totalBookings}
          onPageChange={setCurrentPage}
        />
      </div>

      <CreateBookingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={async () => {
          await loadBookings(currentPage);
          await loadStats();
        }}
      />
    </AdminLayout>
  );
}
