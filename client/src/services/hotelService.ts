import { env } from "@/config/env";
const API_BASE_URL = env.API_BASE_URL;

export interface Room {
  type: string;
  size?: string;
  price: number;
  priceWithBreakfast?: number;
  quantity: number;
  amenities: string[];
  images: string[];
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
}

export interface Hotel {
  _id: string;
  name: string;
  destinationId: string;
  description?: string;
  rating?: number;
  rooms: Room[];
  gallery: string[];
  contactInfo?: ContactInfo;
  createdAt: string;
  updatedAt: string;
}

export interface HotelsResponse {
  success: boolean;
  data: Hotel[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface HotelResponse {
  success: boolean;
  data: Hotel;
  message?: string;
}

class HotelService {
  private baseUrl = `${API_BASE_URL}/hotels`;

  async getHotels(params?: {
    destinationId?: string;
    page?: number;
    limit?: number;
  }): Promise<HotelsResponse> {
    try {
      const searchParams = new URLSearchParams();

      if (params?.destinationId) {
        searchParams.append("destinationId", params.destinationId);
      }
      if (params?.page) {
        searchParams.append("page", params.page.toString());
      }
      if (params?.limit) {
        searchParams.append("limit", params.limit.toString());
      }

      const response = await fetch(`${this.baseUrl}?${searchParams}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching hotels:", error);
      return {
        success: false,
        data: [],
        message: "Lỗi khi tải danh sách khách sạn"
      };
    }
  }

  async getHotelById(id: string): Promise<HotelResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching hotel:", error);
      return {
        success: false,
        data: {} as Hotel,
        message: "Lỗi khi tải thông tin khách sạn"
      };
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price);
  }
}

export const hotelService = new HotelService();
