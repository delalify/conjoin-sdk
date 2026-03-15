import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createPriceBundle']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createPriceBundle']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<operations['listPriceBundles']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listPriceBundles']['parameters']['query']>
type UpdateBody = operations['updatePriceBundle']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updatePriceBundle']['responses']['200']['content']['application/json']['data']>
type ArchiveData = NonNullable<operations['archivePriceBundle']['responses']['200']['content']['application/json']['data']>
type RestoreData = NonNullable<operations['restorePriceBundle']['responses']['200']['content']['application/json']['data']>
type ActivateBody = operations['activatePriceBundle']['requestBody']['content']['application/json']
type ActivateData = NonNullable<operations['activatePriceBundle']['responses']['201']['content']['application/json']['data']>
type ReadActivationsData = NonNullable<operations['readPriceBundleActivations']['responses']['200']['content']['application/json']['data']>[number]
type ReadActivationsQuery = NonNullable<operations['readPriceBundleActivations']['parameters']['query']>
type DeactivateBody = operations['deactivatePriceBundle']['requestBody']['content']['application/json']
type DeactivateData = NonNullable<operations['deactivatePriceBundle']['responses']['200']['content']['application/json']['data']>

export function createBillingPriceBundles(client: ConjoinClient) {
  return {
    create: (entityId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/price-bundle/${entityId}`, { method: 'POST', body: data }),

    list: (entityId: string, referenceId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/price-bundle/${entityId}/${referenceId}`, { query: query as Record<string, unknown> }),

    update: (entityId: string, referenceId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`billing/price-bundle/${entityId}/${referenceId}`, { method: 'PUT', body: data }),

    archive: (entityId: string, referenceId: string) =>
      client.fetch<ArchiveData>(`billing/price-bundle/${entityId}/${referenceId}/archive`, { method: 'PATCH' }),

    restore: (entityId: string, referenceId: string) =>
      client.fetch<RestoreData>(`billing/price-bundle/${entityId}/${referenceId}/restore`, { method: 'PATCH' }),

    activate: (entityId: string, referenceId: string, data: ActivateBody) =>
      client.fetch<ActivateData>(`billing/price-bundle/${entityId}/activate/${referenceId}`, { method: 'POST', body: data }),

    readActivations: (entityId: string, customerId: string, query?: ReadActivationsQuery) =>
      client.fetchList<ReadActivationsData>(`billing/price-bundle/${entityId}/activations/${customerId}`, { query: query as Record<string, unknown> }),

    deactivate: (entityId: string, activationId: string, data: DeactivateBody) =>
      client.fetch<DeactivateData>(`billing/price-bundle/${entityId}/deactivate/${activationId}`, { method: 'POST', body: data }),
  }
}
