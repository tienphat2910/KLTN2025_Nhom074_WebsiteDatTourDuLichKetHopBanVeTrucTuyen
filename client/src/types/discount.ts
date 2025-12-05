export type DiscountType = "percentage" | "fixed";
export type ApplicableType = "all" | "tour" | "activity" | "flight";

export interface Discount {
  _id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  value: number;
  maxDiscount?: number;
  applicableType: ApplicableType;
  validFrom: Date;
  validUntil: Date;
  startDate?: Date;
  endDate?: Date;
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
  maxDiscount?: number;
  applicableType?: ApplicableType;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  isActive?: boolean;
}
