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

export interface BookingActivityPayload {
  activityId: string;
  numAdults: number;
  numChildren: number;
  numBabies: number;
  numSeniors: number;
  scheduledDate: string;
  note?: string;
  paymentMethod?: string;
  bookingId?: string;
  status?: string;
}

export const bookingActivityService = {
  createBookingActivity: async (payload: BookingActivityPayload) => {
    try {
      // Check if user is authenticated
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Vui lòng đăng nhập để đặt hoạt động"
        };
      }

      // Validate payload
      if (!payload.activityId || !payload.scheduledDate) {
        return { success: false, message: "Thông tin đặt chỗ không hợp lệ" };
      }

      const totalParticipants =
        payload.numAdults +
        payload.numChildren +
        payload.numBabies +
        payload.numSeniors;

      if (totalParticipants <= 0) {
        return {
          success: false,
          message: "Số lượng người tham gia phải lớn hơn 0"
        };
      }

      // 1. Create booking first
      const bookingPayload: any = {
        bookingDate: new Date().toISOString(),
        totalPrice: 1, // Will be updated after calculating from activity prices
        status: payload.status || "pending", // Use status from payload (confirmed for online payment)
        bookingType: "activity",
        paymentMethod: payload.paymentMethod,
        paymentStatus:
          payload.paymentMethod === "momo" ||
          payload.paymentMethod === "zalopay"
            ? "paid"
            : "pending"
      };

      console.log("Creating booking with payload:", bookingPayload);

      const bookingRes = await fetch(`${API_BASE_URL}/booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
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

      if (!bookingData.success || !bookingData.data?._id) {
        return {
          success: false,
          message: bookingData.message || "Không tạo được booking"
        };
      }

      // 2. Create booking activity with the booking ID
      const bookingActivityPayload = {
        ...payload,
        bookingId: bookingData.data._id
      };

      console.log(
        "Creating booking activity with payload:",
        bookingActivityPayload
      );

      const res = await fetch(`${API_BASE_URL}/bookingactivities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` // Add authentication header
        },
        body: JSON.stringify(bookingActivityPayload)
      });

      const result = await res.json();
      console.log("Booking activity response:", result);

      if (!res.ok) {
        console.error("Booking activity creation failed:", result);
        return {
          success: false,
          message: result.message || `Server error: ${res.status}`
        };
      }

      return result;
    } catch (error) {
      console.error("Booking activity service error:", error);
      return { success: false, message: "Lỗi kết nối server" };
    }
  },

  getBookingActivities: async () => {
    try {
      const token = getToken();
      if (!token) {
        return { success: false, message: "Vui lòng đăng nhập" };
      }

      const res = await fetch(`${API_BASE_URL}/bookingactivities`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await res.json();
      return result;
    } catch (error) {
      console.error("Get booking activities error:", error);
      return { success: false, message: "Lỗi kết nối server" };
    }
  },

  getBookingActivityById: async (id: string) => {
    try {
      const token = getToken();
      if (!token) {
        return { success: false, message: "Vui lòng đăng nhập" };
      }

      const res = await fetch(`${API_BASE_URL}/bookingactivities/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await res.json();
      return result;
    } catch (error) {
      console.error("Get booking activity error:", error);
      return { success: false, message: "Lỗi kết nối server" };
    }
  }
};
