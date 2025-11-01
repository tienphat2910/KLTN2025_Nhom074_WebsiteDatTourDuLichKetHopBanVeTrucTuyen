import { env } from "@/config/env";

const API_BASE_URL = env.API_BASE_URL;

// Helper function to get the correct token based on user role
const getToken = (): string | null => {
  // First try admin token
  const adminToken = localStorage.getItem("lutrip_admin_token");
  if (adminToken) return adminToken;

  // Then try regular token
  const regularToken = localStorage.getItem("lutrip_token");
  if (regularToken) return regularToken;

  return null;
};

export interface Booking {
  _id: string;
  userId:
    | string
    | { _id: string; fullName?: string; email?: string; phone?: string };
  user?: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  bookingDate: string;
  totalPrice: number;
  actualTotal?: number; // For flight bookings with discounts
  isRoundTrip?: boolean; // For flight bookings
  status: "pending" | "confirmed" | "cancelled" | "completed";
  bookingType: "tour" | "activity" | "flight";
  createdAt: string;
  updatedAt: string;
}

export interface BookingsResponse {
  success: boolean;
  data: Booking[];
  message?: string;
}

export interface BookingResponse {
  success: boolean;
  data: Booking;
  message?: string;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
}

export interface BookingStatsResponse {
  success: boolean;
  data: BookingStats;
  message?: string;
}

export interface FlightBookingDetail {
  _id: string;
  bookingId: string;
  flightId: {
    _id: string;
    flightCode: string;
    airline: {
      _id: string;
      name: string;
      code: string;
      logo?: string;
    };
    departureAirport: {
      _id: string;
      name: string;
      code: string;
      city: string;
      country: string;
    };
    arrivalAirport: {
      _id: string;
      name: string;
      code: string;
      city: string;
      country: string;
    };
    departureTime: string;
    arrivalTime: string;
    duration: string;
    aircraft?: string;
  };
  flightClassId: {
    _id: string;
    name: string;
    code: string;
    description?: string;
    amenities?: string[];
  };
  numTickets: number;
  pricePerTicket: number;
  totalFlightPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  note?: string;
  paymentMethod: "momo" | "bank_transfer" | "zalopay";
  discountCode?: string;
  discountAmount: number;
  qrCode?: string;
  qrCodePublicId?: string;
  flightCode: string;
  selectedSeats?: string[];
  passengers?: Array<{
    _id: string;
    fullName: string;
    dateOfBirth: string;
    gender: "male" | "female" | "Male" | "Female" | "Nam" | "Nữ" | "other";
    passportNumber?: string;
    seatNumber?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface RoundTripFlightBookingDetail {
  isRoundTrip: boolean;
  flights: FlightBookingDetail[];
  outboundFlight: FlightBookingDetail;
  returnFlight: FlightBookingDetail | null;
  totalPrice: number;
  totalDiscount: number;
}

export interface FlightBookingResponse {
  success: boolean;
  data: FlightBookingDetail & Partial<RoundTripFlightBookingDetail>;
  message?: string;
}

export interface ActivityBookingDetail {
  _id: string;
  bookingId: string;
  activityId: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    destination: {
      _id: string;
      name: string;
      region: string;
      image?: string;
    } | null;
    location:
      | {
          name?: string;
          address?: string;
        }
      | string;
    operating_hours:
      | {
          mon_to_sat?: string;
          sunday_holidays?: string;
          ticket_cutoff?: string;
          rides_end?: string;
        }
      | string;
    features: string[];
    gallery: string[];
  };
  numAdults: number;
  numChildren: number;
  numBabies: number;
  numSeniors: number;
  price: number;
  subtotal: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  scheduledDate: string;
  note?: string;
  paymentMethod: "momo" | "bank_transfer" | "zalopay" | "cash";
  qrCode?: string;
  qrCodePublicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityBookingResponse {
  success: boolean;
  data: ActivityBookingDetail;
  message?: string;
}

export interface AdminBookingsResponse {
  success: boolean;
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export const bookingService = {
  // Get user's bookings
  getUserBookings: async (): Promise<BookingsResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          data: [],
          message: "Vui lòng đăng nhập để xem booking"
        };
      }

      const response = await fetch(`${API_BASE_URL}/booking`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: [],
          message: result.message || "Không thể tải danh sách booking"
        };
      }

      return result;
    } catch (error) {
      console.error("Get user bookings error:", error);
      return {
        success: false,
        data: [],
        message: "Lỗi kết nối server"
      };
    }
  },

  // Get booking by ID
  getBookingById: async (id: string): Promise<BookingResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          data: {} as Booking,
          message: "Vui lòng đăng nhập"
        };
      }

      const response = await fetch(`${API_BASE_URL}/booking/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: {} as Booking,
          message: result.message || "Không thể tải thông tin booking"
        };
      }

      return result;
    } catch (error) {
      console.error("Get booking by ID error:", error);
      return {
        success: false,
        data: {} as Booking,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Cancel booking
  cancelBooking: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Vui lòng đăng nhập"
        };
      }

      const response = await fetch(`${API_BASE_URL}/booking/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "cancelled" })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Không thể hủy booking"
        };
      }

      return result;
    } catch (error) {
      console.error("Cancel booking error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Admin methods
  getAllBookings: async (
    page = 1,
    limit = 10,
    status?: string,
    bookingType?: string
  ): Promise<AdminBookingsResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          message: "Vui lòng đăng nhập với quyền admin"
        };
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (status) queryParams.append("status", status);
      if (bookingType) queryParams.append("bookingType", bookingType);

      const response = await fetch(
        `${API_BASE_URL}/admin/bookings?${queryParams}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          message: result.message || "Không thể tải danh sách booking"
        };
      }

      return result;
    } catch (error) {
      console.error("Get all bookings error:", error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        message: "Lỗi kết nối server"
      };
    }
  },

  updateBookingStatus: async (
    id: string,
    status: "pending" | "confirmed" | "cancelled" | "completed"
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Vui lòng đăng nhập với quyền admin"
        };
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/bookings/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Không thể cập nhật trạng thái booking"
        };
      }

      return result;
    } catch (error) {
      console.error("Update booking status error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  deleteBooking: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Vui lòng đăng nhập với quyền admin"
        };
      }

      const response = await fetch(`${API_BASE_URL}/admin/bookings/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Không thể xóa booking"
        };
      }

      return result;
    } catch (error) {
      console.error("Delete booking error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  getBookingStats: async (): Promise<BookingStatsResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          data: {
            totalBookings: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            cancelledBookings: 0,
            completedBookings: 0,
            totalRevenue: 0
          },
          message: "Vui lòng đăng nhập với quyền admin"
        };
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/bookings/stats/overview`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: {
            totalBookings: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            cancelledBookings: 0,
            completedBookings: 0,
            totalRevenue: 0
          },
          message: result.message || "Không thể tải thống kê booking"
        };
      }

      return result;
    } catch (error) {
      console.error("Get booking stats error:", error);
      return {
        success: false,
        data: {
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          completedBookings: 0,
          totalRevenue: 0
        },
        message: "Lỗi kết nối server"
      };
    }
  },

  // Get flight booking details by booking ID
  getFlightBookingDetails: async (
    bookingId: string
  ): Promise<FlightBookingResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          data: {} as FlightBookingDetail,
          message: "Vui lòng đăng nhập"
        };
      }

      const response = await fetch(
        `${API_BASE_URL}/bookingflights/booking/${bookingId}/details`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: {} as FlightBookingDetail,
          message: result.message || "Không thể tải thông tin chuyến bay"
        };
      }

      return result;
    } catch (error) {
      console.error("Get flight booking details error:", error);
      return {
        success: false,
        data: {} as FlightBookingDetail,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Get activity booking details by booking ID
  getActivityBookingDetails: async (
    bookingId: string
  ): Promise<ActivityBookingResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          data: {} as ActivityBookingDetail,
          message: "Vui lòng đăng nhập"
        };
      }

      const response = await fetch(
        `${API_BASE_URL}/bookingactivities/booking/${bookingId}/details`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: {} as ActivityBookingDetail,
          message: result.message || "Không thể tải thông tin hoạt động"
        };
      }

      return result;
    } catch (error) {
      console.error("Get activity booking details error:", error);
      return {
        success: false,
        data: {} as ActivityBookingDetail,
        message: "Lỗi kết nối server"
      };
    }
  }
};
