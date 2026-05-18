import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateData = NonNullable<operations['createPublishableKey']['responses']['200']['content']['application/json']['data']>
type ListData = NonNullable<operations['listPublishableKeys']['responses']['200']['content']['application/json']['data']>[number]
type RotateData = NonNullable<operations['rotatePublishableKey']['responses']['200']['content']['application/json']['data']>
type UpdateDomainsBody = operations['updatePublishableKeyDomains']['requestBody']['content']['application/json']
type UpdateDomainsData = NonNullable<operations['updatePublishableKeyDomains']['responses']['200']['content']['application/json']['data']>
type RevokeData = NonNullable<operations['revokePublishableKey']['responses']['200']['content']['application/json']['data']>

export function createCloudPublishableKeys(client: ConjoinClient) {
  return {
    create: () =>
      client.fetch<CreateData>('cloud/publishable-key/new', { method: 'POST' }),

    list: () =>
      client.fetchList<ListData>('cloud/publishable-key/'),

    rotate: (publishableKeyId: string) =>
      client.fetch<RotateData>(`cloud/publishable-key/${publishableKeyId}/rotate`, { method: 'POST' }),

    updateDomains: (publishableKeyId: string, data: UpdateDomainsBody) =>
      client.fetch<UpdateDomainsData>(`cloud/publishable-key/${publishableKeyId}/domains`, { method: 'PATCH', body: data }),

    revoke: (publishableKeyId: string) =>
      client.fetch<RevokeData>(`cloud/publishable-key/${publishableKeyId}`, { method: 'DELETE' }),
  }
}
