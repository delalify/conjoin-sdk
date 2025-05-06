import type { BillingPaymentCardType } from './billing-payment-method-types'
import type { BillingAuditLogType } from './general-billing-types'

export const billingTransactionTypes = ['payment', 'refund'] as const
export type BillingTransactionType = (typeof billingTransactionTypes)[number]

export const billingMobileMoneyProviders = ['gh-mtn', 'gh-telecel', 'gh-airtel_tigo'] as const
export type BillingMobileMoneyProvidersType = (typeof billingMobileMoneyProviders)[number]

export const billingPaymentIntentStatuses = [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'pending',
  'processing',
  'succeeded',
  'canceled',
  'abandoned',
  'failed',
] as const
export type BillingPaymentIntentStatusType = (typeof billingPaymentIntentStatuses)[number]

export const billingPaymentIntentMobileMoneyStatuses = [
  'offline_pending',
  'otp_pending',
  'failed',
  'succeeded',
] as const
export type BillingPaymentIntentMobileMoneyStatusType = (typeof billingPaymentIntentMobileMoneyStatuses)[number]

export const billingPaymentIntentSetupFutureUsages = ['off_session', 'on_session'] as const
export type BillingPaymentIntentSetupFutureUsageType = (typeof billingPaymentIntentSetupFutureUsages)[number]

/**
 * Payment intents represent the process of collecting payment from a customer for a specific transaction.
 * They encapsulate the necessary information to initiate and manage the payment process, ensuring that
 * the payment is handled securely and efficiently.
 *
 * Each payment intent may be associated with a specific invoice or subscription, allowing for clear tracking of
 * payment status and history. Payment intents can be created for one-time payments or recurring charges,
 * depending on the billing model in use.
 *
 * Conjoin Billing reccomends using payment intents for collecting payments from customers.
 */
export type BillingPaymentIntentType = {
  /**
   * The ID of the payment intent.
   */
  payment_intent_id: string
  /**
   * The customer supplied reference ID of the payment intent.
   */
  reference_id: string
  /**
   * The ID of the customer.
   */
  customer_id: string | null
  /**
   * The description of the payment intent.
   */
  description: string | null
  /**
   * The ID of the price.
   */
  price_id?: string
  /**
   * The amount of the payment intent.
   */
  amount: number
  /**
   * The amount of the payment intent after taxes are applied.
   */
  amount_after_tax: number
  /**
   * The 3-letter ISO 4217 currency code of the payment intent.
   */
  currency: string
  /**
   * The types of payment methods that can be used to pay for the payment intent.
   */
  payment_method_types: BillingPaymentCardType[]
  /**
   * The ID of the payment method used to pay for the payment intent.
   */
  payment_method_id: string | null
  /**
   * The provider of the mobile money payment.
   */
  mobile_money?: {
    /**
     * The provider of the mobile money payment.
     */
    provider: BillingMobileMoneyProvidersType
    /**
     * The phone number of the customer.
     */
    phone_number: string
    /**
     * The status of the mobile money payment.
     *
     * `offline_pending`: The payment is pending because the user has not completed the payment process yet.
     *
     * `otp_pending`: The payment is pending because the user needs to enter a One-Time Password (OTP) to complete the payment.
     *
     * `failed`: The payment has failed.
     *
     * `succeeded`: The payment has been successfully completed.
     */
    status: BillingPaymentIntentMobileMoneyStatusType
  }
  /**
   * The email address of the customer.
   */
  customer_email: string
  /**
   * The email address of the customer to send the receipt to.
   */
  receipt_email: string
  /**
   * Defines the tax ID of the customer.
   */
  customer_tax_id?: string
  /**
   * Determines how the payment intent is used.
   *
   * `off_session`: The payment intent is intended for future off-session payments (e.g., recurring payments or subscription payments).
   *
   * `on_session`: The payment intent is intended for immediate on-session payments (e.g., one-time payments).
   */
  setup_future_usage: BillingPaymentIntentSetupFutureUsageType

  /**
   * The status of the payment intent.
   *
   * `requires_payment_method`: The payment requires a payment method to be selected.
   *
   * `requires_confirmation`: The payment needs to be confirmed. This is usually applicable to mobile money payments.
   *
   * `requires_action`: Additional action is required to complete the payment (e.g., 3D Secure authentication)
   *
   * `processing`: The payment is being processed
   *
   * `succeeded`: The payment has been successfully completed
   *
   * `canceled`: The payment has been canceled
   *
   * `abandoned`: The payment has been abandoned (e.g., user left the checkout process)
   *
   * `failed`: The payment has failed
   */
  status: BillingPaymentIntentStatusType
  /**
   * The audit logs for the payment intent.
   */
  audit_logs: BillingAuditLogType[]
}
