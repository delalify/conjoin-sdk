import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createRefund']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createRefund']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<
  operations['listRefunds']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listRefunds']['parameters']['query']>

export function createBillingRefunds(client: ConjoinClient) {
  return {
    create: (entityId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/refund/${entityId}/create`, { method: 'POST', body: data }),

    list: (entityId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/refund/${entityId}`, { query: query as Record<string, unknown> }),
  }
}
