import { env } from "@/config/env";

const API_BASE_URL = env.API_BASE_URL;

export interface PassengerInfo {
  fullName: string;
  phone?: string;
  email?: string;
  gender: string;
  dateOfBirth: string;
  cccd?: string;
  type: "adult" | "child" | "infant";
}

export interface BookingFlightPayload {
  flightId: string;
  numAdults: number;
  numChildren: number;
  numInfants: number;
  priceByClass: {
    economy: number;
    business: number;
  };
  classType: "economy" | "business";
  subtotal: number;
  status?: string;
  passengers?: PassengerInfo[];
  note?: string;
  paymentMethod?: string;
  bookingId?: string;
}

export const bookingFlightService = {
  createBookingFlight: async (payload: BookingFlightPayload) => {
    try {
      const token = localStorage.getItem("lutrip_token");
      if (!token) {
        return { success: false, message: "Vui lòng đăng nhập để đặt vé máy bay" };
      }
      if (!payload.flightId || payload.subtotal <= 0) {
        return { success: false, message: "Thông tin đặt vé không hợp lệ" };
      }
      // 1. Create booking
      const bookingPayload: any = {
        bookingDate: new Date().toISOString(),
        totalPrice: Math.max(1, Math.round(payload.subtotal)),
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
          localStorage.removeItem("lutrip_user");
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
        headers: { "Content-Type": "application/json" },
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
