import type { BillingSubscriptionStatusType } from './billing-subscription-types'

export const billingSubscriptionStateHistoryTransitionSources = [
  'system',
  'customer',
  'payment_failure',
  'scheduled',
  'api',
] as const
export type BillingSubscriptionStateHistoryTransitionSourceType =
  (typeof billingSubscriptionStateHistoryTransitionSources)[number]

export const billingSubscriptionStateHistoryImpactTypes = ['charge', 'refund', 'credit'] as const
export type BillingSubscriptionStateHistoryImpactType = (typeof billingSubscriptionStateHistoryImpactTypes)[number]

/**
 * Records a change in subscription status along with metadata about the change.
 */
export type BillingSubscriptionStateHistoryType = {
  /**
   * Unique identifier for this state change record.
   */
  state_history_id: string

  /**
   * The ID of the subscription this state change belongs to.
   */
  subscription_id: string

  /**
   * The status the subscription changed from.
   */
  from_status: BillingSubscriptionStatusType

  /**
   * The status the subscription changed to.
   */
  to_status: BillingSubscriptionStatusType

  /**
   * When this state change occurred.
   */
  transition_date: Date

  /**
   * The source that triggered this state change.
   *
   * `system`: The state change was triggered by the system.
   *
   * `customer`: The state change was triggered by the customer via the Conjoin dashboard.
   *
   * `payment_failure`: The state change was triggered by a payment failure.
   *
   * `scheduled`: The state change was scheduled.
   *
   * `api`: The state change was triggered by an API call.
   */
  transition_source: BillingSubscriptionStateHistoryTransitionSourceType

  /**
   * Any additional notes about this state change.
   */
  notes: string | null

  /**
   * Financial impact of this state change, if any.
   */
  financial_impact: {
    /**
     * Whether this state change had a financial impact.
     */
    has_impact: boolean

    /**
     * The amount of the financial impact (in the smallest unit of the currency).
     */
    amount: number | null

    /**
     * The currency of the financial impact.
     */
    currency: string | null

    /**
     * The type of financial impact.
     *
     * `charge`: The financial impact was a charge.
     *
     * `refund`: The financial impact was a refund.
     *
     * `credit`: The financial impact was a credit.
     */
    impact_type: BillingSubscriptionStateHistoryImpactType | null
  }

  /**
   * Related resources affected by this state change.
   */
  related_resources: {
    /**
     * The ID of the invoice affected, if any.
     */
    invoice_id: string | null

    /**
     * The ID of the payment intent affected, if any.
     */
    payment_intent_id: string | null

    /**
     * The ID of the refund created, if any.
     */
    refund_id: string | null
  }
}
