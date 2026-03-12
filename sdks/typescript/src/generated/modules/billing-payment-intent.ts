import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createPaymentIntent']['requestBody']['content']['application/json']
type CreateData = NonNullable<
  operations['createPaymentIntent']['responses']['201']['content']['application/json']['data']
>
type ListData = NonNullable<
  operations['listPaymentIntents']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listPaymentIntents']['parameters']['query']>
type VerifyData = NonNullable<
  operations['verifyPaymentIntent']['responses']['200']['content']['application/json']['data']
>

export function createBillingPaymentIntents(client: ConjoinClient) {
  return {
    create: (entityId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/payment-intent/${entityId}/create`, { method: 'POST', body: data }),

    list: (entityId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/payment-intent/${entityId}`, { query: query as Record<string, unknown> }),

    verify: (entityId: string, referenceId: string) =>
      client.fetch<VerifyData>(`billing/payment-intent/${entityId}/verify/${referenceId}`),
  }
}
