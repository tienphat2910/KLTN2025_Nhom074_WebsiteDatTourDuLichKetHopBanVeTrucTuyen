import axios from "axios";
import { AmadeusFlightOffer } from "./flightService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ========================================
// TYPES
// ========================================

export interface AmadeusPassenger {
  type: "ADULT" | "CHILD" | "INFANT";
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  nationality?: string;
  identityNumber?: string;
  email?: string;
  phone?: string;
  selectedSeat?: {
    segmentId: string;
    seatNumber: string;
    seatPrice: number;
    seatCurrency: string;
  };
}

export interface SeatSelection {
  passengerId?: string;
  passengerName: string;
  segmentId: string;
  flightNumber: string;
  seatNumber: string;
  seatPrice: number;
  seatCurrency: string;
}

export interface AddOns {
  extraBaggage?: number;
  insurance?: boolean;
  priorityBoarding?: boolean;
  meal?: {
    selected: boolean;
    type?: string;
  };
}

export interface ContactInfo {
  email: string;
  phone: string;
  fullName?: string;
}

export interface AmadeusBookingInput {
  outboundFlightOffer: AmadeusFlightOffer;
  returnFlightOffer?: AmadeusFlightOffer;
  passengers: AmadeusPassenger[];
  seatSelections?: SeatSelection[];
  addOns?: AddOns;
  discountCode?: string;
  paymentMethod: "momo" | "zalopay" | "bank_transfer" | "cash";
  contactInfo: ContactInfo;
  specialRequests?: string;
  note?: string;
}

export interface AmadeusBooking {
  _id: string;
  userId: string;
  bookingReference: string;
  isRoundTrip: boolean;
  outboundFlight: {
    amadeusOfferId: string;
    validatingAirlineCode: string;
    validatingAirlineName: string;
    itineraries: Array<{
      duration: string;
      segments: Array<{
        segmentId: string;
        carrierCode: string;
        carrierName: string;
        flightNumber: string;
        aircraft: string;
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
        duration: string;
        cabin: string;
        class: string;
      }>;
    }>;
    lastTicketingDate?: string;
    numberOfBookableSeats?: number;
  };
  returnFlight?: {
    amadeusOfferId: string;
    validatingAirlineCode: string;
    validatingAirlineName: string;
    itineraries: Array<{
      duration: string;
      segments: Array<{
        segmentId: string;
        carrierCode: string;
        carrierName: string;
        flightNumber: string;
        aircraft: string;
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
        duration: string;
        cabin: string;
        class: string;
      }>;
    }>;
    lastTicketingDate?: string;
    numberOfBookableSeats?: number;
  };
  passengers: AmadeusPassenger[];
  pricing: {
    currency: string;
    basePrice: number;
    totalPrice: number;
    grandTotal: number;
    travelerPrices: Array<{
      travelerType: string;
      pricePerTraveler: number;
      count: number;
      subtotal: number;
    }>;
  };
  seatSelections: SeatSelection[];
  addOns: {
    extraBaggage: number;
    extraBaggagePrice: number;
    insurance: boolean;
    insurancePrice: number;
    priorityBoarding: boolean;
    priorityBoardingPrice: number;
  };
  discountCode?: string;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  paidAt?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "expired";
  contactInfo: ContactInfo;
  specialRequests?: string;
  qrCode?: string;
  barcode?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// SEATMAP TYPES
// ========================================

export interface SeatmapSeat {
  number: string;
  characteristicsCodes?: string[];
  travelerPricing?: Array<{
    travelerId: string;
    seatAvailabilityStatus: string;
    price?: {
      currency: string;
      total: string;
    };
  }>;
}

export interface SeatmapRow {
  number: number;
  seats: SeatmapSeat[];
}

export interface SeatmapDeck {
  deckType: string;
  deckConfiguration: {
    width: number;
    length: number;
    exitRowsX?: number[];
    startWingsX?: number;
    endWingsX?: number;
  };
  seats: SeatmapSeat[];
  facilities?: Array<{
    code: string;
    column?: string;
    row?: string;
  }>;
}

export interface SeatmapData {
  type: string;
  flightOfferIdRef?: string;
  segmentId?: string;
  flightNumber?: string;
  departure?: {
    iataCode: string;
    at: string;
  };
  arrival?: {
    iataCode: string;
    at: string;
  };
  decks?: SeatmapDeck[];
  aircraftCabinAmenities?: {
    power?: { isChargeable: boolean; powerType: string };
    wifi?: { isChargeable: boolean; wifiCoverage: string };
    entertainment?: Array<{ isChargeable: boolean; entertainmentType: string }>;
    food?: { isChargeable: boolean; foodType: string };
    beverage?: { isChargeable: boolean; beverageType: string };
  };
}

// ========================================
// API CALLS
// ========================================

const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};

  const adminToken = localStorage.getItem("lutrip_admin_token");
  const regularToken = localStorage.getItem("lutrip_token");
  const token = adminToken || regularToken;

  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get pricing confirmation from Amadeus
 */
export async function getAmadeusPricing(
  flightOffer: AmadeusFlightOffer | AmadeusFlightOffer[]
): Promise<{
  success: boolean;
  data: AmadeusFlightOffer[];
  dictionaries?: Record<string, unknown>;
}> {
  try {
    const offers = Array.isArray(flightOffer) ? flightOffer : [flightOffer];
    const response = await axios.post(`${API_URL}/amadeus-bookings/pricing`, {
      flightOffers: offers
    });
    return response.data;
  } catch (error) {
    console.error("Error getting pricing:", error);
    throw error;
  }
}

/**
 * Get seatmap from Amadeus
 */
export async function getAmadeusSeatmap(
  flightOffer: AmadeusFlightOffer
): Promise<{
  success: boolean;
  data: SeatmapData[];
  message?: string;
}> {
  try {
    const response = await axios.post(`${API_URL}/amadeus-bookings/seatmap`, {
      flightOffer
    });
    return response.data;
  } catch (error) {
    console.error("Error getting seatmap:", error);
    return {
      success: false,
      data: [],
      message: "Không thể lấy sơ đồ ghế"
    };
  }
}

/**
 * Create new Amadeus booking
 */
export async function createAmadeusBooking(
  input: AmadeusBookingInput
): Promise<{
  success: boolean;
  message: string;
  data?: AmadeusBooking;
}> {
  try {
    const response = await axios.post(`${API_URL}/amadeus-bookings`, input, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Error creating booking:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.message || "Lỗi khi tạo booking");
    }
    throw error;
  }
}

/**
 * Get user's bookings
 */
export async function getMyAmadeusBookings(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: AmadeusBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set("status", params.status);
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.limit) queryParams.set("limit", String(params.limit));

    const response = await axios.get(
      `${API_URL}/amadeus-bookings?${queryParams.toString()}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
}

/**
 * Get booking by ID
 */
export async function getAmadeusBookingById(id: string): Promise<{
  success: boolean;
  data: AmadeusBooking;
}> {
  try {
    const response = await axios.get(`${API_URL}/amadeus-bookings/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
}

/**
 * Get booking by reference
 */
export async function getAmadeusBookingByReference(reference: string): Promise<{
  success: boolean;
  data: AmadeusBooking;
}> {
  try {
    const response = await axios.get(
      `${API_URL}/amadeus-bookings/reference/${reference}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
}

/**
 * Cancel booking
 */
export async function cancelAmadeusBooking(
  id: string,
  reason?: string
): Promise<{
  success: boolean;
  message: string;
  data?: AmadeusBooking;
}> {
  try {
    const response = await axios.post(
      `${API_URL}/amadeus-bookings/${id}/cancel`,
      { reason },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error cancelling booking:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.message || "Lỗi khi hủy booking");
    }
    throw error;
  }
}

/**
 * Create ZaloPay payment for booking
 */
export async function createZaloPayPayment(bookingId: string): Promise<{
  success: boolean;
  message: string;
  data?: {
    order_url: string;
    app_trans_id: string;
    bookingId: string;
    bookingReference: string;
  };
}> {
  try {
    const response = await axios.post(
      `${API_URL}/amadeus-bookings/${bookingId}/payment/zalopay`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating ZaloPay payment:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data?.message || "Lỗi tạo thanh toán ZaloPay"
      );
    }
    throw error;
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(bookingId: string): Promise<{
  success: boolean;
  data?: {
    bookingId: string;
    bookingReference: string;
    paymentStatus: string;
    paymentMethod: string;
    paidAt?: string;
    zalopayStatus?: {
      return_code: number;
      return_message: string;
      statusText: string;
    };
  };
}> {
  try {
    const response = await axios.get(
      `${API_URL}/amadeus-bookings/${bookingId}/payment/status`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw error;
  }
}

/**
 * Parse seatmap to organized rows
 */
export function parseSeatmapToRows(seatmap: SeatmapData): SeatmapRow[] {
  if (!seatmap.decks || seatmap.decks.length === 0) {
    return [];
  }

  const deck = seatmap.decks[0];
  const seats = deck.seats || [];

  // Group seats by row
  const rowMap = new Map<number, SeatmapSeat[]>();

  seats.forEach((seat) => {
    const rowNum = parseInt(seat.number.match(/\d+/)?.[0] || "0");
    if (rowNum > 0) {
      if (!rowMap.has(rowNum)) {
        rowMap.set(rowNum, []);
      }
      rowMap.get(rowNum)!.push(seat);
    }
  });

  // Convert to array and sort
  const rows: SeatmapRow[] = [];
  rowMap.forEach((seats, number) => {
    // Sort seats by column letter
    seats.sort((a, b) => {
      const colA = a.number.replace(/\d+/g, "");
      const colB = b.number.replace(/\d+/g, "");
      return colA.localeCompare(colB);
    });
    rows.push({ number, seats });
  });

  // Sort rows by number
  rows.sort((a, b) => a.number - b.number);

  return rows;
}

/**
 * Get seat status and price
 */
export function getSeatInfo(seat: SeatmapSeat): {
  isAvailable: boolean;
  price: number;
  currency: string;
  characteristics: string[];
} {
  const travelerPricing = seat.travelerPricing?.[0];
  const isAvailable = travelerPricing?.seatAvailabilityStatus === "AVAILABLE";
  const price = parseFloat(travelerPricing?.price?.total || "0");
  const currency = travelerPricing?.price?.currency || "VND";
  const characteristics = seat.characteristicsCodes || [];

  return { isAvailable, price, currency, characteristics };
}

/**
 * Get seat type based on characteristics
 */
export function getSeatType(characteristics: string[]): string {
  if (characteristics.includes("W")) return "window"; // Window
  if (characteristics.includes("A")) return "aisle"; // Aisle
  if (characteristics.includes("E")) return "exit"; // Emergency exit
  if (characteristics.includes("L")) return "legroom"; // Extra legroom
  if (characteristics.includes("1") || characteristics.includes("PS"))
    return "premium"; // Premium/First class
  return "standard";
}

// Export all functions as service object
export const amadeusBookingService = {
  getAmadeusPricing,
  getAmadeusSeatmap,
  createAmadeusBooking,
  getMyAmadeusBookings,
  getAmadeusBookingById,
  getAmadeusBookingByReference,
  cancelAmadeusBooking,
  createZaloPayPayment,
  checkPaymentStatus,
  parseSeatmapToRows,
  getSeatInfo,
  getSeatType
};
