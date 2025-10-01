import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface Flight {
  _id: string;
  flightNumber: string;
  airline: string;
  departureAirport: {
    code: string;
    name: string;
    city: string;
  };
  arrivalAirport: {
    code: string;
    name: string;
    city: string;
  };
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  aircraft?: {
    model: string;
    registration: string;
  };
  seatInfo: {
    totalSeats: number;
    availableSeats: number;
    classes: {
      economy: {
        price: number;
        available: number;
      };
      business: {
        price: number;
        available: number;
      };
    };
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const flightService = {
  getAllFlights: async (): Promise<Flight[]> => {
    const response = await axios.get(`${API_URL}/flights`);
    return response.data;
  },
  getFlightById: async (id: string): Promise<Flight> => {
    const response = await axios.get(`${API_URL}/flights/${id}`);
    // Nếu backend trả về { success, data }, thì return response.data.data
    // Nếu trả về trực tiếp object chuyến bay, thì return response.data
    return response.data.data || response.data;
  },
};
