import { env } from "@/config/env";
import { Discount, DiscountFormData } from "@/types/discount";

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

export interface DiscountsResponse {
  success: boolean;
  message: string;
  data: {
    discounts: Discount[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalDiscounts: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface DiscountResponse {
  success: boolean;
  message: string;
  data: Discount;
}

export const discountService = {
  // Get all discounts with pagination and filters
  getDiscounts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    discountType?: string;
    isActive?: boolean;
  }): Promise<DiscountsResponse> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.discountType)
        queryParams.append("discountType", params.discountType);
      if (params?.isActive !== undefined)
        queryParams.append("isActive", params.isActive.toString());

      const response = await fetch(`${API_BASE_URL}/discounts?${queryParams}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get discounts error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {
          discounts: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalDiscounts: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      };
    }
  },

  // Get discount by ID
  getDiscountById: async (id: string): Promise<DiscountResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/discounts/${id}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get discount by ID error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Discount
      };
    }
  },

  // Create new discount
  createDiscount: async (
    discountData: DiscountFormData
  ): Promise<DiscountResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Không tìm thấy token xác thực",
          data: {} as Discount
        };
      }
      const response = await fetch(`${API_BASE_URL}/discounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(discountData)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Create discount error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Discount
      };
    }
  },

  // Update discount
  updateDiscount: async (
    id: string,
    discountData: Partial<DiscountFormData>
  ): Promise<DiscountResponse> => {
    try {
      const token = getToken();
      if (!token) {
        return {
          success: false,
          message: "Không tìm thấy token xác thực",
          data: {} as Discount
        };
      }
      const response = await fetch(`${API_BASE_URL}/discounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(discountData)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Update discount error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Discount
      };
    }
  },

  // Delete discount
  deleteDiscount: async (
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
      const response = await fetch(`${API_BASE_URL}/discounts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete discount error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Validate discount code
  validateDiscount: async (code: string): Promise<DiscountResponse> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/discounts/validate/${code}`
      );
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Validate discount error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Discount
      };
    }
  }
};
