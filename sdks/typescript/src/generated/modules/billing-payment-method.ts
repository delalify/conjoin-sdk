import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createPaymentMethod']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createPaymentMethod']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<operations['listPaymentMethods']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listPaymentMethods']['parameters']['query']>
type DeleteData = NonNullable<operations['deletePaymentMethod']['responses']['200']['content']['application/json']['data']>

export function createBillingPaymentMethods(client: ConjoinClient) {
  return {
    create: (entityId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/payment-method/${entityId}/create`, { method: 'POST', body: data }),

    list: (entityId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/payment-method/${entityId}`, { query: query as Record<string, unknown> }),

    delete: (entityId: string, paymentMethodId: string) =>
      client.fetch<DeleteData>(`billing/payment-method/${entityId}/${paymentMethodId}`, { method: 'DELETE' }),
  }
}
