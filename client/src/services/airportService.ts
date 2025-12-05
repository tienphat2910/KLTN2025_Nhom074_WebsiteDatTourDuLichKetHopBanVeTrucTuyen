import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface Airport {
  _id: string;
  name: string;
  city: string;
  iata: string;
  icao: string;
}

// Amadeus Airport type
export interface AmadeusAirport {
  type: string;
  subType: string;
  name: string;
  detailedName?: string;
  id?: string;
  self?: { href: string };
  timeZoneOffset?: string;
  iataCode: string;
  geoCode?: {
    latitude: number;
    longitude: number;
  };
  address?: {
    cityName: string;
    cityCode: string;
    countryName: string;
    countryCode: string;
    regionCode?: string;
  };
  analytics?: {
    travelers?: {
      score: number;
    };
  };
}

// Amadeus Airline type
export interface AmadeusAirline {
  type: string;
  iataCode: string;
  icaoCode?: string;
  businessName: string;
  commonName?: string;
}

// Flight Inspiration type
export interface FlightDestination {
  type: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: {
    total: string;
  };
  links?: {
    flightDates?: string;
    flightOffers?: string;
  };
}

// Cheapest Date type
export interface CheapestDate {
  type: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: {
    total: string;
  };
  links?: {
    flightOffers?: string;
  };
}

export const airportService = {
  // ========================================
  // LOCAL DATABASE METHODS
  // ========================================
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
  },

  // ========================================
  // AMADEUS API METHODS
  // ========================================

  /**
   * Search airports using Amadeus API
   */
  async searchAmadeusAirports(
    keyword: string,
    countryCode?: string
  ): Promise<AmadeusAirport[]> {
    try {
      const response = await axios.get(`${API_URL}/flights/amadeus/airports`, {
        params: { keyword, countryCode }
      });
      return response.data.success ? response.data.data : [];
    } catch (err) {
      console.error("Error searching Amadeus airports:", err);
      return [];
    }
  },

  /**
   * Get all Vietnam airports from Amadeus
   */
  async getVietnamAirports(keyword?: string): Promise<{
    data: AmadeusAirport[];
    vietnamAirportCodes: string[];
  }> {
    try {
      const response = await axios.get(
        `${API_URL}/flights/amadeus/airports/vietnam`,
        {
          params: keyword ? { keyword } : {}
        }
      );
      return {
        data: response.data.success ? response.data.data : [],
        vietnamAirportCodes: response.data.vietnamAirportCodes || []
      };
    } catch (err) {
      console.error("Error getting Vietnam airports:", err);
      return { data: [], vietnamAirportCodes: [] };
    }
  },

  /**
   * Get nearest airports by coordinates
   */
  async getNearestAirports(
    latitude: number,
    longitude: number,
    radius?: number
  ): Promise<AmadeusAirport[]> {
    try {
      const response = await axios.get(
        `${API_URL}/flights/amadeus/airports/nearest`,
        {
          params: { latitude, longitude, radius }
        }
      );
      return response.data.success ? response.data.data : [];
    } catch (err) {
      console.error("Error getting nearest airports:", err);
      return [];
    }
  },

  /**
   * Search airlines using Amadeus API
   */
  async searchAmadeusAirlines(airlineCodes: string): Promise<AmadeusAirline[]> {
    try {
      const response = await axios.get(`${API_URL}/flights/amadeus/airlines`, {
        params: { airlineCodes }
      });
      return response.data.success ? response.data.data : [];
    } catch (err) {
      console.error("Error searching Amadeus airlines:", err);
      return [];
    }
  },

  /**
   * Get Vietnam airlines from Amadeus
   */
  async getVietnamAirlines(): Promise<{
    data: AmadeusAirline[];
    vietnamAirlines: string[];
  }> {
    try {
      const response = await axios.get(
        `${API_URL}/flights/amadeus/airlines/vietnam`
      );
      return {
        data: response.data.success ? response.data.data : [],
        vietnamAirlines: response.data.vietnamAirlines || []
      };
    } catch (err) {
      console.error("Error getting Vietnam airlines:", err);
      return { data: [], vietnamAirlines: [] };
    }
  },

  /**
   * Get flight inspiration - cheapest destinations from origin
   */
  async getFlightInspiration(params: {
    origin: string;
    departureDate?: string;
    oneWay?: boolean;
    duration?: number;
    nonStop?: boolean;
    maxPrice?: number;
    currency?: string;
  }): Promise<{
    data: FlightDestination[];
    dictionaries: Record<string, any>;
  }> {
    try {
      const response = await axios.get(
        `${API_URL}/flights/amadeus/inspiration`,
        {
          params
        }
      );
      return {
        data: response.data.success ? response.data.data : [],
        dictionaries: response.data.dictionaries || {}
      };
    } catch (err) {
      console.error("Error getting flight inspiration:", err);
      return { data: [], dictionaries: {} };
    }
  },

  /**
   * Get cheapest flight dates for a route
   */
  async getCheapestFlightDates(params: {
    origin: string;
    destination: string;
    departureDate?: string;
    oneWay?: boolean;
    duration?: number;
    nonStop?: boolean;
    maxPrice?: number;
    currency?: string;
  }): Promise<{
    data: CheapestDate[];
    dictionaries: Record<string, any>;
  }> {
    try {
      const response = await axios.get(
        `${API_URL}/flights/amadeus/cheapest-dates`,
        {
          params
        }
      );
      return {
        data: response.data.success ? response.data.data : [],
        dictionaries: response.data.dictionaries || {}
      };
    } catch (err) {
      console.error("Error getting cheapest flight dates:", err);
      return { data: [], dictionaries: {} };
    }
  },

  /**
   * Get flight schedules for a specific flight
   */
  async getFlightSchedules(params: {
    carrierCode: string;
    flightNumber: string;
    scheduledDepartureDate: string;
  }): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/flights/amadeus/schedules`, {
        params
      });
      return response.data.success ? response.data.data : [];
    } catch (err) {
      console.error("Error getting flight schedules:", err);
      return [];
    }
  }
};
