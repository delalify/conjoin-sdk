import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createPrice']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createPrice']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<operations['listPrices']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listPrices']['parameters']['query']>
type UpdateBody = operations['updatePrice']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updatePrice']['responses']['200']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deletePrice']['responses']['200']['content']['application/json']['data']>
type ArchiveData = NonNullable<operations['archivePrice']['responses']['200']['content']['application/json']['data']>
type RestoreData = NonNullable<operations['restorePrice']['responses']['200']['content']['application/json']['data']>

export function createBillingPrices(client: ConjoinClient) {
  return {
    create: (entityId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/price/${entityId}`, { method: 'POST', body: data }),

    list: (entityId: string, referenceId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/price/${entityId}/${referenceId}`, { query: query as Record<string, unknown> }),

    update: (entityId: string, referenceId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`billing/price/${entityId}/${referenceId}`, { method: 'PUT', body: data }),

    delete: (entityId: string, referenceId: string) =>
      client.fetch<DeleteData>(`billing/price/${entityId}/${referenceId}`, { method: 'DELETE' }),

    archive: (entityId: string, referenceId: string) =>
      client.fetch<ArchiveData>(`billing/price/${entityId}/${referenceId}/archive`, { method: 'PATCH' }),

    restore: (entityId: string, referenceId: string) =>
      client.fetch<RestoreData>(`billing/price/${entityId}/${referenceId}/restore`, { method: 'PATCH' }),
  }
}
