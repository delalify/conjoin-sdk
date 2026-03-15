import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createCreditNote']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createCreditNote']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<
  operations['listCreditNotes']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listCreditNotes']['parameters']['query']>
type VoidData = NonNullable<operations['voidCreditNote']['responses']['200']['content']['application/json']['data']>
type ReadBalanceData = NonNullable<
  operations['readCreditNoteBalance']['responses']['200']['content']['application/json']['data']
>

export function createBillingCreditNotes(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('billing/credit-note/create', { method: 'POST', body: data }),

    list: (query?: ListQuery) =>
      client.fetchList<ListData>('billing/credit-note/', { query: query as Record<string, unknown> }),

    void: (creditNoteId: string) =>
      client.fetch<VoidData>(`billing/credit-note/void/${creditNoteId}`, { method: 'PATCH' }),

    readBalance: (customerId: string) => client.fetch<ReadBalanceData>(`billing/credit-note/balance/${customerId}`),
  }
}
