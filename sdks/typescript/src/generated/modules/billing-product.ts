import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createProduct']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createProduct']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<
  operations['listProducts']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listProducts']['parameters']['query']>
type UpdateBody = operations['updateProduct']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateProduct']['responses']['200']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deleteProduct']['responses']['200']['content']['application/json']['data']>
type ArchiveData = NonNullable<operations['archiveProduct']['responses']['200']['content']['application/json']['data']>
type RestoreData = NonNullable<operations['restoreProduct']['responses']['200']['content']['application/json']['data']>

export function createBillingProducts(client: ConjoinClient) {
  return {
    create: (entityId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/product/${entityId}`, { method: 'POST', body: data }),

    list: (entityId: string, referenceId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/product/${entityId}/${referenceId}`, {
        query: query as Record<string, unknown>,
      }),

    update: (entityId: string, referenceId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`billing/product/${entityId}/${referenceId}`, { method: 'PUT', body: data }),

    delete: (entityId: string, referenceId: string) =>
      client.fetch<DeleteData>(`billing/product/${entityId}/${referenceId}`, { method: 'DELETE' }),

    archive: (entityId: string, referenceId: string) =>
      client.fetch<ArchiveData>(`billing/product/${entityId}/${referenceId}/archive`, { method: 'PATCH' }),

    restore: (entityId: string, referenceId: string) =>
      client.fetch<RestoreData>(`billing/product/${entityId}/${referenceId}/restore`, { method: 'PATCH' }),
  }
}
