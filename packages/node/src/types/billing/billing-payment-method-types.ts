export const billingPaymentCardTypes = ['card', 'bank_account', 'mobile_money', 'wallet'] as const
export type BillingPaymentCardType = (typeof billingPaymentCardTypes)[number]

export const billingPaymentCardBrands = [
  'visa',
  'mastercard',
  'amex',
  'discover',
  'diners',
  'jcb',
  'link',
  'gh:mtn_mobile_money',
  'gh:telecel_mobile_money',
  'gh:airtel_tigo_mobile_money',
  'unknown',
] as const
export type BillingPaymentCardBrandType = (typeof billingPaymentCardBrands)[number]

export const billingPaymentWalletBrands = ['apple_pay', 'google_pay', 'giropay', 'sofort', 'ideal', 'p24'] as const
export type BillingPaymentWalletBrandType = (typeof billingPaymentWalletBrands)[number]

export const billingPaymentCardFundingTypes = ['credit', 'debit', 'prepaid', 'unknown'] as const
export type BillingPaymentCardFundingType = (typeof billingPaymentCardFundingTypes)[number]

/**
 * In Conjoin Billing, a payment method is a way to collect payment from a customer.
 * It can be attached to a customer, subscription, payment intent or even an invoice.
 *
 * One of the best uses of payment methods is to attach them to a customer. This way, you can
 * reuse the same payment method for future payments. Multiple payment methods can be attached to a single customer
 * and you can even set a default payment method for a customer. In such cases, Conjoin Billing will automatically
 * use the default payment method for automatic billing (subscriptions or invoices) and fall back to other payment methods
 * if the default payment method fails. This behavior can be configured on the invoice level, the customer level, or even globally in your dashboards payment settings.
 */
export type BillingPaymentMethodType = {
  /**
   * The ID of the payment method.
   */
  payment_method_id: string
  /**
   * The customer supplied reference ID of the payment method.
   */
  reference_id: string
  /**
   * The ID of the customer.
   */
  customer_id: string
  /**
   * The email address of the customer.
   */
  customer_card_email: string
  /**
   * The name of the payment method.
   */
  name: string
  /**
   * The type of the payment method.
   *
   * `card`: The payment method is a credit or debit card.
   *
   * `bank_account`: The payment method is a bank account.
   *
   * `mobile_money`: The payment method is a mobile money account.
   *
   * `wallet`: The payment method is a wallet.
   */
  type: BillingPaymentCardType | null
  /**
   * The brand of the payment method.
   *
   * Possible values are `visa`, `mastercard`, `amex`, `discover`, `diners`, `jcb`, `link`, `gh:mtn_mobile_money`, `gh:telecel_mobile_money`, `gh:airtel_tigo_mobile_money`, `unknown`.
   */
  brand: BillingPaymentCardBrandType | BillingPaymentWalletBrandType | null
  /**
   * The 3-letter ISO 4217 currency code of the payment method.
   */
  currency: string | null
  /**
   * This is the ISO 3166-1 alpha-2 country code of the card issuer.
   */
  country_of_issuance: string | null
  /**
   * This is the Bank Identification Number (BIN) of the card.
   * It is a unique identifier for the bank that issued the card.
   */
  bin: string | null
  /**
   * The last 4 digits of the card number.
   */
  last4: string | null
  /**
   * The month of the card expiration date.
   */
  exp_month: number | null
  /**
   * The year of the card expiration date.
   */
  exp_year: number | null
  /**
   * The funding type of the card.
   */
  funding: BillingPaymentCardFundingType | null
  /**
   * The provider authorization code for the payment method.
   * Depending on the provider, this can be a Stripe payment method ID or a Paystack authorization code.
   */
  provider_authorisation: string | null
  /**
   * The provider signature for the payment method.
   */
  provider_signature: string | null
  /**
   * Determines if the payment method is the default payment method for the customer.
   */
  is_default: boolean
  /**
   * Determines if the payment method is active.
   */
  is_active: boolean
}
