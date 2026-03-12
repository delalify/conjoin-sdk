import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createEntitlementFeature']['requestBody']['content']['application/json']
type CreateData = NonNullable<
  operations['createEntitlementFeature']['responses']['201']['content']['application/json']['data']
>
type ListData = NonNullable<
  operations['listEntitlementFeatures']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listEntitlementFeatures']['parameters']['query']>
type UpdateBody = operations['updateEntitlementFeature']['requestBody']['content']['application/json']
type UpdateData = NonNullable<
  operations['updateEntitlementFeature']['responses']['200']['content']['application/json']['data']
>
type ArchiveData = NonNullable<
  operations['archiveEntitlementFeature']['responses']['200']['content']['application/json']['data']
>

export function createBillingEntitlementFeatures(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('billing/entitlement-feature/', { method: 'POST', body: data }),

    list: (featureIdOrKey: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/entitlement-feature/${featureIdOrKey}`, {
        query: query as Record<string, unknown>,
      }),

    update: (featureIdOrKey: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`billing/entitlement-feature/${featureIdOrKey}`, { method: 'PUT', body: data }),

    archive: (featureIdOrKey: string) =>
      client.fetch<ArchiveData>(`billing/entitlement-feature/${featureIdOrKey}/archive`, { method: 'PATCH' }),
  }
}
