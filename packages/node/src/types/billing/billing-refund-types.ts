import type { BillingChargeStatusType } from './billing-charge-types'

export const billingRefundFulfilmentTypes = ['full', 'partial', 'none'] as const
export type BillingRefundFulfilmentType = (typeof billingRefundFulfilmentTypes)[number]

/**
 * A refund is a transaction that is used to return a previous charge to a customer.
 * Refunds can only be made on the payment card that was used to make the original charge.
 *
 * Refunds may be supported for some mobile money payments.
 */
export type BillingRefundType = {
  /**
   * The ID of the refund.
   */
  refund_id: string
  /**
   * A customer-supplied reference ID of the refund.
   */
  reference_id: string
  /**
   * The ID of the payment intent that the refund is associated with.
   */
  charge_id: string
  /**
   * The status of the refund.
   */
  status: BillingChargeStatusType
  /**
   * The type of fulfilment of the refund.
   *
   * `full`: The refund is for the full amount of the charge.
   *
   * `partial`: The refund is for a partial amount of the charge.
   *
   * `none`: The refund is for no amount of the charge.
   */
  fulfilment_type: BillingRefundFulfilmentType
  /**
   * The amount of the refund (in the smallest currency unit).
   */
  amount: number
  /**
   * The 3-letter ISO 4217 currency code of the refund.
   */
  currency: string
}
