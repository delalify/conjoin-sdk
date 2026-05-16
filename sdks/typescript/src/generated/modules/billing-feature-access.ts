import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CheckEntitlementBody = operations['checkBillingEntitlement']['requestBody']['content']['application/json']
type CheckEntitlementData = NonNullable<operations['checkBillingEntitlement']['responses']['200']['content']['application/json']['data']>
type TrackFeatureUsageBody = operations['trackBillingFeatureUsage']['requestBody']['content']['application/json']
type TrackFeatureUsageData = NonNullable<operations['trackBillingFeatureUsage']['responses']['200']['content']['application/json']['data']>

export function createBillingFeatureAccesses(client: ConjoinClient) {
  return {
    checkEntitlement: (entityId: string, data: CheckEntitlementBody) =>
      client.fetch<CheckEntitlementData>(`billing/check/${entityId}`, { method: 'POST', body: data }),

    trackFeatureUsage: (entityId: string, data: TrackFeatureUsageBody) =>
      client.fetch<TrackFeatureUsageData>(`billing/track/${entityId}`, { method: 'POST', body: data }),
  }
}
