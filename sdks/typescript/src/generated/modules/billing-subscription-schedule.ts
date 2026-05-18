import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createSubscriptionSchedule']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createSubscriptionSchedule']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<operations['listSubscriptionSchedules']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listSubscriptionSchedules']['parameters']['query']>
type GetData = NonNullable<operations['getSubscriptionSchedule']['responses']['200']['content']['application/json']['data']>
type CancelData = NonNullable<operations['cancelSubscriptionSchedule']['responses']['200']['content']['application/json']['data']>
type ReleaseData = NonNullable<operations['releaseSubscriptionSchedule']['responses']['200']['content']['application/json']['data']>

export function createBillingSubscriptionSchedules(client: ConjoinClient) {
  return {
    create: (entityId: string, subscriptionId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/subscription/${entityId}/schedules/${subscriptionId}`, { method: 'POST', body: data }),

    list: (entityId: string, subscriptionId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/subscription/${entityId}/schedules/${subscriptionId}`, { query: query as Record<string, unknown> }),

    get: (entityId: string, subscriptionId: string, scheduleId: string) =>
      client.fetch<GetData>(`billing/subscription/${entityId}/schedules/${subscriptionId}/${scheduleId}`),

    cancel: (entityId: string, subscriptionId: string, scheduleId: string) =>
      client.fetch<CancelData>(`billing/subscription/${entityId}/schedules/${subscriptionId}/${scheduleId}`, { method: 'DELETE' }),

    release: (entityId: string, subscriptionId: string, scheduleId: string) =>
      client.fetch<ReleaseData>(`billing/subscription/${entityId}/schedules/${subscriptionId}/${scheduleId}/release`, { method: 'POST' }),
  }
}
