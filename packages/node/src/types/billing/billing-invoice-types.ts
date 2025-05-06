import type { BillingInvoicingOptionType } from './billing-subscription-types'

export const billingInvoiceStatuses = ['draft', 'open', 'paid', 'uncollectible', 'void'] as const
export type BillingInvoiceStatusType = (typeof billingInvoiceStatuses)[number]

export const billingInvoicePdfPaperSizes = ['a4', 'letter'] as const
export type BillingInvoicePdfPaperSizeType = (typeof billingInvoicePdfPaperSizes)[number]

export const billingInvoiceSmartRetryStrategyOptions = ['aggressive', 'moderate', 'conservative'] as const
export type BillingInvoiceSmartRetryStrategyOptionType = (typeof billingInvoiceSmartRetryStrategyOptions)[number]

/**
 * Invoices are payment instructions for a customer to pay for a product or service. They serve as formal requests for payment from customers,
 * detailing the amounts owed for products or services.
 *
 * They can be generated as one-time charges or as part of a recurring billing cycle through subscriptions.
 * Each invoice may include various line items, adjustments for proration due to subscription changes, and other
 * relevant billing information to ensure accurate and transparent invoicing.
 *
 * Invoices can be configured for automatic billing, where they are finalised and sent to the customer without
 * manual intervention. This process allows for a grace period (typically about an hour) to make any necessary adjustments before the
 * invoice is dispatched. Alternatively, invoices can be set to manual finalisation, requiring user action to
 * complete the billing process.
 *
 */
export type BillingInvoiceType = {
  /**
   * The ID of the invoice.
   */
  invoice_id: string
  /**
   * A customer-supplied reference ID of the invoice.
   */
  reference_id?: string
  /**
   * The ID of the customer associated with the invoice.
   */
  customer_id: string
  /**
   * The IDs of the prices associated with the invoice.
   *
   * > **NOTE:** A single invoice cannot have `price_ids` and `subscription_id` at the same time.
   * > If the invoice was generated for a subscription, the `subscription_id` will be present otherwise the `price_ids` will be present.
   */
  price_ids: string[]
  /**
   * The ID of the subscription associated with the invoice. This may be `null` if the invoice was generated for a one-time charge.
   */
  subscription_id: string | null
  /**
   * The total amount (in the smallest currency unit) before any discounts and taxes are applied.
   */
  subtotal: number
  /**
   * The total amount (in the smallest currency unit) of taxes applied to the invoice.
   */
  tax_amount: number
  /**
   * The total amount (in the smallest currency unit) to be paid after all discounts and taxes are applied.
   * The customer will be charged this amount.
   */
  amount_due: number
  /**
   * The amount (in the smallest currency unit) that has been paid for the invoice.
   */
  amount_paid: number
  /**
   * The amount (in the smallest currency unit) that is still due for the invoice.
   * This is the difference between the `amount_due` and the `amount_paid`.
   */
  amount_remaining: number
  /**
   * The currency of the invoice.
   */
  currency: string
  /**
   * This is the ID of the charge that was used to pay for the invoice.
   * This is only present if the invoice has been paid.
   */
  charge_id: string | null
  /**
   * This is the ID of the payment intent that was used to pay for the invoice.
   * This is only present if an attempt was made to pay for the invoice.
   */
  payment_intent_id: string | null
  /**
   * This is the description of the invoice.
   * This is typically used to provide a short description of the invoice.
   */
  description: string
  /**
   * The text to be displayed at the bottom of the invoice.
   */
  footer_text: string | null
  /**
   * A unique identifier for the invoice. This will be automatically generated if not provided.
   *
   * If your invoicing system relies solely on Conjoin Billing, it is recommened not to set this value
   * so that it can be automatically generated. This will prevent any potential conflicts.
   *
   * It is worth noting that, many jurisdictions require an invoice number to be present, unique and sequential.
   */
  invoice_number: string
  /**
   * This determines if the invoice will be automatically finalised. A finalised invoice is one that has been sent to the customer.
   */
  automatic_finalisation: {
    /**
     * If set to `false`, the invoice will be in draft mode until you manually finalise it via the dashboard or API.
     * When `true`, the invoice will be automatically sent to the customer about 1 hour after the invoice is created. This gives you time to add more items to the invoice before it is sent.
     *
     * The default is `true`.
     */
    is_enabled: boolean
    /**
     * The date and time when the invoice will be automatically finalised.
     */
    date: Date | null
  }
  /**
   * The status of the invoice.
   *
   * `draft`: The invoice has not yet been issued.
   * `open`: The invoice has been issued and is awaiting payment.
   * `paid`: The invoice has been paid.
   * `uncollectible`: The invoice has been marked as uncollectible. This means that the payment for this invoice
   * could not be collected, usually due to issues like insufficient funds, expired cards, or closed accounts.
   * `void`: The invoice has been voided. This means the invoice is no longer valid.
   */
  status: BillingInvoiceStatusType
  /**
   * This determines how the invoice will be managed.
   *
   * `automatic_charge`: The invoice will be automatically sent to the customer and a payment will be attempted.
   *
   * `manual_finalisation`: The invoice will remain in draft mode until you manually finalise it via the dashboard or API.
   */
  invoicing_option: BillingInvoicingOptionType
  /**
   * The hosted invoice URL where the customer can pay the invoice.
   * This is only present if the invoice is `open`.
   */
  invoice_url: string | null
  /**
   * Line items are the individual items that make up the invoice.
   * Each line item represents a product or service that is being charged to the customer.
   */
  line_items: {
    /**
     * The ID of the price associated with the line item. If price ID is present,
     * it will be used to calculate the amount of the line item.
     */
    price_id: string | null
    /**
     * The ID of the discount associated with the line item.
     */
    discount_id: string | null
    /**
     * The 3-letter ISO 4217 currency code of the line item.
     */
    currency: string
    /**
     * The unit price of the line item.
     */
    unit_price: number
    /**
     * The quantity of the line item.
     */
    quantity: number
    /**
     * The amount of the discount applied to the line item.
     */
    discount_amount: number
    /**
     * The total cost of the line item (before taxes). If available,
     * `unit_price` multiplied by `quantity` will determine this value.
     */
    amount: number
    /**
     * The total cost of the line item (after taxes).
     */
    amount_after_taxes: number
    /**
     * The description of the line item.
     */
    description: string
  }[]
  /**
   * Determines the date and time when the first payment attempt was made for the invoice.
   */
  attempted_at: Date | null
  /**
   * The number of times the invoice has been retried for payment.
   * This is only present if the invoice has been attempted to be paid.
   */
  retry_count: number
  /**
   * Additional fields that are displayed to the customer on the invoice.
   */
  custom_fields: Array<{
    name: string
    value: string
  }>
  /**
   * The date and time when the invoice is due.
   */
  due_date: Date | null
  /**
   * Determines if the invoice has been fully paid.
   */
  is_paid: boolean
  /**
   * Determines if the invoice was manually marked as paid.
   */
  is_paid_without_charge: boolean
  /**
   * The payment method used to pay for the invoice.
   */
  payment_method_id: string | null

  /**
   * The payment settings for the invoice.
   */
  payment_settings: {
    /**
     * Determines if the invoice will use another active payment method if the default payment method fails.
     * This will take precedence over the customer's invoice settings via `customer.invoice_settings.allow_multiple_payment_methods`.
     */
    allow_multiple_payment_methods: boolean | null
    /**
     * The URL of the payment page for the invoice. This will be null if the invoice has not yet been finalised.
     */
    payment_url: string | null
  }
  /**
   * The email settings for the invoice.
   */
  email_settings: {
    /**
     * Determines if an email will be sent to the customer when the invoice is finalised. Default is `true`.
     */
    send_email_when_finalised: boolean
    /**
     * The email address of the customer to send the invoice to. If the customer's email is not provided, the email will not be sent.
     */
    customer_email: string | null
  }
  /**
   * The display settings for the invoice.
   */
  display_settings: {
    /**
     * The paper size of the invoice.
     */
    pdf_paper_size: BillingInvoicePdfPaperSizeType
  }
}
