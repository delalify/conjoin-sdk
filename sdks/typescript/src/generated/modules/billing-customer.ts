import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createCustomer']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createCustomer']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<
  operations['listCustomers']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listCustomers']['parameters']['query']>
type UpdateBody = operations['updateCustomer']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateCustomer']['responses']['200']['content']['application/json']['data']>
type ArchiveData = NonNullable<operations['archiveCustomer']['responses']['200']['content']['application/json']['data']>
type RestoreData = NonNullable<operations['restoreCustomer']['responses']['200']['content']['application/json']['data']>

export function createBillingCustomers(client: ConjoinClient) {
  return {
    create: (entityId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/customer/${entityId}`, { method: 'POST', body: data }),

    list: (entityId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/customer/${entityId}`, { query: query as Record<string, unknown> }),

    update: (entityId: string, customerId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`billing/customer/${entityId}/${customerId}`, { method: 'PUT', body: data }),

    archive: (entityId: string, customerId: string) =>
      client.fetch<ArchiveData>(`billing/customer/${entityId}/${customerId}/archive`, { method: 'PATCH' }),

    restore: (entityId: string, customerId: string) =>
      client.fetch<RestoreData>(`billing/customer/${entityId}/${customerId}/restore`, { method: 'PATCH' }),
  }
}
