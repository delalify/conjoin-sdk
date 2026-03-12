import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createInvoice']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createInvoice']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<
  operations['listInvoices']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listInvoices']['parameters']['query']>
type UpdateBody = operations['updateInvoice']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateInvoice']['responses']['200']['content']['application/json']['data']>
type FinalizeData = NonNullable<
  operations['finalizeInvoice']['responses']['200']['content']['application/json']['data']
>
type PayBody = operations['payInvoice']['requestBody']['content']['application/json']
type PayData = NonNullable<operations['payInvoice']['responses']['200']['content']['application/json']['data']>
type VoidData = NonNullable<operations['voidInvoice']['responses']['200']['content']['application/json']['data']>
type MarkPaidBody = operations['markInvoicePaid']['requestBody']['content']['application/json']
type MarkPaidData = NonNullable<
  operations['markInvoicePaid']['responses']['200']['content']['application/json']['data']
>
type SendData = NonNullable<operations['sendInvoice']['responses']['200']['content']['application/json']['data']>
type ReadPdfResponse = operations['readInvoicePdf']['responses']['200']['content']['application/json']

export function createBillingInvoices(client: ConjoinClient) {
  return {
    create: (entityId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/invoice/${entityId}/create`, { method: 'POST', body: data }),

    list: (entityId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/invoice/${entityId}`, { query: query as Record<string, unknown> }),

    update: (entityId: string, invoiceId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`billing/invoice/${entityId}/update/${invoiceId}`, { method: 'PUT', body: data }),

    finalize: (entityId: string, invoiceId: string) =>
      client.fetch<FinalizeData>(`billing/invoice/${entityId}/finalize/${invoiceId}`, { method: 'PATCH' }),

    pay: (entityId: string, invoiceId: string, data: PayBody) =>
      client.fetch<PayData>(`billing/invoice/${entityId}/pay/${invoiceId}`, { method: 'PATCH', body: data }),

    void: (entityId: string, invoiceId: string) =>
      client.fetch<VoidData>(`billing/invoice/${entityId}/void/${invoiceId}`, { method: 'PATCH' }),

    markPaid: (entityId: string, invoiceId: string, data: MarkPaidBody) =>
      client.fetch<MarkPaidData>(`billing/invoice/${entityId}/mark-paid/${invoiceId}`, { method: 'PATCH', body: data }),

    send: (entityId: string, invoiceId: string) =>
      client.fetch<SendData>(`billing/invoice/${entityId}/send/${invoiceId}`, { method: 'POST' }),

    readPdf: (entityId: string, invoiceId: string) =>
      client.fetch<ReadPdfResponse>(`billing/invoice/${entityId}/pdf/${invoiceId}`),
  }
}
