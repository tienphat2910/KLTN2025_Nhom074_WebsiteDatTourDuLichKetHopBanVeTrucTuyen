import { env } from "@/config/env";

const API_BASE_URL = env.API_BASE_URL;

export interface Destination {
  _id: string;
  name: string;
  country: string;
  description: string;
  image: string;
  popular: boolean;
  slug: string;
  region: "Miền Bắc" | "Miền Trung" | "Miền Nam";
  createdAt?: string;
  updatedAt?: string;
}

export interface DestinationsResponse {
  success: boolean;
  message: string;
  data: {
    destinations: Destination[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalDestinations: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface DestinationResponse {
  success: boolean;
  message: string;
  data: Destination;
}

export const destinationService = {
  // Get all destinations with pagination and filters
  getDestinations: async (params?: {
    page?: number;
    limit?: number;
    popular?: boolean;
    region?: string;
    search?: string;
  }): Promise<DestinationsResponse> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.popular !== undefined)
        queryParams.append("popular", params.popular.toString());
      if (params?.region) queryParams.append("region", params.region);
      if (params?.search) queryParams.append("search", params.search);

      const response = await fetch(
        `${API_BASE_URL}/destinations?${queryParams}`
      );
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get destinations error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {
          destinations: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalDestinations: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      };
    }
  },

  // Get popular destinations
  getPopularDestinations: async (
    limit?: number
  ): Promise<{ success: boolean; message: string; data: Destination[] }> => {
    try {
      const queryParams = limit ? `?limit=${limit}` : "";
      const response = await fetch(
        `${API_BASE_URL}/destinations/popular${queryParams}`
      );
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get popular destinations error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: []
      };
    }
  },

  // Get destination by ID
  getDestinationById: async (id: string): Promise<DestinationResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations/${id}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get destination by ID error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Destination
      };
    }
  },

  // Get destination by slug
  getDestinationBySlug: async (slug: string): Promise<DestinationResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations/slug/${slug}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get destination by slug error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Destination
      };
    }
  }
};
