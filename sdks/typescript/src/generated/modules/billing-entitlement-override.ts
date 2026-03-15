import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createEntitlementOverride']['requestBody']['content']['application/json']
type CreateData = NonNullable<
  operations['createEntitlementOverride']['responses']['201']['content']['application/json']['data']
>
type ListData = NonNullable<
  operations['listEntitlementOverrides']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listEntitlementOverrides']['parameters']['query']>
type UpdateBody = operations['updateEntitlementOverride']['requestBody']['content']['application/json']
type UpdateData = NonNullable<
  operations['updateEntitlementOverride']['responses']['200']['content']['application/json']['data']
>
type DeleteData = NonNullable<
  operations['deleteEntitlementOverride']['responses']['200']['content']['application/json']['data']
>

export function createBillingEntitlementOverrides(client: ConjoinClient) {
  return {
    create: (entityId: string, data: CreateBody) =>
      client.fetch<CreateData>(`billing/entitlement-override/${entityId}`, { method: 'POST', body: data }),

    list: (entityId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/entitlement-override/${entityId}`, {
        query: query as Record<string, unknown>,
      }),

    update: (entityId: string, overrideId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`billing/entitlement-override/${entityId}/${overrideId}`, { method: 'PUT', body: data }),

    delete: (entityId: string, overrideId: string) =>
      client.fetch<DeleteData>(`billing/entitlement-override/${entityId}/${overrideId}`, { method: 'DELETE' }),
  }
}
