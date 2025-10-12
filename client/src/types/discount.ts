export type DiscountType = "percentage" | "fixed"

export interface Discount {
  _id: string
  code: string
  description: string
  discountType: DiscountType
  value: number
  validFrom: Date
  validUntil: Date
  usageLimit: number
  usedCount: number
}

export interface DiscountFormData {
  code: string
  description: string
  discountType: DiscountType
  value: number
  validFrom: Date
  validUntil: Date
  usageLimit: number
}