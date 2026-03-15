import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<operations['readCloudPlans']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['readCloudPlans']['parameters']['query']>
type ReadData = NonNullable<operations['readCloudPlan']['responses']['200']['content']['application/json']['data']>
type ReadAccountData = NonNullable<operations['readAccountPlan']['responses']['200']['content']['application/json']['data']>

export function createCloudPlans(client: ConjoinClient) {
  return {
    list: (query?: ListQuery) =>
      client.fetchList<ListData>('cloud/plan/many', { query: query as Record<string, unknown> }),

    read: (slug: string) =>
      client.fetch<ReadData>(`cloud/plan/single/${slug}`),

    readAccount: () =>
      client.fetch<ReadAccountData>('cloud/plan/account'),
  }
}
