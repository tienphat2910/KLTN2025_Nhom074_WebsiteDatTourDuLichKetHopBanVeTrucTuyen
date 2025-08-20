import { env } from "@/config/env";

const API_BASE_URL = env.API_BASE_URL;

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  code?: string;
  data?: {
    user?: {
      _id?: string;
      fullName?: string;
      email?: string;
      avatar?: string;
      phone?: string;
      role?: string;
      isVerified?: boolean;
      createdAt?: string;
      updatedAt?: string;
      [key: string]: any;
    };
    token?: string;
    email?: string;
    avatar?: string; // For avatar upload response
    [key: string]: any; // Allow additional properties
  };
}

export const authService = {
  // Register user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Resend verification email
  resendVerification: async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Resend verification error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Get user profile
  getProfile: async (token: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get profile error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Update user profile
  updateProfile: async (data: any): Promise<AuthResponse> => {
    try {
      const token = localStorage.getItem("lutrip_token");
      if (!token) {
        return {
          success: false,
          message: "Không tìm thấy token xác thực"
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Upload avatar
  uploadAvatar: async (formData: FormData): Promise<AuthResponse> => {
    try {
      const token = localStorage.getItem("lutrip_token");
      if (!token) {
        return {
          success: false,
          message: "Không tìm thấy token xác thực"
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Upload avatar error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  }
};
