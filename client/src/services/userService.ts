import { env } from "@/config/env";

const API_BASE_URL = env.API_BASE_URL;

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin";
  status: "active" | "inactive" | "banned";
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  totalBookings: number;
  totalSpent: number;
}

export interface UserFormData {
  fullName: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  isVerified?: boolean;
}

export interface UsersResponse {
  success: boolean;
  data?: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

export interface UserResponse {
  success: boolean;
  data?: User;
  message?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  data?: User;
  message?: string;
}

export const userService = {
  // Get all users with pagination and filters
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }): Promise<UsersResponse> => {
    try {
      const token = localStorage.getItem("lutrip_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.status) queryParams.append("status", params.status);
      if (params?.role) queryParams.append("role", params.role);

      const response = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      return data;
    } catch (error) {
      console.error("Get users error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<UserResponse> => {
    try {
      const token = localStorage.getItem("lutrip_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch user");
      }

      return data;
    } catch (error) {
      console.error("Get user error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  },

  // Update user
  updateUser: async (
    userId: string,
    userData: Partial<UserFormData>
  ): Promise<UpdateUserResponse> => {
    try {
      const token = localStorage.getItem("lutrip_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      return data;
    } catch (error) {
      console.error("Update user error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  },

  // Delete user
  deleteUser: async (
    userId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem("lutrip_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      return data;
    } catch (error) {
      console.error("Delete user error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  },

  // Ban user
  banUser: async (userId: string): Promise<UpdateUserResponse> => {
    try {
      const token = localStorage.getItem("lutrip_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to ban user");
      }

      return data;
    } catch (error) {
      console.error("Ban user error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  },

  // Unban user
  unbanUser: async (userId: string): Promise<UpdateUserResponse> => {
    try {
      const token = localStorage.getItem("lutrip_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}/unban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to unban user");
      }

      return data;
    } catch (error) {
      console.error("Unban user error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  },

  // Get user statistics
  getUserStats: async (): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> => {
    try {
      const response = await userService.getUsers({ limit: 1000 }); // Get all users for stats

      if (!response.success || !response.data) {
        return response;
      }

      const users = response.data.users;
      const stats = {
        total: users.length,
        active: users.filter((u: User) => u.status === "active").length,
        inactive: users.filter((u: User) => u.status === "inactive").length,
        banned: users.filter((u: User) => u.status === "banned").length,
        admins: users.filter((u: User) => u.role === "admin").length,
        totalBookings: users.reduce(
          (sum: number, u: User) => sum + u.totalBookings,
          0
        ),
        totalSpent: users.reduce(
          (sum: number, u: User) => sum + u.totalSpent,
          0
        )
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error("Get user stats error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
};
