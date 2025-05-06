/**
 * In Conjoin Billing, a customer is a person or business entity that uses your product or service.
 * It can be used to create payment methods, subscriptions, invoices, and charges. Additionally, it can be used to store payment details, track payments, or store contact information.
 */
export type BillingCustomerType = {
  /**
   * The ID of the customer.
   */
  customer_id: string
  /**
   * The customer supplied reference ID.
   */
  reference_id: string
  /**
   * The name of the customer.
   */
  name?: string
  /**
   * The email address of the customer.
   */
  email: string
  /**
   * The phone number of the customer.
   */
  phone?: string
  /**
   * The billing address of the customer.
   * It usually contains the primary address where the customer receives billing-related correspondence.
   */
  address?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    // The ISO 3166-1 alpha-2 country code of the customer's address
    country: string
  }
  /**
   * The shipping address is the address where the customer wants the invoice, reciept, or subscription to be shipped to.
   * This address is shown on invoices and receipts
   */
  shipping_address?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    // The ISO 3166-1 alpha-2 country code of the customer's address
    country: string
  }
  /**
   * These settings are used to configure the invoice settings for the customer.
   */
  invoice_settings?: {
    /**
     * This is the ID of the payment method that will be used to pay for invoices.
     */
    payment_method: string | null
    /**
     * Determines if the customer allows multiple payment methods for their invoices.
     * This will be disregarded if it's set on the invoice level.
     */
    allow_multiple_payment_methods: boolean | null
  }
  /**
   * Defines payment settings for the customer.
   */
  payment_settings: {
    /**
     * The default currency of the customer.
     */
    default_currency: string | null
    /**
     * The tax ID of the customer.
     */
    tax_id: string | null
  }
}
