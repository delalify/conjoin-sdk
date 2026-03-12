import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateByokConfigBody = operations['createAiByokConfig']['requestBody']['content']['application/json']
type CreateByokConfigData = NonNullable<
  operations['createAiByokConfig']['responses']['201']['content']['application/json']['data']
>
type ListByokConfigsData = NonNullable<
  operations['listAiByokConfigs']['responses']['200']['content']['application/json']['data']
>[number]
type ListByokConfigsQuery = NonNullable<operations['listAiByokConfigs']['parameters']['query']>
type ReadByokConfigData = NonNullable<
  operations['readAiByokConfig']['responses']['200']['content']['application/json']['data']
>
type UpdateByokConfigBody = operations['updateAiByokConfig']['requestBody']['content']['application/json']
type UpdateByokConfigData = NonNullable<
  operations['updateAiByokConfig']['responses']['200']['content']['application/json']['data']
>
type DeleteByokConfigData = NonNullable<
  operations['deleteAiByokConfig']['responses']['200']['content']['application/json']['data']
>
type TestByokConnectionResponse = operations['testAiByokConnection']['responses']['200']['content']['application/json']

export function createAiBYOKs(client: ConjoinClient) {
  return {
    createByokConfig: (data: CreateByokConfigBody) =>
      client.fetch<CreateByokConfigData>('ai/byok/byok/create', { method: 'POST', body: data }),

    listByokConfigs: (query?: ListByokConfigsQuery) =>
      client.fetchList<ListByokConfigsData>('ai/byok/byok', { query: query as Record<string, unknown> }),

    readByokConfig: (byokConfigId: string) => client.fetch<ReadByokConfigData>(`ai/byok/byok/${byokConfigId}`),

    updateByokConfig: (byokConfigId: string, data: UpdateByokConfigBody) =>
      client.fetch<UpdateByokConfigData>(`ai/byok/byok/${byokConfigId}/update`, { method: 'PATCH', body: data }),

    deleteByokConfig: (byokConfigId: string) =>
      client.fetch<DeleteByokConfigData>(`ai/byok/byok/${byokConfigId}/delete`, { method: 'DELETE' }),

    testByokConnection: (byokConfigId: string) =>
      client.fetch<TestByokConnectionResponse>(`ai/byok/byok/${byokConfigId}/test`, { method: 'POST' }),
  }
}
