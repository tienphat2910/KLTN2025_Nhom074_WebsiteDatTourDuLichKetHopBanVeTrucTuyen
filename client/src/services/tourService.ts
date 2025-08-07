import { env } from "@/config/env";

const API_BASE_URL = env.API_BASE_URL;

export interface ItineraryDay {
  title: string;
  description: string;
}

// New interface for object-based itinerary
export interface ItineraryObject {
  [key: string]: ItineraryDay;
}

// Define ApiResponse interfaces - Remove duplicate
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface Tour {
  _id: string;
  title: string;
  description: string;
  destinationId: string;
  departureLocation: {
    name: string;
  };
  itinerary: ItineraryDay[] | ItineraryObject | any; // Support multiple formats
  startDate: string;
  endDate: string;
  price: number;
  discount: number;
  pricingByAge: {
    adult: number;
    child: number;
    infant: number;
  };
  seats: number;
  availableSeats: number;
  images: string[];
  isFeatured: boolean;
  rating?: number;
  reviewCount?: number;
  category?: string;
  duration?: string;
  slug: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ToursResponse {
  success: boolean;
  message: string;
  data: {
    tours: Tour[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTours: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface TourResponse {
  success: boolean;
  message: string;
  data: Tour;
}

export const tourService = {
  // Get all tours with pagination and filters
  getTours: async (params?: {
    page?: number;
    limit?: number;
    destination?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    departure?: string;
    title?: string; // Add title for search capability
  }): Promise<ToursResponse> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.destination)
        queryParams.append("destination", params.destination);
      if (params?.category) queryParams.append("category", params.category);
      if (params?.minPrice)
        queryParams.append("minPrice", params.minPrice.toString());
      if (params?.maxPrice)
        queryParams.append("maxPrice", params.maxPrice.toString());
      if (params?.featured !== undefined)
        queryParams.append("featured", params.featured.toString());
      if (params?.departure) queryParams.append("departure", params.departure);
      if (params?.title) queryParams.append("title", params.title); // Add support for title search

      const response = await fetch(`${API_BASE_URL}/tours?${queryParams}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get tours error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {
          tours: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalTours: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      };
    }
  },

  // Get featured tours
  getFeaturedTours: async (
    limit?: number
  ): Promise<{ success: boolean; message: string; data: Tour[] }> => {
    try {
      const queryParams = limit ? `?limit=${limit}` : "";
      const response = await fetch(
        `${API_BASE_URL}/tours/featured${queryParams}`
      );
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get featured tours error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: []
      };
    }
  },

  // Get tour by ID
  getTourById: async (id: string): Promise<TourResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tours/${id}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get tour by ID error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server",
        data: {} as Tour
      };
    }
  },

  // Get tour by slug
  getTourBySlug: async (slug: string): Promise<ApiResponse<Tour>> => {
    try {
      console.log(`🌐 API Call: ${API_BASE_URL}/tours/slug/${slug}`);

      const response = await fetch(`${API_BASE_URL}/tours/slug/${slug}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      console.log(`📡 Response status: ${response.status}`);
      console.log(`📡 Response ok: ${response.ok}`);

      const result = await response.json();
      console.log(`📦 Response data:`, result);

      return result;
    } catch (error) {
      console.error("❌ Get tour by slug error:", error);
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Format price for display
  formatPrice: (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  },

  // Calculate discounted price
  getDiscountedPrice: (price: number, discount: number): number => {
    return price - (price * discount) / 100;
  },

  // Format duration
  formatDuration: (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nights = diffDays - 1;
    return `${diffDays}N${nights}Đ`;
  },

  // Format date display
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  },

  // Calculate discount percentage
  getDiscountPercentage: (
    originalPrice: number,
    currentPrice: number
  ): number => {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
};
