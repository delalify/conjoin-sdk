export const billingSubscriptionCycleStatuses = ['upcoming', 'current', 'completed', 'failed'] as const
export type BillingSubscriptionCycleStatusType = (typeof billingSubscriptionCycleStatuses)[number]

/**
 * Represents a single billing cycle for a subscription.
 * Billing cycles track the recurring periods of a subscription, including
 * usage data, proration adjustments, and billing status for each period.
 *
 * Conjoin Billing creates a new subscription cycle depending on the subscription plans. Since each plan
 * can have a different billing model (licensed or metered), the cycle will be created based on the
 * billing model of the plan, and costs for the generated invoice will be calculated accordingly.
 * A cycle is always created based on the `subscription.cycle_start_date` and the recurring interval of the plan.
 *
 * ### Fixed (Licensed) Plans
 *
 * For fixed (licensed) plans, billing occurs in advance for the upcoming period. When a subscription starts
 * or renews, an invoice is immediately created and finalized for the full amount of the fixed fee.
 * For renewals, the invoice is created about an hour before the cycle ends, finalized, and payment is attempted.
 * If there are changes during the cycle (e.g., quantity updates), the charges are prorated accordingly.
 *
 * ### Metered Plans
 *
 * For metered plans, billing occurs in arrears (after service is provided). Conjoin Billing tracks usage
 * throughout the billing period. When the cycle ends, the metered usage is combined with the next cycle's
 * fixed fee (if any) in a single invoice.
 *
 * For example:
 *
 * Let's assume John creates a subscription with 2 plans:
 * - Plan A: $10/month (licensed)
 * - Plan B: $1/GB/month (metered)
 *
 * John's subscription starts on 2025-01-01:
 * - Conjoin Billing creates a new cycle
 * - Invoice #1 is immediately created and finalized for Plan A
 *   Line items:
 *   1. "Plan A Monthly Subscription (Jan 2025)" - $10
 *   Total: $10
 * - John is charged $10 immediately for January's service
 * - Plan B (metered): Usage tracking begins
 *
 * Throughout January:
 * - John uses 10GB of data
 * - Usage is tracked for Plan B
 * - No charges yet for metered usage
 *
 * On 2025-01-31 (cycle end):
 * - Invoice #2 is created with both the metered usage and next month's fixed fee
 *   Line items:
 *   1. "Plan B Usage - 10GB at $1/GB (Jan 2025)" - $10
 *   2. "Plan A Monthly Subscription (Feb 2025)" - $10
 *   Total: $20
 * - Invoice #2 is finalized and payment is attempted
 *
 * Total charges:
 * - Jan 1: $10 (Invoice #1 - Plan A's January service)
 * - Jan 31: $20 (Invoice #2 - Plan B's January usage + Plan A's February service)
 */
export type BillingSubscriptionCycleType = {
  /**
   * Unique identifier for this billing cycle.
   */
  cycle_id: string

  /**
   * The subscription this cycle belongs to.
   */
  subscription_id: string

  /**
   * The sequence number of this cycle (1 for first cycle, 2 for second, etc.).
   * This is used to determine the order of cycles for a subscription.
   */
  cycle_sequence: number

  /**
   * The start date of this billing cycle.
   */
  period_start: Date

  /**
   * The end date of this billing cycle.
   */
  period_end: Date

  /**
   * The invoice generated for this cycle, if any.
   */
  invoice_id: string | null

  /**
   * The status of this billing cycle.
   *
   * `upcoming`: This cycle is in the future.
   *
   * `current`: This is the active billing cycle.
   *
   * `completed`: This cycle has been billed and completed.
   *
   * `failed`: Billing for this cycle failed.
   */
  status: BillingSubscriptionCycleStatusType

  /**
   * The amount billed for this cycle (in the smallest unit of the currency).
   */
  amount: number

  /**
   * The currency used for billing this cycle.
   */
  currency: string

  /**
   * Usage data for any metered billing components in this cycle.
   */
  usage_data: {
    /**
     * The plan IDs of the metered components. Conjoin Billing uses the plan IDs to
     * determine the metered components for a subscription. The `usage_quantity` and
     * `usage_amount` are calculated and aggregated by summing up the usage for each plan ID.
     */
    plan_ids: string[]

    /**
     * The amount of usage recorded.
     */
    usage_quantity: number

    /**
     * The total calculated for this usage.
     */
    usage_amount: number
  }[]

  /**
   * Any proration adjustments applied in this cycle.
   * When a change is made to a subscription (for example, an upgrade or change in quantity), Conjoin Billing calculates prorated amounts
   * by determining the fraction of the billing period elapsed. This calculation is performed per subscription plan, and adjustments are added as separate invoice line items.
   * The history of these adjustments is preserved ensuring traceability.
   */
  proration_adjustments: {
    /**
     * The reason for the proration adjustment.
     */
    reason: string

    /**
     * The amount of the adjustment (positive for charges, negative for credits).
     */
    amount: number

    /**
     * When the adjustment was applied.
     */
    applied_at: Date
  }[]

  /**
   * When billing was attempted for this cycle.
   */
  billed_at: Date | null
}
