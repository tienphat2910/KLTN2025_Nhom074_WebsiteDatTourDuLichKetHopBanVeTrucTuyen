import { env } from "@/config/env";

const API_BASE_URL = env.API_BASE_URL;

const getToken = (): string | null => {
  const adminToken = localStorage.getItem("lutrip_admin_token");
  if (adminToken) return adminToken;
  const regularToken = localStorage.getItem("lutrip_token");
  return regularToken;
};

export interface TourInvoiceSummary {
  _id: string;
  title: string;
  image: string;
  price: number;
  duration: string;
  destinationId: {
    _id: string;
    name: string;
  };
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface ActivityInvoiceSummary {
  _id: string;
  name: string;
  image: string;
  price: number | {
    retail?: {
      adult?: number;
      child?: number;
      locker?: number;
      baby?: number;
      senior?: number;
    };
    note?: string;
  };
  location: string | { name?: string; address?: string };
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface BookingUserDetail {
  _id: string;
  bookingId: string;
  user: {
    _id: string;
    fullName: string;
    displayName?: string;
    email: string;
    phone?: string;
    avatar?: string;
    role?: string;
  };
  bookingDate: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
  numAdults?: number;
  numChildren?: number;
  numInfants?: number;
  quantity?: number;
  passengers?: Array<{
    fullName: string;
    phone?: string;
    email?: string;
    gender: string;
    dateOfBirth: string;
  }>;
  note?: string;
  createdAt: string;
}

export interface TourBookingsResponse {
  success: boolean;
  data: {
    tour: TourInvoiceSummary;
    bookings: BookingUserDetail[];
  };
  message?: string;
}

export interface ActivityBookingsResponse {
  success: boolean;
  data: {
    activity: ActivityInvoiceSummary;
    bookings: BookingUserDetail[];
  };
  message?: string;
}

export const invoiceService = {
  // Get all tours with booking statistics
  getTourInvoices: async (): Promise<{
    success: boolean;
    data?: TourInvoiceSummary[];
    message?: string;
  }> => {
    try {
      const token = getToken();
      if (!token) {
        return { success: false, message: "Vui lòng đăng nhập" };
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/invoices/tours`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || "Không thể tải dữ liệu tour",
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get tour invoices error:", error);
      return {
        success: false,
        message: "Lỗi kết nối đến server",
      };
    }
  },

  // Get all activities with booking statistics
  getActivityInvoices: async (): Promise<{
    success: boolean;
    data?: ActivityInvoiceSummary[];
    message?: string;
  }> => {
    try {
      const token = getToken();
      if (!token) {
        return { success: false, message: "Vui lòng đăng nhập" };
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/invoices/activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || "Không thể tải dữ liệu hoạt động",
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get activity invoices error:", error);
      return {
        success: false,
        message: "Lỗi kết nối đến server",
      };
    }
  },

  // Get booking details for a specific tour
  getTourBookings: async (
    tourId: string
  ): Promise<TourBookingsResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Vui lòng đăng nhập",
        } as TourBookingsResponse;
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/invoices/tours/${tourId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || "Không thể tải dữ liệu đặt tour",
        } as TourBookingsResponse;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get tour bookings error:", error);
      return {
        success: false,
        message: "Lỗi kết nối đến server",
      } as TourBookingsResponse;
    }
  },

  // Get booking details for a specific activity
  getActivityBookings: async (
    activityId: string
  ): Promise<ActivityBookingsResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Vui lòng đăng nhập",
        } as ActivityBookingsResponse;
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/invoices/activities/${activityId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message:
            errorData.message || "Không thể tải dữ liệu đặt hoạt động",
        } as ActivityBookingsResponse;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Get activity bookings error:", error);
      return {
        success: false,
        message: "Lỗi kết nối đến server",
      } as ActivityBookingsResponse;
    }
  },
};
