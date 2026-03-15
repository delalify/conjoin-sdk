import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<
  operations['listCharges']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listCharges']['parameters']['query']>

export function createBillingCharges(client: ConjoinClient) {
  return {
    list: (entityId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/charge/${entityId}`, { query: query as Record<string, unknown> }),
  }
}
