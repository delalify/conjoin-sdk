export type BillingProductFeatureType = {
  /**
   * The name of the feature.
   */
  name: string
  /**
   * The description of the feature.
   */
  description: string
}

/**
 * A product is a service or item that can be sold to a customer. Products are used together with prices
 * to define one-time or recuring payments. A typical use case for products is where you have multiple versions
 * of a service offering and you want to maintain unique payment features for each version.
 *
 * Products essentially tracks inventory of a service or item. When used with prices, they define how payment
 * can be made for a specific product.
 */
export type BillingProductType = {
  /**
   * The ID of the product.
   */
  product_id: string
  /**
   * A customer-supplied reference ID of the product.
   */
  reference_id?: string
  /**
   * The name of the product.
   */
  name: string
  /**
   * The description of the product.
   */
  description?: string
  /**
   * The statement descriptor is the description that appears on the customer's bank or card statement.
   * Maximum 240 characters
   */
  statement_descriptor?: string
  /**
   * The unit label is the label that appears on the product's price. This is used on invoices and receipts
   * For example, if the product is a subscription, the unit label could be 'month' and it would appear as 'GHS 500 per month'
   */
  unit_label: string
  /**
   * Whether the product is active.
   */
  is_active: boolean
  /**
   * The images of the product.
   */
  images?: string[]
  /**
   * The features associated with the product. These will be displayed on the product's page.
   */
  features: BillingProductFeatureType[]
}
