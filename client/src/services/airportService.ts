import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface Airport {
  _id: string;
  name: string;
  city: string;
  iata: string;
  icao: string;
}

export const airportService = {
  async getAllAirports(): Promise<Airport[]> {
    const response = await axios.get(`${API_URL}/airports`);
    return response.data;
  },
  async getAirportById(id: string): Promise<Airport> {
    const response = await axios.get(`${API_URL}/airports/${id}`);
    return response.data;
  },
  async searchAirports(keyword: string): Promise<Airport[]> {
    // Đảm bảo endpoint đúng: /api/airports/search?keyword=xxx
    // Nếu dùng proxy hoặc Next.js API, có thể cần sửa lại API_URL cho đúng
    try {
      const response = await axios.get(`${API_URL}/airports/search`, {
        params: { keyword }
      });
      return response.data;
    } catch (err: any) {
      // Nếu bị 404, trả về mảng rỗng thay vì throw
      if (err.response && err.response.status === 404) {
        return [];
      }
      throw err;
    }
  }
};
