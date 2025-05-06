import type {
  BillingPriceAggregateUsageType,
  BillingPriceRecurringIntervalType,
  BillingPriceTaxBehaviorType,
  BillingPriceUsageType,
} from './billing-price-types'

//  Eg: The subscription is paused and the customer will not be billed until the subscription is resumed.
export const billingSubscriptionStatuses = [
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'trailing',
  'unpaid',
  'paused',
] as const
export type BillingSubscriptionStatusType = (typeof billingSubscriptionStatuses)[number]

export const billingSubscriptionProrationBehaviors = [
  'always_prorate',
  'never_prorate',
  'prorate_upgrades',
  'prorate_downgrades',
] as const
export type BillingSubscriptionProrationBehaviorType = (typeof billingSubscriptionProrationBehaviors)[number]

export const billingSubscriptionProrationApplicationTimings = ['immediate', 'next_billing_cycle'] as const
export type BillingSubscriptionProrationApplicationTimingType =
  (typeof billingSubscriptionProrationApplicationTimings)[number]

export const billingSubscriptionCancellationTerminationBehaviors = ['end_immediately', 'end_of_period'] as const
export type BillingSubscriptionCancellationTerminationBehaviorType =
  (typeof billingSubscriptionCancellationTerminationBehaviors)[number]

export const billingSubscriptionRefundPolicies = ['no_refund', 'prorated_refund', 'full_refund'] as const
export type BillingSubscriptionRefundPolicyType = (typeof billingSubscriptionRefundPolicies)[number]

export type BillingSubscriptionPlanType = {
  /**
   * The id of the plan.
   */
  plan_id: string
  /**
   * The ID of the price associated with the plan. If price ID is present,
   * it will be used to calculate the amount of the plan.
   */
  price_id: string | null
  /**
   * The ID of the discount associated with the plan.
   */
  discount_id: string | null
  /**
   * The 3-letter ISO 4217 currency code of the plan.
   */
  currency: string
  /**
   * The unit price of the plan.
   */
  unit_price: number
  /**
   * The quantity of the plan.
   */
  quantity: number
  /**
   * The amount of the discount applied to the plan.
   */
  discount_amount: number
  /**
   * The total cost of the plan (before taxes).
   */
  amount: number
  /**
   * The total cost of the plan (after taxes).
   */
  amount_after_taxes: number
  /**
   * The description of the plan.
   */
  description: string
  /**
   * The start date of the plan.
   */
  start_date: Date | null
  /**
   * The end date of the plan.
   */
  end_date: Date | null
  /**
   * The interval of the plan. This is synonymous with the `recurring.interval` field of the price.\
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
   * The usage type of the plan. See the `recurring.usage_type` field of the price for more information.
   */
  usage_type: BillingPriceUsageType
  /**
   * See the `recurring.aggregate_usage` field of the price for more information.
   */
  aggregate_usage: BillingPriceAggregateUsageType | null
  /**
   * The tax behavior of the plan. See the `tax_behavior` field of the price for more information.
   */
  tax_behavior: BillingPriceTaxBehaviorType
}

export const billingInvoicingOptions = ['automatic_charge', 'manual_finalisation'] as const
export type BillingInvoicingOptionType = (typeof billingInvoicingOptions)[number]

export const billingSubscriptionPaymentStrategies = [
  'allow_incomplete',
  'auto_incomplete',
  'reject_if_incomplete',
] as const
export type BillingSubscriptionPaymentStrategyType = (typeof billingSubscriptionPaymentStrategies)[number]

/**
 * A subscription is a recurring payment that is assigned to a customer for a product or service.
 * When a subscription is created, multiple checks will be made depending on the `invoicing_option` and `payment_strategy` fields.
 *
 * If the `invoicing_option` is `automatic_charge` and the `payment_strategy` is `allow_incomplete`,
 * the subscription will be created and the customer will be billed immediately, otherwise
 * the subscription will be created in `incomplete` status. Even if a charge is attempted automatically and the payment
 * fails, the subscription will remain in `incomplete` status.
 *
 * When `trial_end_date` is present, the subscription will be created in `trailing` status.
 *
 * > [!NOTE]
 * > The subscription will remain in `trailing` status until the trial period ends, at which point the
 * > subscription will attempt to collect payment and transition to "active" (or possibly "incomplete" if the payment fails).
 * > `trial_start_date` is always set by Conjoin Billing and never set by the customer.
 *
 * When a subscription is created with an invalid or inactive payment method, Conjoin Billing will fail
 * to create the subscription and return an error regardless of the `payment_strategy`.
 *
 * The subscription plans are used to determine the payment cycles for the subscription. A subscription can have multiple cycles
 * depending on the `recurring` nature of the price that is referenced by the plan. This also means that **only** recurring prices
 * are supported for subscriptions.
 *
 * It is also possible to create a subscription without any prices, in which case you have to provide all the neccessary information
 * to populate the `plans` field. If the price for a plan is present, it will always be used to prefill the plan information.
 *
 * To determine the billing cycles for a subscription, the `cycle_start_date` is used. This date is the date when the billing cycle
 * starts and is used to calculate the next billing date. Conjoin Billing automatically sets this date to the subscription creation date,
 * or the `trial_end_date` if present, otherwise it allows the customer to set it to any date for the first billing cycle. A single billing cycle
 * is created for all the plans in the subscription. This means that the recurring intervals of plans/prices for a subscription **must be the same**.
 *
 * > [!NOTE]
 * > 1. The `cycle_start_date` can be updated until the subscription is active. Once the subscription is active, the `cycle_start_date`
 * > will be locked and cannot be updated.
 * > 2. All prices for a subscription must have the same recurring interval. This also applies to the prices for the plans.
 *
 * Conjoin Billing automatically handles edge cases related to the `cycle_start_date`, such as leap years and months with varying numbers
 * of days (e.g., ensuring correct billing even if the `cycle_start_date` falls on the 31st of a month or the 28th/29th of February).
 */
export type BillingSubscriptionType = {
  /**
   * The id of the subscription.
   */
  subscription_id: string
  /**
   * A customer-supplied reference ID of the subscription.
   */
  reference_id: string
  /**
   * The id of the customer.
   */
  customer_id: string
  /**
   * The plans associated with the subscription.
   */
  plans: BillingSubscriptionPlanType[]
  /**
   * The status of the subscription.
   *
   * `active`: The subscription is active. Eg: The subscription is active and the customer is billed on a recurring basis.
   *
   * `canceled`: The subscription is canceled. Eg: The subscription is canceled and the customer will not be billed again.
   * This usually happens when the customer cancels the subscription.
   *
   * `incomplete`: The subscription is incomplete. Eg: The subscription is incomplete and the customer needs to complete the subscription process.
   * This can happen when the payment_intent associated with the subscription is in processing state.
   *
   * `incomplete_expired`: The subscription is incomplete and has expired. Eg: The subscription is incomplete and has expired.
   * This usually happens when the customer does not complete the subscription process within the trial period, or the payment_intent associated with the subscription expires.
   *
   * `past_due`: The subscription is past due. Eg: The subscription is past due and the customer needs to make a payment.
   * This can happen if the customer's card is declined.
   *
   * `trailing`: The subscription is in trial. Eg: The customer has signed up for a 14-day free trial of a premium plan.
   * They have full access to premium features during this period but haven't been charged yet.
   * At the end of the trial, if not canceled, the subscription will automatically convert to 'active' and billing will begin.
   *
   * `paused`: The subscription is paused. Eg: The subscription is paused and the customer will not be billed until the subscription is resumed.
   */
  status: BillingSubscriptionStatusType
  /**
   * The start date for the subscription is the date the subscription goes into effect.
   * This is the date when the subscription will be billed for the first time.
   */
  start_date: Date
  /**
   * The end date for the subscription is the date the subscription will end.
   * This is the date when the subscription will no longer be billed.
   */
  end_date: Date | null
  /**
   * The trial start date is the date when the trial period starts.
   * If this field is present, it means that the subscription is in trial and the initial status is `trailing`.
   */
  trial_start_date: Date | null
  /**
   * The trial end date is the date when the trial period ends.
   * If this field is present, it means that the subscription is in trial and the initial status is `trailing`.
   * It will remain in trial mode until the trial period ends, at which point the subscription will attempt to collect payment and transition to "active"
   * (or possibly "incomplete" if the payment fails).
   */
  trial_end_date: Date | null
  /**
   * The 3-letter ISO 4217 currency code of the subscription. All the prices for the plans must have the same currency.
   */
  currency: string
  /**
   * This corresponds to the `invoicing_option` field for the invoice created for this subscription.
   */
  invoicing_option: BillingInvoicingOptionType
  /**
   * The payment strategy determines how the subscription will be processed.
   *
   * `allow_incomplete`: The subscription allows for an incomplete status and will proceed without immediate fulfillment.
   * The subscription status will remain in `incomplete` status until payment is made later or it is manually finalised.
   *
   * `auto_incomplete`: The subscription will automatically be marked as incomplete if not fulfilled right away. However, the customer
   * has a time-window (typically 1 day) to complete the payment before the subscription expires.
   *
   * `reject_if_incomplete`: The subscription will reject the transaction if it cannot be completed immediately.
   *
   * The default is `allow_incomplete`.
   */
  payment_strategy: BillingSubscriptionPaymentStrategyType
  /**
   * This is the ID of the payment method that will be used to pay for the subscription.
   * This is required if the `invoicing_option` is `automatic_charge`.
   * If required and not provided, the subscription will check the customer's default payment method via `invoice_settings.payment_method`.
   * If that is not present, the subscription will fail to create.
   */
  payment_method: string | null
  /**
   * The number of days until the subscription is due.
   * This is only used if the `invoicing_option` is `manual_payment`.
   */
  days_until_due: number | null
  /**
   * The start date for the billing cycle. This determines when the billing cycle starts.
   * It can be set to a specific date to align the billing cycle with the customer's needs.
   *
   * This can be used to anchor the billing cycle to a specific event, such as a subscription signup or renewal.
   */
  cycle_start_date: Date | null

  /**
   * Determines if the subscription will automatically renew at the end of its term.
   * When not set, it will use the entity's default renewal behavior.
   */
  auto_renew: boolean | null

  /**
   * The notification settings for this specific subscription's renewal.
   * The entity's default renewal notification settings if enabled will be used if not provided.
   */
  renewal_notifications: {
    /**
     * The number of days before the subscription end date to send renewal notifications.
     */
    days_before: number[]
  } | null

  /**
   * Reference to the most recent state transition.
   */
  latest_state_transition: {
    /**
     * ID of the most recent state history record.
     */
    state_history_id: string | null

    /**
     * The status before the most recent change.
     */
    previous_status: BillingSubscriptionStatusType | null

    /**
     * When the most recent status change occurred.
     */
    transition_date: Date | null
  }

  /**
   * The proration configuration for this subscription.
   */
  proration: {
    /**
     * How proration is handled when subscription plans are changed.
     *
     * `always_prorate`: Always calculate and charge/credit prorated amounts.
     *
     * `never_prorate`: Never calculate prorated amounts.
     *
     * `prorate_upgrades`: Only prorate when adding plans or increasing quantities.
     *
     * `prorate_downgrades`: Only prorate when removing plans or decreasing quantities.
     *
     * The default is `always_prorate`.
     */
    behavior: BillingSubscriptionProrationBehaviorType

    /**
     * When prorated amounts are applied.
     *
     * `immediate`: Apply prorated charges/credits immediately.
     *
     * `next_billing_cycle`: Apply prorated amounts to the next invoice.
     *
     * The default is `next_billing_cycle`.
     */
    application_timing: BillingSubscriptionProrationApplicationTimingType
  } | null

  /**
   * Cancellation configuration for this subscription.
   */
  cancellation: {
    /**
     * If and when the subscription has been canceled.
     */
    canceled_date: Date | null

    /**
     * What happens when a subscription is canceled.
     *
     * `end_immediately`: End subscription access immediately upon cancellation.
     *
     * `end_of_period`: Allow access until the end of the current billing period.
     */
    termination_behavior: BillingSubscriptionCancellationTerminationBehaviorType | null

    /**
     * How refunds are handled upon cancellation.
     *
     * `no_refund`: No refund is given.
     *
     * `prorated_refund`: A prorated refund is given based on unused time.
     *
     * `full_refund`: A full refund is given.
     */
    refund_policy: BillingSubscriptionRefundPolicyType | null

    /**
     * The reason for cancellation.
     */
    reason: string | null
  } | null

  /**
   * Fields to manage the current and previous billing cycles.
   */
  current_cycle: {
    /**
     * ID of the current billing cycle.
     */
    cycle_id: string | null

    /**
     * Start date of the current billing period.
     */
    period_start: Date | null

    /**
     * End date of the current billing period.
     */
    period_end: Date | null

    /**
     * The next billing date for this subscription.
     */
    next_billing_date: Date | null
  } | null
}
