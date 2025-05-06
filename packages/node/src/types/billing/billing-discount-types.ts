export const BillingDiscountCouponDurations = ['once', 'forever', 'recurring'] as const
export type BillingDiscountCouponDurationType = (typeof BillingDiscountCouponDurations)[number]

export type BillingDiscountCouponType = {
  coupon_id: string
  reference_id: string
  coupon_code: string
  price_id: string
  discount_amount_off: number
  discount_percent_off: number
  currency: string
  duration: {
    // once: The discount is applied once.
    // forever: The discount is applied forever. This means always be applied for the price.
    // recurring: The discount is applied on a recurring basis. This is only applicable if the price is recurring
    //  For this kind of duration, the discound applied is reset based on the price reccurring interval
    interval: BillingDiscountCouponDurationType
    interval_count: number // Required if the duration interval is recurring
  }
}

export type BillingDiscountType = {
  discount_id: string
  reference_id: string
  customer_id: string
  coupon_id: string
  discount_amount: number // The actual amount of the discount based on the coupon
}
