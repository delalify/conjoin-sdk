import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createAiProviderConfig']['requestBody']['content']['application/json']
type CreateData = NonNullable<
  operations['createAiProviderConfig']['responses']['201']['content']['application/json']['data']
>
type ListData = NonNullable<
  operations['listAiProviderConfigs']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listAiProviderConfigs']['parameters']['query']>
type ReadData = NonNullable<
  operations['readAiProviderConfig']['responses']['200']['content']['application/json']['data']
>
type UpdateBody = operations['updateAiProviderConfig']['requestBody']['content']['application/json']
type UpdateData = NonNullable<
  operations['updateAiProviderConfig']['responses']['200']['content']['application/json']['data']
>
type DeleteData = NonNullable<
  operations['deleteAiProviderConfig']['responses']['200']['content']['application/json']['data']
>

export function createAiProviderConfigs(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('ai/provider/providers/create', { method: 'POST', body: data }),

    list: (query?: ListQuery) =>
      client.fetchList<ListData>('ai/provider/providers', { query: query as Record<string, unknown> }),

    read: (configId: string) => client.fetch<ReadData>(`ai/provider/providers/${configId}`),

    update: (configId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`ai/provider/providers/${configId}/update`, { method: 'PATCH', body: data }),

    delete: (configId: string) =>
      client.fetch<DeleteData>(`ai/provider/providers/${configId}/delete`, { method: 'DELETE' }),
  }
}
