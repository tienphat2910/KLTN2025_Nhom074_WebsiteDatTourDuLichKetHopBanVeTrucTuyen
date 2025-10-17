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

      if (response.status === 401) {
        // Token expired or invalid - clear both token types
        localStorage.removeItem("lutrip_token");
        localStorage.removeItem("lutrip_user");
        localStorage.removeItem("lutrip_admin_token");
        localStorage.removeItem("lutrip_admin_user");
        return {
          success: false,
          message: "Phiên đăng nhập đã hết hạn"
        };
      }

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
  updateProfile: async (data: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    bio?: string;
  }): Promise<AuthResponse> => {
    try {
      const token = getToken();
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

      // Handle 404 - API endpoint doesn't exist
      if (response.status === 404) {
        return {
          success: false,
          message:
            "API endpoint chưa được triển khai trên server. Vui lòng thông báo cho admin."
        };
      }

      if (!response.ok) {
        // Try to parse error response
        try {
          const errorResult = await response.json();
          return {
            success: false,
            message: errorResult.message || `HTTP Error: ${response.status}`
          };
        } catch (parseError) {
          // If response is not JSON (like HTML error page)
          return {
            success: false,
            message: `Server error: ${response.status}. API endpoint có thể chưa tồn tại.`
          };
        }
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server hoặc API endpoint chưa tồn tại"
      };
    }
  },

  // Upload avatar to Cloudinary
  uploadAvatar: async (formData: FormData): Promise<AuthResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Không tìm thấy token xác thực"
        };
      }

      // Validate file before upload
      const file = formData.get("avatar") as File;
      if (!file) {
        return {
          success: false,
          message: "Không tìm thấy file ảnh"
        };
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "Kích thước file không được vượt quá 5MB"
        };
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
      ];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          message: "Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP"
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      // Handle 404 - API endpoint doesn't exist
      if (response.status === 404) {
        return {
          success: false,
          message:
            "API upload avatar chưa được triển khai trên server. Vui lòng thông báo cho admin."
        };
      }

      if (!response.ok) {
        try {
          const errorResult = await response.json();
          return {
            success: false,
            message: errorResult.message || `HTTP Error: ${response.status}`
          };
        } catch (parseError) {
          return {
            success: false,
            message: `Server error: ${response.status}. API endpoint có thể chưa tồn tại.`
          };
        }
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Upload avatar error:", error);
      return {
        success: false,
        message:
          "Lỗi kết nối server khi tải ảnh lên hoặc API endpoint chưa tồn tại"
      };
    }
  },

  // Delete avatar
  deleteAvatar: async (): Promise<AuthResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Không tìm thấy token xác thực"
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorResult = await response.json();
        return {
          success: false,
          message: errorResult.message || `HTTP Error: ${response.status}`
        };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete avatar error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server khi xóa ảnh"
      };
    }
  }
};
