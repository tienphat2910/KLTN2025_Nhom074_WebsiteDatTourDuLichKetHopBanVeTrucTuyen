import env from "@/config/env";

export interface AnalyticsOverview {
  overview: {
    totalRevenue: number;
    totalBookings: number;
    totalCustomers: number;
    averageOrderValue: number;
  };
  revenueByType: {
    flights: number;
    tours: number;
    activities: number;
  };
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
  topCustomers: Array<{
    _id: string;
    name: string;
    email: string;
    totalSpent: number;
    bookingCount: number;
  }>;
  statusDistribution: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

export interface RevenueTrend {
  _id: string;
  revenue: number;
  count: number;
}

export interface FlightAnalytics {
  totalFlightBookings: number;
  completedFlightBookings: number;
  revenueByAirline: Array<{
    _id: string;
    name: string;
    code: string;
    revenue: number;
    bookings: number;
  }>;
  topDestinations: Array<{
    _id: string;
    name: string;
    city: string;
    code: string;
    bookings: number;
  }>;
  cancellationRate: string;
}

export interface TourAnalytics {
  totalTourBookings: number;
  completedTourBookings: number;
  topTours: Array<{
    _id: string;
    name: string;
    destination: string;
    revenue: number;
    bookings: number;
  }>;
  revenueByDestination: Array<{
    _id: string;
    name: string;
    revenue: number;
  }>;
}

export interface ActivityAnalytics {
  totalActivityBookings: number;
  completedActivityBookings: number;
  topActivities: Array<{
    _id: string;
    name: string;
    destination: string;
    revenue: number;
    bookings: number;
  }>;
  ticketDistribution: {
    adults: number;
    children: number;
    babies: number;
    seniors: number;
    total: number;
  };
}
const analyticsService = {
  getOverview: async (
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsOverview> => {
    const token = localStorage.getItem("lutrip_admin_token");
    if (!token) {
      throw new Error("Unauthorized");
    }

    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    const url = `${env.API_BASE_URL}/admin/analytics/overview${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch analytics overview");
    }

    const result = await response.json();
    return result.data;
  },

  getRevenueTrends: async (
    period: "day" | "week" | "month" | "year" = "month"
  ): Promise<RevenueTrend[]> => {
    const token = localStorage.getItem("lutrip_admin_token");
    if (!token) {
      throw new Error("Unauthorized");
    }

    const response = await fetch(
      `${env.API_BASE_URL}/admin/analytics/revenue-trends?period=${period}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch revenue trends");
    }

    const result = await response.json();
    return result.data;
  },

  getFlightAnalytics: async (): Promise<FlightAnalytics> => {
    const token = localStorage.getItem("lutrip_admin_token");
    if (!token) {
      throw new Error("Unauthorized");
    }

    const response = await fetch(
      `${env.API_BASE_URL}/admin/analytics/flights`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch flight analytics");
    }

    const result = await response.json();
    return result.data;
  },

  getTourAnalytics: async (): Promise<TourAnalytics> => {
    const token = localStorage.getItem("lutrip_admin_token");
    if (!token) {
      throw new Error("Unauthorized");
    }

    const response = await fetch(`${env.API_BASE_URL}/admin/analytics/tours`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tour analytics");
    }

    const result = await response.json();
    return result.data;
  },

  getActivityAnalytics: async (): Promise<ActivityAnalytics> => {
    const token = localStorage.getItem("lutrip_admin_token");
    if (!token) {
      throw new Error("Unauthorized");
    }

    const response = await fetch(
      `${env.API_BASE_URL}/admin/analytics/activities`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch activity analytics");
    }

    const result = await response.json();
    return result.data;
  }
};

export default analyticsService;
