import type { BillingTransactionType } from './billing-payment-intent-types'

export const billingChargeStatuses = ['success', 'pending', 'failed'] as const
export type BillingChargeStatusType = (typeof billingChargeStatuses)[number]

export const billingChargePaymentTypes = [
  'unknown',
  'payment_method',
  'payment_intent',
  'subscription',
  'invoice',
] as const
export type BillingChargePaymentType = (typeof billingChargePaymentTypes)[number]

/**
 * A charge is a transaction that represents a payment or refund. It is created when a payment intent is confirmed or a refund is requested. In most cases, a charge is created as a result of a payment intent.
 * However, a charge can also be created as a result of a subscription or an invoice depending on the payment strategy.
 * Multiple charges can be created as a result of a single payment intent. This is because a payment intent can be used to pay for multiple subscriptions or invoices.
 * This can also happen due to partial payments for a single invoice.
 */
export type BillingChargeType = {
  /**
   * The id of the charge.
   */
  charge_id: string
  /**
   * The id of the transaction.
   */
  transaction_id: string
  /**
   * The type of the transaction.
   *
   * `payment`: A payment transaction.
   *
   * `refund`: A refund transaction.
   */
  transaction_type: BillingTransactionType
  /**
   * The type of the payment. This is used to identify the initial or parent trigger for the charge.
   * For example, if the charge was triggered by a subscription, the payment type will be `subscription`.
   *
   * > **Note**: Subscriptions can trigger invoices, which can trigger payment intents and in turn charges. However, the `payment_type` will be `subscription` if that was the initial trigger.
   *
   * `unknown`: The payment type is unknown.
   *
   * `payment_method`: The payment was triggered by a payment method.
   *
   * `payment_intent`: The payment was triggered by a payment intent.
   *
   * `subscription`: The payment was triggered by a subscription.
   *
   * `invoice`: The payment was triggered by an invoice.
   */
  payment_type: BillingChargePaymentType
  /**
   * The status of the charge.
   *
   * `success`: The charge was successful.
   *
   * `pending`: The charge is pending.
   *
   * `failed`: The charge failed.
   */
  status: BillingChargeStatusType
  /**
   * The amount paid for the charge.
   */
  amount: number
  /**
   * The 3-letter ISO 4217 currency code of the charge.
   */
  currency: string
}
