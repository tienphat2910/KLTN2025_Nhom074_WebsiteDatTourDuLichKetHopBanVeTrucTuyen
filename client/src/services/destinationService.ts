import { env } from "@/config/env";

const API_BASE_URL = env.API_BASE_URL;

export interface Destination {
  _id: string;
  name: string;
  country?: string;
  description: string;
  image: string;
  popular: boolean;
  slug: string;
  region: "Miền Bắc" | "Miền Trung" | "Miền Nam" | "Tây Nguyên";
  createdAt?: string;
  updatedAt?: string;
}

export interface DestinationFormData {
  name: string;
  country?: string;
  description: string;
  image: string;
  popular: boolean;
  region: "Miền Bắc" | "Miền Trung" | "Miền Nam" | "Tây Nguyên";
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

export interface DestinationStatsResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    popular: number;
    byRegion: {
      "Miền Bắc": number;
      "Miền Trung": number;
      "Miền Nam": number;
      "Tây Nguyên": number;
    };
  };
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

  // Get destination statistics
  getDestinationStats: async (): Promise<DestinationStatsResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations/stats`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get destination stats error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {
          total: 0,
          popular: 0,
          byRegion: {
            "Miền Bắc": 0,
            "Miền Trung": 0,
            "Miền Nam": 0,
            "Tây Nguyên": 0
          }
        }
      };
    }
  },

  // Create new destination
  createDestination: async (
    destinationData: DestinationFormData
  ): Promise<DestinationResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(destinationData)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Create destination error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Destination
      };
    }
  },

  // Update destination
  updateDestination: async (
    id: string,
    destinationData: DestinationFormData
  ): Promise<DestinationResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(destinationData)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Update destination error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Destination
      };
    }
  },

  // Delete destination
  deleteDestination: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations/${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete destination error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
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

  // Upload destination image
  uploadDestinationImage: async (
    file: File
  ): Promise<{
    success: boolean;
    message: string;
    data?: { url: string; public_id: string };
  }> => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${API_BASE_URL}/destinations/upload-image`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Upload destination image error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  }
};
