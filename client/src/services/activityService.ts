import { env } from "@/config/env";
import { Activity } from "@/types/activity";

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

export interface ActivitiesResponse {
  success: boolean;
  message: string;
  data: {
    activities: Activity[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalActivities: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ActivityResponse {
  success: boolean;
  message: string;
  data: Activity;
}

export const activityService = {
  // Get all activities with pagination and filters
  getActivities: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    destinationId?: string;
    popular?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ActivitiesResponse> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.destinationId)
        queryParams.append("destinationId", params.destinationId);
      if (params?.popular !== undefined)
        queryParams.append("popular", params.popular.toString());
      if (params?.minPrice)
        queryParams.append("minPrice", params.minPrice.toString());
      if (params?.maxPrice)
        queryParams.append("maxPrice", params.maxPrice.toString());

      const response = await fetch(`${API_BASE_URL}/activities?${queryParams}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get activities error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {
          activities: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalActivities: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      };
    }
  },

  // Get activity by ID
  getActivityById: async (id: string): Promise<ActivityResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${id}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get activity by ID error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Activity
      };
    }
  },

  // Get activity by slug
  getActivityBySlug: async (slug: string): Promise<ActivityResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/slug/${slug}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get activity by slug error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Activity
      };
    }
  },

  // Create new activity (Admin only)
  createActivity: async (
    activityData: Partial<Activity>
  ): Promise<ActivityResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Không tìm thấy token xác thực",
          data: {} as Activity
        };
      }

      const response = await fetch(`${API_BASE_URL}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(activityData)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Create activity error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Activity
      };
    }
  },

  // Update activity
  updateActivity: async (
    id: string,
    activityData: Partial<Activity>
  ): Promise<ActivityResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Không tìm thấy token xác thực",
          data: {} as Activity
        };
      }

      const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(activityData)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Update activity error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Activity
      };
    }
  },

  // Delete activity
  deleteActivity: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Không tìm thấy token xác thực"
        };
      }

      const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete activity error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Toggle popular status
  togglePopular: async (
    id: string,
    popular: boolean
  ): Promise<ActivityResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Không tìm thấy token xác thực",
          data: {} as Activity
        };
      }

      const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ popular })
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Toggle popular error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Activity
      };
    }
  },

  // Format price for display
  formatPrice: (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  }
};
