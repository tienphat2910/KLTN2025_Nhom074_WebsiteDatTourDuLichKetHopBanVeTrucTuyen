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

export interface PassengerInfo {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  gender: "Nam" | "Nữ";
  dateOfBirth: string;
  identityNumber?: string;
  seatNumber?: string;
  nationality?: string;
}

export interface BookingFlightPayload {
  flightId: string;
  flightCode: string;
  flightClassId: string;
  numTickets: number;
  pricePerTicket: number;
  totalFlightPrice: number;
  discountAmount?: number;
  finalTotal?: number;
  discountCode?: string;
  status?: string;
  passengers?: PassengerInfo[];
  note?: string;
  paymentMethod?: string;
  bookingId?: string;
}

export const bookingFlightService = {
  createBookingFlight: async (payload: BookingFlightPayload) => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Vui lòng đăng nhập để đặt vé máy bay"
        };
      }
      if (!payload.flightId || payload.totalFlightPrice <= 0) {
        return { success: false, message: "Thông tin đặt vé không hợp lệ" };
      }
      // 1. Create booking
      const bookingPayload: any = {
        bookingDate: new Date().toISOString(),
        totalPrice: Math.max(
          1,
          Math.round(payload.finalTotal || payload.totalFlightPrice)
        ),
        status: "pending",
        bookingType: "flight"
      };
      const bookingRes = await fetch(`${API_BASE_URL}/booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bookingPayload)
      });
      const bookingData = await bookingRes.json();
      if (!bookingRes.ok || !bookingData.success || !bookingData.data?._id) {
        if (bookingRes.status === 401) {
          localStorage.removeItem("lutrip_token");
          localStorage.removeItem("lutrip_admin_token");
          localStorage.removeItem("lutrip_user");
          localStorage.removeItem("lutrip_admin_user");
          return {
            success: false,
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
            requireAuth: true
          };
        }
        return {
          success: false,
          message: bookingData.message || `Server error: ${bookingRes.status}`
        };
      }
      // 2. Create booking flight
      const bookingFlightPayload = {
        ...payload,
        bookingId: bookingData.data._id
      };
      const res = await fetch(`${API_BASE_URL}/bookingflights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` // Add authentication header
        },
        body: JSON.stringify(bookingFlightPayload)
      });
      const result = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: result.message || `Server error: ${res.status}`
        };
      }
      return result;
    } catch (error) {
      return { success: false, message: "Lỗi kết nối server" };
    }
  }
};
