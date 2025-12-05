"use client";

import { useState, useEffect, useRef } from "react";
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

export default function AdminBookingPage() {
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
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0
  });

  // Track processed bookings to prevent duplicate notifications
  const processedBookingsRef = useRef<Set<string>>(new Set());
  const processedUpdatesRef = useRef<Set<string>>(new Set());
  const processedPaymentsRef = useRef<Set<string>>(new Set());
  const processedCancellationsRef = useRef<Set<string>>(new Set());

  console.log("Component rendered, current stats:", stats);

  // Filter bookings based on search and filters
  useEffect(() => {
    let filtered = bookings;

    // Status filter (client-side for hiding completed bookings by default)
    if (statusFilter === "all") {
      // Hide completed bookings by default when showing all
      filtered = filtered.filter((booking) => booking.status !== "completed");
    } else if (statusFilter !== "all") {
      // Apply specific status filter
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    // Type filter (client-side)
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (booking) => booking.bookingType === typeFilter
      );
    }

    // Search filter (client-side for now, can be moved to API later)
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

    // Recalculate pagination based on filtered results
    const totalFiltered = filtered.length;
    const totalPagesFiltered = Math.ceil(totalFiltered / 10); // Assuming limit is 10
    setTotalPages(totalPagesFiltered);
    setTotalBookings(totalFiltered);

    // If current page exceeds total pages, reset to page 1
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
    // Always load all bookings from API for client-side filtering
    loadBookings(1, undefined, undefined);
  }, [statusFilter, typeFilter]);

  // Real-time updates via socket
  useEffect(() => {
    const token = localStorage.getItem("lutrip_admin_token");
    if (!token) {
      console.warn("No admin token found");
      return;
    }

    let isMounted = true;

    // Define event handlers first
    const handleSocketConnected = () => {
      if (!isMounted) return;
      console.log("✅ Socket connected, joining admin room...");
      setIsSocketConnected(true);
      socketService.joinAdminRoom();
    };

    const handleSocketDisconnected = () => {
      if (!isMounted) return;
      console.log("❌ Socket disconnected!");
      setIsSocketConnected(false);
    };

    const handleBookingCreated = (data: any) => {
      if (!isMounted) return;
      console.log("🎉 New booking created event received:", data);

      // Validate data
      if (!data || !data.booking) {
        console.warn("Invalid booking data received:", data);
        return;
      }

      const bookingId = data.booking._id;
      if (!bookingId) {
        console.warn("Booking ID is missing");
        return;
      }

      // Check if this booking was already processed
      if (processedBookingsRef.current.has(bookingId)) {
        console.log(
          "⚠️ Duplicate notification prevented for booking:",
          bookingId
        );
        return;
      }

      // Mark this booking as processed
      processedBookingsRef.current.add(bookingId);

      // Play notification sound
      try {
        const audio = new Audio("/noti/notification.mp3");
        audio
          .play()
          .catch((e) => console.log("Cannot play notification sound:", e));
      } catch (e) {
        console.log("Audio not available");
      }

      // Reload bookings and stats with current filters
      loadBookings(1, undefined, undefined); // Load all bookings
      loadStats();

      // Get booking type label
      const bookingTypeLabels: any = {
        tour: "Tour du lịch",
        activity: "Hoạt động",
        flight: "Chuyến bay",
        amadeus_flight: "Chuyến bay"
      };
      const typeLabel =
        bookingTypeLabels[data.booking.bookingType] || "Booking mới";

      // Get customer name
      const customerName =
        data.booking.user?.fullName ||
        data.booking.userId?.fullName ||
        "Khách hàng";

      // Get total price
      const totalPrice = data.booking.totalPrice || 0;

      // Get booking ID display
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
        duration: 8000,
        style: {
          background: "#f0fdf4",
          border: "2px solid #22c55e"
        }
      });
    };

    const handleBookingUpdated = (data: any) => {
      if (!isMounted) return;
      console.log("📝 Booking updated event received:", data);

      // Validate data
      if (!data || !data.booking) {
        console.warn("Invalid booking data received:", data);
        return;
      }

      const bookingId = data.booking._id;
      if (!bookingId) {
        console.warn("Booking ID is missing");
        return;
      }

      // Create unique key for this update (booking ID + status + timestamp)
      const updateKey = `${bookingId}_${data.booking.status}_${
        data.timestamp || Date.now()
      }`;

      // Check if this update was already processed (with 2 second window)
      if (processedUpdatesRef.current.has(updateKey)) {
        console.log(
          "⚠️ Duplicate update notification prevented for:",
          bookingId
        );
        return;
      }

      // Mark this update as processed
      processedUpdatesRef.current.add(updateKey);

      // Clean old entries after 5 seconds
      setTimeout(() => {
        processedUpdatesRef.current.delete(updateKey);
      }, 5000);

      // Reload bookings and stats with current filters
      loadBookings(1, undefined, undefined); // Load all bookings
      loadStats();

      // Get status labels
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
      if (!isMounted) return;
      console.log("💳 Payment completed event received:", data);

      // Validate data
      if (!data || (!data.payment && !data.booking)) {
        console.warn("Invalid payment data received:", data);
        return;
      }

      const bookingId = data.booking?._id || data.payment?.bookingId;
      if (!bookingId) {
        console.warn("Booking ID is missing in payment data");
        return;
      }

      // Create unique key for this payment
      const paymentKey = `${bookingId}_payment_${data.timestamp || Date.now()}`;

      // Check if this payment was already processed
      if (processedPaymentsRef.current.has(paymentKey)) {
        console.log(
          "⚠️ Duplicate payment notification prevented for:",
          bookingId
        );
        return;
      }

      // Mark this payment as processed
      processedPaymentsRef.current.add(paymentKey);

      // Clean old entries after 5 seconds
      setTimeout(() => {
        processedPaymentsRef.current.delete(paymentKey);
      }, 5000);

      // Play notification sound
      try {
        const audio = new Audio("/notification.mp3");
        audio
          .play()
          .catch((e) => console.log("Cannot play notification sound:", e));
      } catch (e) {
        console.log("Audio not available");
      }

      // Reload bookings and stats with current filters
      loadBookings(1, undefined, undefined); // Load all bookings
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
        duration: 7000,
        style: {
          background: "#f0fdf4",
          border: "2px solid #22c55e"
        }
      });
    };

    const handleBookingCancelled = (data: any) => {
      if (!isMounted) return;
      console.log("⚠️ Booking cancelled event received:", data);

      // Validate data
      if (!data || !data.booking) {
        console.warn("Invalid booking data received:", data);
        return;
      }

      const bookingId = data.booking._id;
      if (!bookingId) {
        console.warn("Booking ID is missing");
        return;
      }

      // Create unique key for this cancellation
      const cancelKey = `${bookingId}_cancel_${data.timestamp || Date.now()}`;

      // Check if this cancellation was already processed
      if (processedCancellationsRef.current.has(cancelKey)) {
        console.log(
          "⚠️ Duplicate cancellation notification prevented for:",
          bookingId
        );
        return;
      }

      // Mark this cancellation as processed
      processedCancellationsRef.current.add(cancelKey);

      // Clean old entries after 5 seconds
      setTimeout(() => {
        processedCancellationsRef.current.delete(cancelKey);
      }, 5000);

      // Reload bookings and stats with current filters
      loadBookings(1, undefined, undefined); // Load all bookings
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
        duration: 6000,
        style: {
          background: "#fffbeb",
          border: "2px solid #f59e0b"
        }
      });
    };

    // Connect to socket and wait for connection
    const connectAndSetup = async () => {
      await socketService.connect(token);

      // Wait for connection
      let attempts = 0;
      const maxAttempts = 50;
      while (!socketService.isConnected() && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (socketService.isConnected()) {
        console.log("✅ Socket connected successfully");
        socketService.joinAdminRoom();
      } else {
        console.warn("⚠️ Socket connection timeout");
      }
    };

    // Start connection
    connectAndSetup();

    // Register event listeners
    socketService.on("connected", handleSocketConnected);
    socketService.on("disconnected", handleSocketDisconnected);
    socketService.on("booking_created", handleBookingCreated);
    socketService.on("booking_updated", handleBookingUpdated);
    socketService.on("payment_completed", handlePaymentCompleted);
    socketService.on("booking_cancelled", handleBookingCancelled);

    // Cleanup function
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

  // Load bookings from API
  const loadBookings = async (
    page = 1,
    status?: string,
    bookingType?: string
  ) => {
    try {
      setIsLoading(true);
      // Load all bookings for client-side pagination and filtering
      const response = await bookingService.getAllBookings(
        1, // Always load from page 1
        10000, // Load a large number to get all bookings
        undefined, // No server-side status filter
        undefined // No server-side type filter
      );

      if (response.success) {
        console.log(
          "Loaded all bookings for client-side processing:",
          response.data.length
        );
        setBookings(response.data);
        // Don't set pagination here - it will be calculated from filtered results
      } else {
        toast.error(response.message || "Không thể tải danh sách booking");
      }
    } catch (error) {
      console.error("Load bookings error:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setIsLoading(false);
    }
  };

  // Load booking statistics
  const loadStats = async () => {
    try {
      console.log("Loading booking stats...");
      const response = await bookingService.getBookingStats();
      console.log("Stats response:", response);

      if (response.success) {
        console.log("Setting stats:", response.data);
        setStats({
          totalBookings: response.data.totalBookings || 0,
          pendingBookings: response.data.pendingBookings || 0,
          confirmedBookings: response.data.confirmedBookings || 0,
          completedBookings: response.data.completedBookings || 0,
          cancelledBookings: response.data.cancelledBookings || 0,
          totalRevenue: response.data.totalRevenue || 0
        });
        console.log("Stats set successfully");
      } else {
        console.error("Failed to load stats:", response.message);
        // Set default values if API fails
        setStats({
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalRevenue: 0
        });
      }
    } catch (error) {
      console.error("Load stats error:", error);
      // Set default values on error
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

  // Debug: Log stats changes
  useEffect(() => {
    console.log("Stats state changed:", stats);
  }, [stats]);

  // Load initial data on component mount
  useEffect(() => {
    loadBookings(1, undefined, undefined); // Load all bookings
    loadStats();
  }, []);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      const response = await bookingService.updateBookingStatus(
        bookingId,
        newStatus as any
      );

      if (response.success) {
        // Update local state
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
        // Reload stats
        loadStats();
      } else {
        toast.error(response.message || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa booking này?")) {
      return;
    }

    try {
      const response = await bookingService.deleteBooking(bookingId);

      if (response.success) {
        toast.success("Xóa booking thành công");
        // Reload data with current filters
        loadBookings(1, undefined, undefined); // Load all bookings
        loadStats();
      } else {
        toast.error(response.message || "Không thể xóa booking");
      }
    } catch (error) {
      console.error("Delete booking error:", error);
      toast.error("Lỗi kết nối server");
    }
  };

  const handleCreateTestData = async () => {
    try {
      const token = localStorage.getItem("lutrip_admin_token");
      if (!token) {
        toast.error("Không có quyền admin");
        return;
      }

      const response = await fetch(
        `${env.API_BASE_URL}/admin/bookings/create-test-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
        // Reload data with current filters
        loadBookings(1, undefined, undefined); // Load all bookings
        loadStats();
      } else {
        toast.error(result.message || "Không thể tạo test data");
      }
    } catch (error) {
      console.error("Create test data error:", error);
      toast.error("Lỗi kết nối server");
    }
  };

  // Export to Excel function
  const handleExportExcel = async () => {
    try {
      toast.info("Đang chuẩn bị xuất file Excel...");

      // Dynamically import xlsx
      const XLSX = await import("xlsx");

      // Get booking type label
      const getTypeLabel = (type: string) => {
        const labels: any = {
          tour: "Tour du lịch",
          activity: "Hoạt động",
          flight: "Chuyến bay"
        };
        return labels[type] || type;
      };

      // Get status label
      const getStatusLabel = (status: string) => {
        const labels: any = {
          pending: "Chờ xác nhận",
          confirmed: "Đã xác nhận",
          completed: "Hoàn thành",
          cancelled: "Đã hủy"
        };
        return labels[status] || status;
      };

      // Prepare data for Excel
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

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws["!cols"] = [
        { wch: 5 }, // STT
        { wch: 12 }, // Mã Booking
        { wch: 25 }, // Khách hàng
        { wch: 30 }, // Email
        { wch: 15 }, // Số điện thoại
        { wch: 15 }, // Loại booking
        { wch: 15 }, // Trạng thái
        { wch: 15 }, // Tổng tiền
        { wch: 18 }, // Ngày đặt
        { wch: 18 } // Cập nhật
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");

      // Add summary sheet
      const summaryData = [
        { "Chỉ số": "Tổng booking", "Giá trị": stats.totalBookings },
        { "Chỉ số": "Chờ xác nhận", "Giá trị": stats.pendingBookings },
        { "Chỉ số": "Đã xác nhận", "Giá trị": stats.confirmedBookings },
        { "Chỉ số": "Hoàn thành", "Giá trị": stats.completedBookings },
        { "Chỉ số": "Đã hủy", "Giá trị": stats.cancelledBookings },
        {
          "Chỉ số": "Tổng doanh thu",
          "Giá trị": `${stats.totalRevenue.toLocaleString("vi-VN")} VND`
        }
      ];

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary["!cols"] = [{ wch: 20 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Thống kê");

      // Generate filename with current date
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const filename = `Bookings_Report_${dateStr}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);

      toast.success(`Xuất file Excel thành công: ${filename}`);
    } catch (error) {
      console.error("Export Excel error:", error);
      toast.error("Lỗi khi xuất file Excel. Vui lòng thử lại!");
    }
  };

  // Generate report function
  const handleGenerateReport = async () => {
    try {
      toast.info("Đang tạo báo cáo...");

      // Dynamically import xlsx
      const XLSX = await import("xlsx");

      // Get booking type label
      const getTypeLabel = (type: string) => {
        const labels: any = {
          tour: "Tour du lịch",
          activity: "Hoạt động",
          flight: "Chuyến bay"
        };
        return labels[type] || type;
      };

      // Get status label
      const getStatusLabel = (status: string) => {
        const labels: any = {
          pending: "Chờ xác nhận",
          confirmed: "Đã xác nhận",
          completed: "Hoàn thành",
          cancelled: "Đã hủy"
        };
        return labels[status] || status;
      };

      // 1. Summary Statistics
      const summaryData = [
        ["BÁO CÁO TỔNG QUAN HỆ THỐNG ĐẶT CHỖ LUTRIP"],
        [`Ngày tạo: ${new Date().toLocaleString("vi-VN")}`],
        [""],
        ["THỐNG KÊ TỔNG QUAN"],
        ["Chỉ số", "Giá trị"],
        ["Tổng số booking", stats.totalBookings],
        ["Chờ xác nhận", stats.pendingBookings],
        ["Đã xác nhận", stats.confirmedBookings],
        ["Hoàn thành", stats.completedBookings],
        ["Đã hủy", stats.cancelledBookings],
        ["Tổng doanh thu", `${stats.totalRevenue.toLocaleString("vi-VN")} VND`],
        [""],
        ["PHÂN TÍCH"],
        [
          "Tỷ lệ hoàn thành",
          stats.totalBookings > 0
            ? `${(
                (stats.completedBookings / stats.totalBookings) *
                100
              ).toFixed(1)}%`
            : "0%"
        ],
        [
          "Tỷ lệ hủy",
          stats.totalBookings > 0
            ? `${(
                (stats.cancelledBookings / stats.totalBookings) *
                100
              ).toFixed(1)}%`
            : "0%"
        ],
        [
          "Doanh thu trung bình/booking",
          stats.completedBookings > 0
            ? `${(stats.totalRevenue / stats.completedBookings).toLocaleString(
                "vi-VN"
              )} VND`
            : "0 VND"
        ]
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary["!cols"] = [{ wch: 30 }, { wch: 25 }];

      // 2. Bookings by Type
      const bookingsByType: any = {};
      filteredBookings.forEach((booking) => {
        if (!bookingsByType[booking.bookingType]) {
          bookingsByType[booking.bookingType] = {
            count: 0,
            revenue: 0,
            completed: 0
          };
        }
        bookingsByType[booking.bookingType].count++;
        if (booking.status === "completed") {
          bookingsByType[booking.bookingType].completed++;
          bookingsByType[booking.bookingType].revenue += booking.totalPrice;
        }
      });

      const typeData = [
        ["THỐNG KÊ THEO LOẠI BOOKING"],
        ["Loại", "Số lượng", "Hoàn thành", "Doanh thu"],
        ...Object.entries(bookingsByType).map(([type, data]: [string, any]) => [
          getTypeLabel(type),
          data.count,
          data.completed,
          `${data.revenue.toLocaleString("vi-VN")} VND`
        ])
      ];

      const wsType = XLSX.utils.aoa_to_sheet(typeData);
      wsType["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];

      // 3. Bookings by Status
      const statusData = [
        ["THỐNG KÊ THEO TRẠNG THÁI"],
        ["Trạng thái", "Số lượng", "Tỷ lệ"],
        [
          "Chờ xác nhận",
          stats.pendingBookings,
          stats.totalBookings > 0
            ? `${((stats.pendingBookings / stats.totalBookings) * 100).toFixed(
                1
              )}%`
            : "0%"
        ],
        [
          "Đã xác nhận",
          stats.confirmedBookings,
          stats.totalBookings > 0
            ? `${(
                (stats.confirmedBookings / stats.totalBookings) *
                100
              ).toFixed(1)}%`
            : "0%"
        ],
        [
          "Hoàn thành",
          stats.completedBookings,
          stats.totalBookings > 0
            ? `${(
                (stats.completedBookings / stats.totalBookings) *
                100
              ).toFixed(1)}%`
            : "0%"
        ],
        [
          "Đã hủy",
          stats.cancelledBookings,
          stats.totalBookings > 0
            ? `${(
                (stats.cancelledBookings / stats.totalBookings) *
                100
              ).toFixed(1)}%`
            : "0%"
        ]
      ];

      const wsStatus = XLSX.utils.aoa_to_sheet(statusData);
      wsStatus["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }];

      // 4. Detailed bookings list
      const detailedData = filteredBookings.map((booking, index) => {
        const customer =
          typeof booking.userId === "object"
            ? booking.userId.fullName
            : booking.user?.fullName || "N/A";

        return {
          STT: index + 1,
          "Mã Booking": booking._id.slice(-8).toUpperCase(),
          "Khách hàng": customer,
          Loại: getTypeLabel(booking.bookingType),
          "Trạng thái": getStatusLabel(booking.status),
          "Tổng tiền": booking.totalPrice,
          "Ngày đặt": formatDate(booking.createdAt)
        };
      });

      const wsDetails = XLSX.utils.json_to_sheet(detailedData);
      wsDetails["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 }
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng quan");
      XLSX.utils.book_append_sheet(wb, wsType, "Theo loại");
      XLSX.utils.book_append_sheet(wb, wsStatus, "Theo trạng thái");
      XLSX.utils.book_append_sheet(wb, wsDetails, "Chi tiết");

      // Generate filename
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const filename = `Bao_Cao_Bookings_${dateStr}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);

      toast.success(`Tạo báo cáo thành công: ${filename}`);
    } catch (error) {
      console.error("Generate report error:", error);
      toast.error("Lỗi khi tạo báo cáo. Vui lòng thử lại!");
    }
  };

  // Auto-complete bookings function
  const handleAutoComplete = async () => {
    try {
      const token = localStorage.getItem("lutrip_admin_token");
      if (!token) {
        toast.error("Không có quyền admin");
        return;
      }

      toast.info("Đang kiểm tra và hoàn thành booking...");

      const response = await fetch(
        `${env.API_BASE_URL}/admin/bookings/auto-complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);

        // Reload data if any bookings were completed
        if (result.data.completedCount > 0) {
          loadBookings(1, undefined, undefined); // Load all bookings
          loadStats();
        }
      } else {
        toast.error(result.message || "Không thể auto-complete bookings");
      }
    } catch (error) {
      console.error("Auto-complete error:", error);
      toast.error("Lỗi kết nối server");
    }
  };

  return (
    <AdminLayout
      title="Quản lý Booking"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Booking" }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <BookingActions
          isSocketConnected={isSocketConnected}
          onRefreshStats={loadStats}
          onExportExcel={handleExportExcel}
          onGenerateReport={handleGenerateReport}
          onAutoComplete={handleAutoComplete}
        />

        {/* Statistics Cards */}
        <BookingStats stats={stats} />

        {/* Filters and Search */}
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

        {/* Bookings Table */}
        <BookingTable
          bookings={paginatedBookings}
          isLoading={isLoading}
          onStatusChange={handleStatusChange}
          onDeleteBooking={handleDeleteBooking}
          isUpdatingStatus={isUpdatingStatus}
          totalBookings={totalBookings}
        />

        {/* Pagination */}
        <BookingPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalBookings={totalBookings}
          onPageChange={(page) => {
            setCurrentPage(page); // Just change page, no API call needed
          }}
        />
      </div>
    </AdminLayout>
  );
}
