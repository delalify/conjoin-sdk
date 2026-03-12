import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createDiscount']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createDiscount']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<
  operations['listDiscounts']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listDiscounts']['parameters']['query']>
type DeleteData = NonNullable<operations['deleteDiscount']['responses']['200']['content']['application/json']['data']>

export function createBillingDiscounts(client: ConjoinClient) {
  return {
    create: (data: CreateBody) => client.fetch<CreateData>('billing/discount/create', { method: 'POST', body: data }),

    list: (query?: ListQuery) =>
      client.fetchList<ListData>('billing/discount/', { query: query as Record<string, unknown> }),

    delete: (discountId: string) => client.fetch<DeleteData>(`billing/discount/${discountId}`, { method: 'DELETE' }),
  }
}
