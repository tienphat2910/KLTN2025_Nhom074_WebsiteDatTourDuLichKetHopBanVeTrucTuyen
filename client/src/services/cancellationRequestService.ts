import env from "@/config/env";

export interface CancellationRequest {
  _id: string;
  bookingId: string | any;
  userId: string | any;
  bookingType: "tour" | "activity" | "flight";
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  processedBy?: string | any;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCancellationRequestData {
  bookingId: string;
  reason: string;
}

export interface CancellationRequestResponse {
  success: boolean;
  data?: CancellationRequest | CancellationRequest[];
  message?: string;
}

export interface CountResponse {
  success: boolean;
  data?: { count: number };
  message?: string;
}

class CancellationRequestService {
  private baseURL = `${env.API_BASE_URL}/cancellationrequests`;

  private async getAuthHeader(): Promise<HeadersInit> {
    // Prioritize admin token when available
    const token =
      localStorage.getItem("lutrip_admin_token") ||
      localStorage.getItem("lutrip_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem("lutrip_token");
      localStorage.removeItem("lutrip_user");
      localStorage.removeItem("lutrip_admin_token");
      localStorage.removeItem("lutrip_admin_user");

      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login?expired=true";
      }

      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    // Handle 403 Forbidden - not admin (don't redirect, just throw error)
    if (response.status === 403) {
      const data = await response.json();
      throw new Error(data.message || "Truy cập bị từ chối");
    }

    // Parse JSON response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Có lỗi xảy ra");
    }

    return data;
  }

  // Create a new cancellation request
  async createRequest(
    data: CreateCancellationRequestData
  ): Promise<CancellationRequestResponse> {
    try {
      const response = await fetch(this.baseURL, {
        method: "POST",
        headers: await this.getAuthHeader(),
        body: JSON.stringify(data)
      });

      return await this.handleResponse<CancellationRequestResponse>(response);
    } catch (error) {
      console.error("Create cancellation request error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Không thể gửi yêu cầu hủy"
      };
    }
  }

  // Get all cancellation requests (Admin only)
  async getAllRequests(
    status?: "pending" | "approved" | "rejected",
    bookingType?: "tour" | "activity" | "flight"
  ): Promise<CancellationRequestResponse> {
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (bookingType) params.append("bookingType", bookingType);

      const response = await fetch(`${this.baseURL}?${params.toString()}`, {
        headers: await this.getAuthHeader()
      });

      return await this.handleResponse<CancellationRequestResponse>(response);
    } catch (error) {
      console.error("Get cancellation requests error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách yêu cầu hủy"
      };
    }
  }

  // Get user's cancellation requests
  async getUserRequests(): Promise<CancellationRequestResponse> {
    try {
      const response = await fetch(`${this.baseURL}/user`, {
        headers: await this.getAuthHeader()
      });

      return await this.handleResponse<CancellationRequestResponse>(response);
    } catch (error) {
      console.error("Get user cancellation requests error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách yêu cầu hủy"
      };
    }
  }

  // Get count of pending requests (Admin only)
  async getPendingCount(): Promise<CountResponse> {
    try {
      const response = await fetch(`${this.baseURL}/count`, {
        headers: await this.getAuthHeader()
      });

      return await this.handleResponse<CountResponse>(response);
    } catch (error) {
      // Silently fail for 403 (not admin) - don't log to console
      const errorMessage = error instanceof Error ? error.message : "";
      const isForbidden =
        errorMessage.includes("từ chối") || errorMessage.includes("admin");

      if (!isForbidden) {
        console.error("Get pending count error:", error);
      }

      return {
        success: false,
        message: errorMessage || "Không thể tải số lượng yêu cầu"
      };
    }
  }

  // Get a specific cancellation request
  async getRequestById(id: string): Promise<CancellationRequestResponse> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        headers: await this.getAuthHeader()
      });

      return await this.handleResponse<CancellationRequestResponse>(response);
    } catch (error) {
      console.error("Get cancellation request error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin yêu cầu hủy"
      };
    }
  }

  // Get cancellation request by booking ID
  async getByBookingId(
    bookingId: string
  ): Promise<CancellationRequestResponse> {
    try {
      const response = await fetch(`${this.baseURL}/booking/${bookingId}`, {
        headers: await this.getAuthHeader()
      });

      // Don't log error for 404 - it's normal when no cancellation request exists
      if (response.status === 404) {
        return {
          success: false,
          message: "Không tìm thấy yêu cầu hủy đang chờ xử lý"
        };
      }

      return await this.handleResponse<CancellationRequestResponse>(response);
    } catch (error) {
      // Only log unexpected errors
      if (!(error instanceof Error && error.message.includes("404"))) {
        console.error("Get cancellation request by booking error:", error);
      }
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin yêu cầu hủy"
      };
    }
  }

  // Approve a cancellation request (Admin only)
  async approveRequest(
    id: string,
    adminNote?: string
  ): Promise<CancellationRequestResponse> {
    try {
      const response = await fetch(`${this.baseURL}/${id}/approve`, {
        method: "PUT",
        headers: await this.getAuthHeader(),
        body: JSON.stringify({ adminNote })
      });

      return await this.handleResponse<CancellationRequestResponse>(response);
    } catch (error) {
      console.error("Approve cancellation request error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể chấp nhận yêu cầu hủy"
      };
    }
  }

  // Reject a cancellation request (Admin only)
  async rejectRequest(
    id: string,
    adminNote: string
  ): Promise<CancellationRequestResponse> {
    try {
      const response = await fetch(`${this.baseURL}/${id}/reject`, {
        method: "PUT",
        headers: await this.getAuthHeader(),
        body: JSON.stringify({ adminNote })
      });

      return await this.handleResponse<CancellationRequestResponse>(response);
    } catch (error) {
      console.error("Reject cancellation request error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể từ chối yêu cầu hủy"
      };
    }
  }
}

export const cancellationRequestService = new CancellationRequestService();
