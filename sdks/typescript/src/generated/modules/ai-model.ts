import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<operations['listAiModels']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listAiModels']['parameters']['query']>
type ReadData = NonNullable<operations['readAiModel']['responses']['200']['content']['application/json']['data']>

export function createAiModels(client: ConjoinClient) {
  return {
    list: (query?: ListQuery) =>
      client.fetchList<ListData>('ai/model/models', { query: query as Record<string, unknown> }),

    read: (modelId: string) =>
      client.fetch<ReadData>(`ai/model/models/${modelId}`),
  }
}
