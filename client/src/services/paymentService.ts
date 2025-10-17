import { env } from "../config/env";

// Helper function to get the correct token based on user role
const getToken = (): string | null => {
  // First try admin token
  const adminToken = localStorage.getItem("lutrip_admin_token");
  if (adminToken) return adminToken;

  // Then try regular token
  const regularToken = localStorage.getItem("lutrip_token");
  if (regularToken) return regularToken;

  return null;
};

export interface MoMoPaymentRequest {
  amount: number;
  orderInfo: string;
  extraData?: string;
}

export interface MoMoPaymentResponse {
  success: boolean;
  data?: {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    responseTime: number;
    message: string;
    resultCode: number;
    payUrl: string;
    deeplink?: string;
    qrCodeUrl?: string;
  };
  message?: string;
}

export interface MoMoStatusResponse {
  success: boolean;
  data?: {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    resultCode: number;
    message: string;
    responseTime: number;
  };
  message?: string;
}

class PaymentService {
  private baseURL = env.API_BASE_URL;

  /**
   * Create MoMo payment
   */
  async createMoMoPayment(
    paymentData: MoMoPaymentRequest
  ): Promise<MoMoPaymentResponse> {
    try {
      const token = getToken();

      const response = await fetch(`${this.baseURL}/payment/momo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create payment");
      }

      return result;
    } catch (error) {
      console.error("Create MoMo payment error:", error);
      throw error;
    }
  }

  /**
   * Check MoMo payment status
   */
  async checkMoMoPaymentStatus(orderId: string): Promise<MoMoStatusResponse> {
    try {
      const token = getToken();

      const response = await fetch(
        `${this.baseURL}/payment/momo/check-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({ orderId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to check payment status");
      }

      return result;
    } catch (error) {
      console.error("Check MoMo payment status error:", error);
      throw error;
    }
  }

  /**
   * Redirect to MoMo payment page
   */
  redirectToMoMoPayment(payUrl: string): void {
    window.location.href = payUrl;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
