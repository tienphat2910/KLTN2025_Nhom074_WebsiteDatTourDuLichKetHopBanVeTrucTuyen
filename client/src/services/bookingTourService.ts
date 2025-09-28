import { env } from "@/config/env";

const API_BASE_URL = env.API_BASE_URL;

export interface BookingTourPayload {
  tourId: string;
  numAdults: number;
  numChildren: number;
  numInfants: number;
  priceByAge: {
    adult: number;
    child: number;
    infant: number;
  };
  subtotal: number;
  status?: string;
  passenger?: {
    fullName: string;
    phone: string;
    email: string;
    note?: string;
  };
  bookingId?: string;
}

export const bookingTourService = {
  createBookingTour: async (payload: BookingTourPayload) => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem("lutrip_token");
      if (!token) {
        return { success: false, message: "Vui lòng đăng nhập để đặt tour" };
      }

      // Validate payload
      if (!payload.tourId || payload.subtotal <= 0) {
        return { success: false, message: "Thông tin đặt tour không hợp lệ" };
      }

      // Prepare booking payload
      const bookingPayload: any = {
        bookingDate: new Date().toISOString(),
        totalPrice: Math.max(1, Math.round(payload.subtotal)),
        status: "pending",
        bookingType: "tour"
      };

      console.log("Creating booking with payload:", bookingPayload);

      const bookingRes = await fetch(`${API_BASE_URL}/booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` // Add authentication header
        },
        body: JSON.stringify(bookingPayload)
      });

      const bookingData = await bookingRes.json();
      console.log("Booking response:", bookingData);

      if (!bookingRes.ok) {
        console.error("Booking creation failed:", bookingData);
        // Handle authentication errors specifically
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

      if (!bookingData.success || !bookingData.data?._id) {
        return {
          success: false,
          message: bookingData.message || "Không tạo được booking"
        };
      }

      // 2. Create booking tour with the booking ID
      const bookingTourPayload = {
        ...payload,
        bookingId: bookingData.data._id
      };

      console.log("Creating booking tour with payload:", bookingTourPayload);

      const res = await fetch(`${API_BASE_URL}/bookingtours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingTourPayload)
      });

      const result = await res.json();
      console.log("Booking tour response:", result);

      if (!res.ok) {
        console.error("Booking tour creation failed:", result);
        return {
          success: false,
          message: result.message || `Server error: ${res.status}`
        };
      }

      return result;
    } catch (error) {
      console.error("Booking service error:", error);
      return { success: false, message: "Lỗi kết nối server" };
    }
  }
};
