export const billingSubscriptionUsageRecordActions = ['increment', 'set'] as const
export type BillingSubscriptionUsageRecordActionType = (typeof billingSubscriptionUsageRecordActions)[number]

/**
 * Represents usage records for metered subscription plans.
 *
 * Usage records are created when customers report usage for metered subscription plans.
 * Each usage record contains information about the quantity of usage, when it occurred,
 * and how it should be applied to the subscription billing.
 *
 * Conjoin Billing aggregates these usage records for each billing cycle based on the
 * plan's aggregate_usage setting (sum, max, last_during_period, last_ever).
 *
 * For example:
 * - A SaaS company might track API calls where customers are charged $0.01 per call
 * - A cloud storage provider might track GB-hours of storage used
 * - A messaging service might track the number of messages sent
 *
 * Usage records are associated with a specific subscription plan and billing cycle. At the
 * end of a billing cycle, all usage records are aggregated to calculate the final charge.
 */
export type BillingSubscriptionUsageRecordType = {
  /**
   * Unique identifier for the usage record.
   */
  usage_record_id: string

  /**
   * The ID of the subscription this usage is recorded for.
   */
  subscription_id: string

  /**
   * The ID of the billing cycle this usage is recorded in.
   */
  cycle_id: string

  /**
   * The ID of the subscription plan this usage is for.
   */
  plan_id: string

  /**
   * The quantity of usage to record.
   */
  quantity: number

  /**
   * How the usage should be applied.
   *
   * `increment`: Add this quantity to the existing usage (the default).
   *
   * `set`: Set the usage to this quantity, replacing any previous values.
   */
  action: BillingSubscriptionUsageRecordActionType

  /**
   * When this usage occurred.
   */
  timestamp: Date

  /**
   * Optional metadata associated with this usage record.
   * This can be used to store additional information about the usage,
   * such as details about the resources used, user identifiers, etc.
   */
  metadata: Record<string, any>
}

/**
 * Request type for reporting usage for a metered subscription plan.
 */
export type BillingSubscriptionUsageReportRequestType = {
  /**
   * The ID of the subscription to report usage for.
   */
  subscription_id: string

  /**
   * The ID of the plan within the subscription to report usage for.
   */
  plan_id: string

  /**
   * The usage records to report.
   */
  records: Array<{
    /**
     * The quantity of usage to record.
     */
    quantity: number

    /**
     * How the usage should be applied.
     * `increment`: Add this quantity to the existing usage (the default).
     * `set`: Set the usage to this quantity, replacing any previous values.
     */
    action?: BillingSubscriptionUsageRecordActionType

    /**
     * When this usage occurred. Defaults to the current time if not provided.
     */
    timestamp?: Date

    /**
     * Optional metadata associated with this usage record.
     */
    metadata?: Record<string, any>
  }>
}

/**
 * Response type for retrieving usage records for a subscription plan.
 */
export type BillingSubscriptionUsageRecordResponseType = {
  /**
   * Unique identifier for the usage record.
   */
  usage_record_id: string

  /**
   * The quantity of usage recorded.
   */
  quantity: number

  /**
   * When this usage occurred.
   */
  timestamp: Date

  /**
   * How the usage was applied.
   */
  action: BillingSubscriptionUsageRecordActionType

  /**
   * Any metadata associated with this usage record.
   */
  metadata?: Record<string, any>
}
