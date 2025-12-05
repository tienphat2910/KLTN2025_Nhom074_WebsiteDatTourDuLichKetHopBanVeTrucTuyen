import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ========================================
// AMADEUS FLIGHT TYPES
// ========================================

export interface AmadeusFlightSegment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  operating?: {
    carrierCode: string;
  };
  duration: string;
  numberOfStops: number;
}

export interface AmadeusItinerary {
  duration: string;
  segments: AmadeusFlightSegment[];
}

export interface AmadeusTravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: {
    currency: string;
    total: string;
    base: string;
  };
  fareDetailsBySegment: Array<{
    segmentId: string;
    cabin: string;
    fareBasis: string;
    class: string;
    includedCheckedBags?: {
      weight?: number;
      weightUnit?: string;
      quantity?: number;
    };
  }>;
}

export interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: AmadeusItinerary[];
  price: {
    currency: string;
    total: string;
    base: string;
    fees?: Array<{
      amount: string;
      type: string;
    }>;
    grandTotal: string;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: AmadeusTravelerPricing[];
}

export interface AmadeusSearchResponse {
  success: boolean;
  data: AmadeusFlightOffer[];
  dictionaries: {
    locations?: Record<string, { cityCode: string; countryCode: string }>;
    aircraft?: Record<string, string>;
    currencies?: Record<string, string>;
    carriers?: Record<string, string>;
  };
  meta?: {
    count: number;
    links?: Record<string, string>;
  };
  count: number;
}

export interface AmadeusSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  includedAirlineCodes?: string;
  excludedAirlineCodes?: string;
  nonStop?: boolean;
  currencyCode?: string;
  maxPrice?: number;
  max?: number;
}

// Mapped flight type for UI display (similar to MegaTrip)
export interface MappedAmadeusFlight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departure: {
    time: string;
    airport: string;
    city: string;
    date: string;
    terminal?: string;
  };
  arrival: {
    time: string;
    airport: string;
    city: string;
    date: string;
    terminal?: string;
  };
  duration: string;
  aircraft: string;
  price: number;
  currency: string;
  originalPrice?: number;
  class: string;
  baggage: {
    handbag?: {
      weight?: number;
      pieces?: number;
      unit?: string;
    };
    checkin?: {
      weight?: number;
      pieces?: number;
      unit?: string;
    };
  };
  amenities: {
    wifi?: { available: boolean; free?: boolean; price?: string };
    meal?: {
      included: boolean;
      available?: boolean;
      price?: string;
      type?: string;
    };
    entertainment?: { available: boolean; screens?: string };
    power?: { available: boolean; type?: string };
    priority?: boolean;
  };
  policies: {
    cancellable?: boolean;
    changeable?: boolean;
    refundable?: string;
    cancellationFee?: string;
    changeFee?: string;
  };
  availableSeats: number;
  stopsCount: number;
  stopsText: string;
  benefits?: string[];
  promotions?: Array<{ code: string; description: string; valid?: string }>;
  raw: AmadeusFlightOffer; // Keep raw for booking
}

// ========================================
// LEGACY LOCAL DATABASE TYPES (kept for backward compatibility)
// ========================================

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

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Convert ISO duration (e.g. PT2H10M) to readable format '2h 10m'
 */
export function convertDuration(iso: string | undefined): string {
  if (!iso) return "";
  const matchH = iso.match(/(\d+)H/);
  const matchM = iso.match(/(\d+)M/);
  const h = matchH ? `${matchH[1]}h` : "";
  const m = matchM ? `${matchM[1]}m` : "";
  return [h, m].filter(Boolean).join(" ");
}

/**
 * Map Amadeus flight offer to UI-friendly format
 */
export function mapAmadeusOfferToFlight(
  offer: AmadeusFlightOffer,
  dictionaries: AmadeusSearchResponse["dictionaries"],
  idx: number
): MappedAmadeusFlight {
  const itineraries = offer.itineraries || [];
  const firstItin = itineraries[0] || {};
  const segments = firstItin.segments || [];
  const firstSeg = segments[0] || ({} as AmadeusFlightSegment);
  const lastSeg = segments[segments.length - 1] || firstSeg;

  const depAt = firstSeg.departure?.at || "";
  const arrAt = lastSeg.arrival?.at || "";
  const depDate = depAt.split("T")[0] || "";
  const arrDate = arrAt.split("T")[0] || "";
  const depTime = depAt.split("T")[1]?.slice(0, 5) || "";
  const arrTime = arrAt.split("T")[1]?.slice(0, 5) || "";

  // Airline info
  const carrier =
    (offer.validatingAirlineCodes && offer.validatingAirlineCodes[0]) ||
    firstSeg.carrierCode ||
    "";
  const airlineName = dictionaries?.carriers?.[carrier] || carrier || "Unknown";

  // Aircraft info
  const aircraftCodes = [
    ...new Set(segments.map((s) => s.aircraft?.code).filter(Boolean))
  ];
  const aircraft =
    aircraftCodes
      .map((c) => dictionaries?.aircraft?.[c as string] || c)
      .join(" / ") || "";

  // Stops info
  const stopsCount = Math.max(0, segments.length - 1);
  const stopsText = stopsCount === 0 ? "Bay thẳng" : `${stopsCount} điểm dừng`;

  // Cabin/class from traveler pricing
  const traveler = offer.travelerPricings?.[0];
  const cabins = (traveler?.fareDetailsBySegment || [])
    .map((f) => f.cabin)
    .filter(Boolean);
  const cabinText =
    cabins.length > 0 ? cabins.join("/") : traveler?.travelerType || "ECONOMY";

  // Baggage info
  const fareSeg = traveler?.fareDetailsBySegment?.[0];
  const includedChecked = fareSeg?.includedCheckedBags;

  // Price
  const priceStr = String(offer.price?.total || offer.price?.grandTotal || "0");
  const currency = offer.price?.currency || "VND";
  const priceNumeric = Number(priceStr) || 0;

  return {
    id: String(offer.id) || `offer-${idx}`,
    airline: airlineName,
    airlineCode: carrier,
    flightNumber: `${firstSeg.carrierCode || ""}${firstSeg.number || ""}`,
    departure: {
      time: depTime,
      airport: firstSeg.departure?.iataCode || "",
      city: firstSeg.departure?.iataCode || "",
      date: depDate,
      terminal: firstSeg.departure?.terminal
    },
    arrival: {
      time: arrTime,
      airport: lastSeg.arrival?.iataCode || "",
      city: lastSeg.arrival?.iataCode || "",
      date: arrDate,
      terminal: lastSeg.arrival?.terminal
    },
    duration: convertDuration(firstItin.duration),
    aircraft,
    price: priceNumeric,
    currency,
    originalPrice: priceNumeric + 300000,
    class: cabinText || "ECONOMY",
    baggage: {
      handbag: {
        weight: 7,
        unit: "kg"
      },
      checkin: {
        weight: includedChecked?.weight,
        pieces: includedChecked?.quantity,
        unit: includedChecked?.weightUnit
      }
    },
    amenities: {
      wifi: { available: false },
      meal: { included: false, available: true, price: "Từ 120.000đ" },
      entertainment: { available: false },
      power: { available: false },
      priority: false
    },
    policies: {
      cancellable: false,
      changeable: false,
      refundable: "Xem điều khoản hãng"
    },
    availableSeats: offer.numberOfBookableSeats || 0,
    stopsCount,
    stopsText,
    benefits: [],
    promotions: [],
    raw: offer
  };
}

// ========================================
// FLIGHT SERVICE
// ========================================

export const flightService = {
  // ========================================
  // AMADEUS API METHODS
  // ========================================

  /**
   * Search flights using Amadeus API
   */
  searchAmadeusFlights: async (
    params: AmadeusSearchParams
  ): Promise<AmadeusSearchResponse> => {
    try {
      const response = await axios.get(`${API_URL}/flights/amadeus/search`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error("Error searching Amadeus flights:", error);
      return {
        success: false,
        data: [],
        dictionaries: {},
        count: 0
      };
    }
  },

  /**
   * Search and map Amadeus flights to UI format
   */
  searchAndMapAmadeusFlights: async (
    params: AmadeusSearchParams
  ): Promise<MappedAmadeusFlight[]> => {
    try {
      const response = await axios.get(`${API_URL}/flights/amadeus/search`, {
        params
      });
      if (response.data.success && response.data.data) {
        return response.data.data.map(
          (offer: AmadeusFlightOffer, idx: number) =>
            mapAmadeusOfferToFlight(offer, response.data.dictionaries, idx)
        );
      }
      return [];
    } catch (error) {
      console.error("Error searching Amadeus flights:", error);
      return [];
    }
  },

  /**
   * Get flight pricing from Amadeus
   */
  getAmadeusPricing: async (flightOffer: AmadeusFlightOffer): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/flights/amadeus/pricing`, {
        flightOffer
      });
      return response.data;
    } catch (error) {
      console.error("Error getting Amadeus pricing:", error);
      throw error;
    }
  },

  /**
   * Get seat map from Amadeus
   */
  getAmadeusSeatmap: async (flightOffer: AmadeusFlightOffer): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/flights/amadeus/seatmap`, {
        flightOffer
      });
      return response.data;
    } catch (error) {
      console.error("Error getting Amadeus seatmap:", error);
      throw error;
    }
  },

  /**
   * Search airports from Amadeus
   */
  searchAmadeusAirports: async (
    keyword: string,
    countryCode?: string
  ): Promise<any> => {
    try {
      const response = await axios.get(`${API_URL}/flights/amadeus/airports`, {
        params: { keyword, countryCode }
      });
      return response.data;
    } catch (error) {
      console.error("Error searching airports:", error);
      return { success: false, data: [], count: 0 };
    }
  },

  /**
   * Get all Vietnam airports from Amadeus
   */
  getVietnamAirports: async (keyword?: string): Promise<any> => {
    try {
      const response = await axios.get(
        `${API_URL}/flights/amadeus/airports/vietnam`,
        {
          params: keyword ? { keyword } : {}
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting Vietnam airports:", error);
      return { success: false, data: [], vietnamAirportCodes: [], count: 0 };
    }
  },

  /**
   * Get nearest airports by coordinates
   */
  getNearestAirports: async (
    latitude: number,
    longitude: number,
    radius?: number
  ): Promise<any> => {
    try {
      const response = await axios.get(
        `${API_URL}/flights/amadeus/airports/nearest`,
        {
          params: { latitude, longitude, radius }
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting nearest airports:", error);
      return { success: false, data: [], count: 0 };
    }
  },

  /**
   * Search airlines by codes
   */
  searchAmadeusAirlines: async (airlineCodes: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_URL}/flights/amadeus/airlines`, {
        params: { airlineCodes }
      });
      return response.data;
    } catch (error) {
      console.error("Error searching airlines:", error);
      return { success: false, data: [], count: 0 };
    }
  },

  /**
   * Get all Vietnam airlines from Amadeus
   */
  getVietnamAirlines: async (): Promise<any> => {
    try {
      const response = await axios.get(
        `${API_URL}/flights/amadeus/airlines/vietnam`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting Vietnam airlines:", error);
      return { success: false, data: [], vietnamAirlines: [], count: 0 };
    }
  },

  /**
   * Get flight schedules for a specific flight
   */
  getAmadeusFlightSchedules: async (params: {
    carrierCode: string;
    flightNumber: string;
    scheduledDepartureDate: string;
  }): Promise<any> => {
    try {
      const response = await axios.get(`${API_URL}/flights/amadeus/schedules`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error("Error getting flight schedules:", error);
      return { success: false, data: [], count: 0 };
    }
  },

  /**
   * Get flight inspiration - cheapest destinations from origin
   */
  getFlightInspiration: async (params: {
    origin: string;
    departureDate?: string;
    oneWay?: boolean;
    duration?: number;
    nonStop?: boolean;
    maxPrice?: number;
    currency?: string;
  }): Promise<any> => {
    try {
      const response = await axios.get(
        `${API_URL}/flights/amadeus/inspiration`,
        {
          params
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting flight inspiration:", error);
      return { success: false, data: [], dictionaries: {}, count: 0 };
    }
  },

  /**
   * Get cheapest flight dates for a route
   */
  getCheapestFlightDates: async (params: {
    origin: string;
    destination: string;
    departureDate?: string;
    oneWay?: boolean;
    duration?: number;
    nonStop?: boolean;
    maxPrice?: number;
    currency?: string;
  }): Promise<any> => {
    try {
      const response = await axios.get(
        `${API_URL}/flights/amadeus/cheapest-dates`,
        {
          params
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting cheapest flight dates:", error);
      return { success: false, data: [], dictionaries: {}, count: 0 };
    }
  },

  // ========================================
  // LEGACY LOCAL DATABASE METHODS
  // ========================================

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
  },

  // Get seat map for a specific flight schedule
  getSeatMap: async (flightId: string, scheduleId: string): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/flights/${flightId}/seats`, {
      params: { scheduleId }
    });
    return response.data.success ? response.data.data : [];
  },

  // Reserve seats for a schedule (called by server booking service, not client directly in current flow)
  reserveSeats: async (
    flightId: string,
    scheduleId: string,
    seats: string[],
    bookingFlightId?: string,
    bookingId?: string
  ): Promise<any> => {
    const response = await axios.post(
      `${API_URL}/flights/${flightId}/reserve-seats`,
      {
        scheduleId,
        seats,
        bookingFlightId,
        bookingId
      }
    );
    return response.data;
  },

  getFlights: async (): Promise<FlightSearchResult> => {
    try {
      const response = await axios.get(`${API_URL}/flights`);
      return {
        success: response.data.success || false,
        data: response.data.data || [],
        count: response.data.data?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        count: 0
      };
    }
  }
};
