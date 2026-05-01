import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createSubscription']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createSubscription']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<operations['listSubscriptions']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listSubscriptions']['parameters']['query']>
type UpdateBody = operations['updateSubscription']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateSubscription']['responses']['200']['content']['application/json']['data']>
type UpdatePlansBody = operations['updateSubscriptionPlans']['requestBody']['content']['application/json']
type UpdatePlansData = NonNullable<operations['updateSubscriptionPlans']['responses']['200']['content']['application/json']['data']>
type CancelBody = operations['cancelSubscription']['requestBody']['content']['application/json']
type CancelData = NonNullable<operations['cancelSubscription']['responses']['200']['content']['application/json']['data']>
type PauseBody = operations['pauseSubscription']['requestBody']['content']['application/json']
type PauseData = NonNullable<operations['pauseSubscription']['responses']['200']['content']['application/json']['data']>
type ResumeData = NonNullable<operations['resumeSubscription']['responses']['200']['content']['application/json']['data']>
type RecordUsageBody = operations['recordSubscriptionUsage']['requestBody']['content']['application/json']
type RecordUsageData = NonNullable<operations['recordSubscriptionUsage']['responses']['200']['content']['application/json']['data']>
type ReadUsageSummaryData = NonNullable<operations['readSubscriptionUsageSummary']['responses']['200']['content']['application/json']['data']>[number]
type ReadUsageSummaryQuery = NonNullable<operations['readSubscriptionUsageSummary']['parameters']['query']>
type ReadCyclesData = NonNullable<operations['readSubscriptionCycles']['responses']['200']['content']['application/json']['data']>[number]
type ReadCyclesQuery = NonNullable<operations['readSubscriptionCycles']['parameters']['query']>

export function createBillingSubscriptions(client: ConjoinClient) {
  return {
    create: (entityId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/subscription/${entityId}/create`, { method: 'POST', body: data }),

    list: (entityId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/subscription/${entityId}`, { query: query as Record<string, unknown> }),

    update: (entityId: string, subscriptionId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`billing/subscription/${entityId}/metadata/${subscriptionId}`, { method: 'PATCH', body: data }),

    updatePlans: (entityId: string, subscriptionId: string, data: UpdatePlansBody) =>
      client.fetch<UpdatePlansData>(`billing/subscription/${entityId}/plans/${subscriptionId}`, { method: 'PATCH', body: data }),

    cancel: (entityId: string, subscriptionId: string, data: CancelBody) =>
      client.fetch<CancelData>(`billing/subscription/${entityId}/cancel/${subscriptionId}`, { method: 'POST', body: data }),

    pause: (entityId: string, subscriptionId: string, data: PauseBody) =>
      client.fetch<PauseData>(`billing/subscription/${entityId}/pause/${subscriptionId}`, { method: 'POST', body: data }),

    resume: (entityId: string, subscriptionId: string) =>
      client.fetch<ResumeData>(`billing/subscription/${entityId}/resume/${subscriptionId}`, { method: 'POST' }),

    recordUsage: (entityId: string, subscriptionId: string, data: RecordUsageBody) =>
      client.fetch<RecordUsageData>(`billing/subscription/${entityId}/usage/${subscriptionId}`, { method: 'POST', body: data }),

    readUsageSummary: (entityId: string, query?: ReadUsageSummaryQuery) =>
      client.fetchList<ReadUsageSummaryData>(`billing/subscription/${entityId}/usage-summary`, { query: query as Record<string, unknown> }),

    readCycles: (entityId: string, subscriptionId: string, query?: ReadCyclesQuery) =>
      client.fetchList<ReadCyclesData>(`billing/subscription/${entityId}/cycles/${subscriptionId}`, { query: query as Record<string, unknown> }),
  }
}
