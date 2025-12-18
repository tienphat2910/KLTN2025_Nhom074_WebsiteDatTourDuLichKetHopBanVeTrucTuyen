import { env } from "@/config/env";

const API_BASE_URL = env.API_BASE_URL;

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return (
    localStorage.getItem("lutrip_admin_token") ||
    localStorage.getItem("lutrip_token")
  );
};

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
  description?: string;
  destinationId: string;
  departureLocation: {
    name: string;
    code?: string;
    fullName?: string;
    region?: string;
  };
  itinerary: any;
  startDate: string;
  endDate: string;
  price: number;
  discount: number;
  pricingByAge?: {
    adult: number;
    child: number;
    infant: number;
  };
  seats: number;
  availableSeats: number;
  images?: string[];
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

export interface TourBookingDetail {
  _id: string;
  bookingId: string;
  tourId: {
    _id: string;
    title: string;
    slug: string;
    description: string;
    destination: {
      _id: string;
      name: string;
      region: string;
      image?: string;
    } | null;
    departureLocation: {
      name: string;
      region: string;
      code?: string;
    };
    startDate: string;
    endDate: string;
    duration: string;
    images?: string[];
  };
  numAdults: number;
  numChildren: number;
  numInfants: number;
  priceByAge: {
    adult: number;
    child: number;
    infant: number;
  };
  subtotal: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  note?: string;
  paymentMethod: "cash" | "momo" | "bank_transfer";
  passengers: Array<{
    _id: string;
    fullName: string;
    phone?: string;
    email?: string;
    gender: "Nam" | "Nữ";
    dateOfBirth: string;
    cccd?: string;
    type: "adult" | "child" | "infant";
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TourBookingResponse {
  success: boolean;
  data: TourBookingDetail;
  message?: string;
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
    start?: string; // thêm start
    end?: string; // thêm end
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
      if (params?.start) queryParams.append("start", params.start);
      if (params?.end) queryParams.append("end", params.end);

      const response = await fetch(`${API_BASE_URL}/tours?${queryParams}`);
      const result = await response.json();
      return result;
    } catch (error) {
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
      const response = await fetch(
        `${API_BASE_URL}/tours/featured?limit=${limit}`
      );
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: [],
          message: result.message || "Lỗi khi tải tour nổi bật"
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        data: [],
        message: "Lỗi khi tải tour nổi bật"
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
      const response = await fetch(`${API_BASE_URL}/tours/slug/${slug}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      return result;
    } catch (error) {
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Create new tour (Admin only)
  createTour: async (tourData: Partial<Tour>): Promise<ApiResponse<Tour>> => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/tours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tourData)
      });

      const result = await response.json();

      if (!response.ok) {
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Update tour by ID (regular API - no admin auth required)
  updateTour: async (
    id: string,
    data: Partial<Tour>
  ): Promise<ApiResponse<Tour>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tours/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Update tour (Admin only)
  updateTourAdmin: async (
    id: string,
    tourData: Partial<Tour>
  ): Promise<ApiResponse<Tour>> => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/tours/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tourData)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Delete tour (Admin only)
  deleteTour: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/tours/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Get tours for admin (Admin only)
  getToursAdmin: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  }): Promise<ToursResponse> => {
    try {
      const token = getAuthToken();
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.isActive !== undefined)
        queryParams.append("isActive", params.isActive.toString());
      if (params?.isFeatured !== undefined)
        queryParams.append("isFeatured", params.isFeatured.toString());

      const response = await fetch(
        `${API_BASE_URL}/admin/tours?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const result = await response.json();
      return result;
    } catch (error) {
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
    // Số ngày thực tế = diffDays + 1 (bao gồm cả ngày bắt đầu và ngày kết thúc)
    const totalDays = diffDays + 1;
    const nights = diffDays;
    return `${totalDays} Ngày ${nights} đêm`;
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
  },

  // Upload tour image (Admin only)
  uploadTourImage: async (
    file: File,
    tourId?: string
  ): Promise<ApiResponse<{ url: string; public_id: string }>> => {
    try {
      // Get token from localStorage
      const token = getAuthToken();

      if (!token) {
        return {
          success: false,
          message: "Vui lòng đăng nhập để tải ảnh lên"
        };
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("tourId", tourId || "temp");

      const response = await fetch(`${API_BASE_URL}/admin/tours/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      return result;
    } catch (error) {
      return {
        success: false,
        message: "Lỗi khi tải ảnh lên"
      };
    }
  },

  // Get tour booking details by booking ID
  getTourBookingDetails: async (
    bookingId: string
  ): Promise<TourBookingResponse> => {
    try {
      const token = getAuthToken();
      if (!token) {
        return {
          success: false,
          data: {} as TourBookingDetail,
          message: "Vui lòng đăng nhập"
        };
      }

      const response = await fetch(
        `${API_BASE_URL}/bookingtours/booking/${bookingId}/details`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          data: {} as TourBookingDetail,
          message: result.message || "Không thể tải thông tin tour"
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        data: {} as TourBookingDetail,
        message: "Lỗi kết nối server"
      };
    }
  },

  // Generate AI Itinerary (Admin only)
  generateItinerary: async (tourData: {
    title: string;
    description?: string;
    departure?: string;
    destination?: string;
    duration?: string;
    adultPrice?: number;
  }): Promise<ApiResponse<ItineraryObject>> => {
    try {
      const token = getAuthToken();
      if (!token) {
        return {
          success: false,
          message: "Vui lòng đăng nhập để sử dụng tính năng này"
        };
      }

      const response = await fetch(`${API_BASE_URL}/admin/tours/generate-itinerary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tourData)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Không thể tạo lịch trình tự động"
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: "Lỗi khi tạo lịch trình tự động"
      };
    }
  }
};
