export type DiscountType = "percentage" | "fixed";

export interface Discount {
  _id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  value: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscountFormData {
  code: string;
  description: string;
  discountType: DiscountType;
  value: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  isActive?: boolean;
}
