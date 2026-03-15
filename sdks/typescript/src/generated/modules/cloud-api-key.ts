import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateApiKeyBody = operations['createCloudApiKey']['requestBody']['content']['application/json']
type CreateApiKeyData = NonNullable<operations['createCloudApiKey']['responses']['200']['content']['application/json']['data']>
type RegenerateApiKeyBody = operations['regenerateCloudApiKey']['requestBody']['content']['application/json']
type RegenerateApiKeyData = NonNullable<operations['regenerateCloudApiKey']['responses']['200']['content']['application/json']['data']>
type UpdateApiKeyBody = operations['updateCloudApiKey']['requestBody']['content']['application/json']
type UpdateApiKeyData = NonNullable<operations['updateCloudApiKey']['responses']['200']['content']['application/json']['data']>
type ReadApiKeysData = NonNullable<operations['readCloudApiKeys']['responses']['200']['content']['application/json']['data']>[number]
type ReadApiKeysQuery = NonNullable<operations['readCloudApiKeys']['parameters']['query']>
type DeleteApiKeyData = NonNullable<operations['deleteCloudApiKey']['responses']['200']['content']['application/json']['data']>

export function createCloudAPIKeys(client: ConjoinClient) {
  return {
    createApiKey: (data: CreateApiKeyBody) =>
      client.fetch<CreateApiKeyData>('cloud/api-key/new', { method: 'POST', body: data }),

    regenerateApiKey: (apiKeyId: string, data: RegenerateApiKeyBody) =>
      client.fetch<RegenerateApiKeyData>(`cloud/api-key/regenerate/${apiKeyId}`, { method: 'POST', body: data }),

    updateApiKey: (apiKeyId: string, data: UpdateApiKeyBody) =>
      client.fetch<UpdateApiKeyData>(`cloud/api-key/update-info/${apiKeyId}`, { method: 'PATCH', body: data }),

    readApiKeys: (query?: ReadApiKeysQuery) =>
      client.fetchList<ReadApiKeysData>('cloud/api-key/', { query: query as Record<string, unknown> }),

    deleteApiKey: (apiKeyId: string) =>
      client.fetch<DeleteApiKeyData>(`cloud/api-key/${apiKeyId}`, { method: 'DELETE' }),
  }
}
