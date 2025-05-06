export type BillingPriceTierType = {
  /**
   * The flat amount is the fixed charge for this tier, regardless of the quantity.
   * This is typically used in tiered or volume pricing schemes.
   * Example: A flat fee of $10 for the first 100 units in a tier.
   */
  flat_amount: number
  /**
   * The unit amount is the price per unit for this tier.
   * This is used in per_unit, tiered, and volume pricing schemes.
   * Example: $0.50 per unit for units 101-1000 in a tier.
   */
  unit_amount: number
  /**
   * The upper bound of this tier. The lower bound is the upper bound of the previous tier plus 1
   */
  up_to: number | null
}

export const BillingPriceModeTypes = ['recurring', 'one_time'] as const
export type BillingPriceModeType = (typeof BillingPriceModeTypes)[number]

export const BillingPriceBillingSchemes = ['per_unit', 'tiered', 'volume'] as const
export type BillingPriceBillingSchemeType = (typeof BillingPriceBillingSchemes)[number]

export const BillingPriceTiersModes = ['graduated', 'volume'] as const
export type BillingPriceTiersModeType = (typeof BillingPriceTiersModes)[number]

export const BillingPriceRecurringIntervals = ['day', 'week', 'month', 'year'] as const
export type BillingPriceRecurringIntervalType = (typeof BillingPriceRecurringIntervals)[number]

export const BillingPriceUsageTypes = ['licensed', 'metered'] as const
export type BillingPriceUsageType = (typeof BillingPriceUsageTypes)[number]

export const BillingPriceTaxBehaviors = ['exclusive', 'inclusive', 'unspecified'] as const
export type BillingPriceTaxBehaviorType = (typeof BillingPriceTaxBehaviors)[number]

export const BillingPriceAggregateUsages = ['sum', 'max', 'last_during_period', 'last_ever'] as const
export type BillingPriceAggregateUsageType = (typeof BillingPriceAggregateUsages)[number]

export type BillingCurrencyOptionsType = {
  [key: string]: {
    /**
     * The amount of the price.
     */
    amount: number
    /**
     * The currency of the price.
     */
    currency: string
    /**
     * The tax behavior of the price.
     *
     * `exclusive`: The tax is applied to the price before any discounts are applied.
     *
     * `inclusive`: The tax is applied to the price after any discounts are applied.
     *
     * `unspecified`: The tax behavior is not specified.
     */
    tax_behavior: BillingPriceTaxBehaviorType
  }
}

/**
 * Prices are used with products to define the payment terms of a service provided to a customer.
 * Conjoin Billing allows you to configure the currency, amount, type of billing and several other configurations
 * for a price.
 *
 * Let's assume Acme Corp is a software company that sells a subscription to their software. They have different
 * versions of their software and they want to charge different prices for each version. They can create two products
 * for their software:
 * - Basic
 * - Pro
 *
 * They can then create a price for each product:
 * - Basic
 *  - `basic_monthly_price`: $10/month
 *  - `basic_yearly_price`: $100/year
 * - Pro
 *  - `pro_monthly_price`: $20/month
 *  - `pro_yearly_price`: $200/year
 *
 * They can then create a subscription for a customer and assign the `pro_yearly_price` to it.
 * The subscription will automatically use the `pro_yearly_price` for monthly payments to the customer.
 */
export type BillingPriceType = {
  /**
   * The ID of the price.
   */
  price_id: string
  /**
   * The reference ID of the price.
   */
  reference_id: string
  /**
   * The ID of the product.
   */
  product_id: string
  /**
   * The 3-letter ISO 4217 currency code of the price.
   */
  currency: string
  /**
   * The currency options of the price. This is used to define the price in different currencies.
   * For single payments, Conjoin Billing will select any available currency option that matches the customer's currency, if it exists.
   *
   * To simplify calculations, currency options are not used for subscription plans or invoice line items.
   */
  currency_options: BillingCurrencyOptionsType | null
  /**
   * The price amount (in the smallest currency unit).
   */
  amount: number
  /**
   * The mode of the price.
   *
   * `recurring`: The price is charged on a recurring basis.
   * Eg: $100 per month. A real-world example is a subscription where the price is charged monthly.
   *
   * `one_time`: The price is charged one-time.
   * Eg: $100 one-time. A real-world example is a one-time payment for a product or service.
   */
  type: BillingPriceModeType
  /**
   * The billing scheme of the price. This determines how the price is calculated.
   *
   * `per_unit`: The price is charged per unit.
   * Eg: $1 per unit. A real-world example is a product where the price is charged per unit.
   *
   * `tiered`: The price has a tiered pricing structure, where the price is calculated based on the usage.
   * Eg: 0 - 100 units: $1 per unit, 101 - 200 units: $2 per unit, 201 - 300 units: $3 per unit
   *
   * `volume`: The price has a volume pricing structure, where the price is calculated based on the total volume of usage.
   * Eg: 0 - 100 units: $1 per unit, 101 - 200 units: $0.90 per unit for all units, 201+ units: $0.80 per unit for all units
   */
  billing_scheme: BillingPriceBillingSchemeType
  /**
   * The tiers of the price.
   */
  tiers: BillingPriceTierType[]
  /**
   * The mode of the tiers.
   *
   * `graduated`: The price has a tiered pricing structure, where the price is calculated based on the usage.
   * Eg: 0 - 100 units: $1 per unit, 101 - 200 units: $0.90 per unit, 201+ units: $0.80 per unit
   *
   * `volume`: The price has a volume pricing structure, where the price is calculated based on the total volume of usage.
   * Eg: 0 - 100 units: $1 per unit, 101 - 200 units: $0.90 per unit for all units, 201+ units: $0.80 per unit for all units
   */
  tiers_mode: BillingPriceTiersModeType
  /**
   * This specifies how the price is calculated for recurring prices. This will not apply to one-time prices.
   */
  recurring?: {
    /**
     * The interval of the price.
     *
     * `day`: The price is charged on a daily basis.
     *
     * `week`: The price is charged on a weekly basis.
     *
     * `month`: The price is charged on a monthly basis.
     *
     * `year`: The price is charged on a yearly basis.
     */
    interval: BillingPriceRecurringIntervalType
    /**
     * The number of intervals between each subscription billing. For example, if interval is month and interval_count is 3,
     * the customer will be billed every 3 months
     */
    interval_count: number
    /**
     * The usage type of the price. Can be licensed or metered. When creating a new price the default is licensed.
     *
     * `licensed`: The price is charged based on the number of licenses or seats.
     * Eg: 100 licenses, $1000 per license. A real-world example is a software subscription where the price is based on the number of users.
     *
     * `metered`: The price is charged based on the actual usage of a resource.
     * Eg: 1000 units, $1 per unit. A real-world example is a usage-based pricing model where the price is based on the amount of data transferred.
     */
    usage_type: BillingPriceUsageType
    /**
     * This only applies to metered prices. The default is sum if the usage type is metered, otherwise it is null.
     *
     * `sum`: Adds up all usage during the billing period. For example, if a customer uses 100 units on day 1 and 200 units on day 2, the total usage would be 300 units.
     *
     * `max`: Takes the highest usage value during the billing period. For example, if a customer uses 100 units on day 1 and 200 units on day 2, the total usage would be 200 units.
     *
     * `last_during_period`: Uses the final usage value recorded in the billing period. For example, if a customer uses 100 units on day 1 and 200 units on day 2, the total usage would be 200 units.
     *
     * `last_ever`: Uses the most recent usage value ever recorded, even if it was before the current billing period. For example, if a customer used 300 units last month but hasn't used any this month, the usage would be 300 units.
     */
    aggregate_usage: BillingPriceAggregateUsageType | null
  }
  /**
   * Whether the price is active.
   */
  is_active: boolean
  /**
   * The tax behavior of the price.
   *
   * `exclusive`: The tax is applied to the price before any discounts are applied.
   *
   * `inclusive`: The tax is applied to the price after any discounts are applied.
   *
   * `unspecified`: The tax behavior is not specified.
   */
  tax_behavior: BillingPriceTaxBehaviorType
}
