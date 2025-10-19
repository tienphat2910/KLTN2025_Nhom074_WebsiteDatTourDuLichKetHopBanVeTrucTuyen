import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface FlightClass {
  _id: string;
  flightCode: string;
  className: string;
  price: number;
  baggageAllowance: number;
  cabinBaggage: number;
  availableSeats: number;
  amenities: string[];
}

export interface FlightSchedule {
  _id: string;
  flightCode: string;
  departureDate: string;
  arrivalDate: string;
  status: string;
  remainingSeats: number;
  currentPrice: number;
  delay?: {
    minutes: number;
    reason: string;
  };
  gate?: string;
}

export interface Flight {
  _id: string;
  flightCode: string;
  airlineId: {
    _id: string;
    name: string;
    code: string;
    logo?: string;
  };
  departureAirportId: {
    _id: string;
    name: string;
    city: string;
    iata: string;
    icao: string;
  };
  arrivalAirportId: {
    _id: string;
    name: string;
    city: string;
    iata: string;
    icao: string;
  };
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  basePrice: number;
  availableSeats: number;
  status: string;
  aircraft?: {
    model: string;
    registration: string;
  };
  classes?: FlightClass[];
  schedule?: FlightSchedule;
  upcomingSchedules?: FlightSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface FlightSearchResult {
  success: boolean;
  data: Flight[];
  count: number;
}

export const flightService = {
  getAllFlights: async (): Promise<Flight[]> => {
    const response = await axios.get(`${API_URL}/flights`);
    return response.data.success ? response.data.data : [];
  },

  searchFlights: async (params: {
    from: string;
    to: string;
    date: string;
  }): Promise<Flight[]> => {
    const response = await axios.get(`${API_URL}/flights/search`, { params });
    return response.data.success ? response.data.data : [];
  },

  getFlightById: async (id: string): Promise<Flight> => {
    const response = await axios.get(`${API_URL}/flights/${id}`);
    return response.data.success ? response.data.data : response.data;
  }
};
