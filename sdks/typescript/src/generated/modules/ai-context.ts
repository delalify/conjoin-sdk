import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateIndexBody = operations['createAiContextIndex']['requestBody']['content']['application/json']
type CreateIndexData = NonNullable<operations['createAiContextIndex']['responses']['201']['content']['application/json']['data']>
type ListIndexesData = NonNullable<operations['listAiContextIndexes']['responses']['200']['content']['application/json']['data']>[number]
type ListIndexesQuery = NonNullable<operations['listAiContextIndexes']['parameters']['query']>
type ReadIndexData = NonNullable<operations['readAiContextIndex']['responses']['200']['content']['application/json']['data']>
type DeleteIndexData = NonNullable<operations['deleteAiContextIndex']['responses']['200']['content']['application/json']['data']>
type SyncIndexData = NonNullable<operations['syncAiContextIndex']['responses']['200']['content']['application/json']['data']>
type QueryBody = operations['queryAiContext']['requestBody']['content']['application/json']
type QueryData = NonNullable<operations['queryAiContext']['responses']['200']['content']['application/json']['data']>
type ListQueryLogsData = NonNullable<operations['listAiContextQueryLogs']['responses']['200']['content']['application/json']['data']>[number]
type ListQueryLogsQuery = NonNullable<operations['listAiContextQueryLogs']['parameters']['query']>

export function createAiContexts(client: ConjoinClient) {
  return {
    createIndex: (data: CreateIndexBody) =>
      client.fetch<CreateIndexData>('ai/context/context/indexes/create', { method: 'POST', body: data }),

    listIndexes: (query?: ListIndexesQuery) =>
      client.fetchList<ListIndexesData>('ai/context/context/indexes', { query: query as Record<string, unknown> }),

    readIndex: (indexId: string) =>
      client.fetch<ReadIndexData>(`ai/context/context/indexes/${indexId}`),

    deleteIndex: (indexId: string) =>
      client.fetch<DeleteIndexData>(`ai/context/context/indexes/${indexId}/delete`, { method: 'DELETE' }),

    syncIndex: (indexId: string) =>
      client.fetch<SyncIndexData>(`ai/context/context/indexes/${indexId}/sync`, { method: 'POST' }),

    query: (data: QueryBody) =>
      client.fetch<QueryData>('ai/context/context/query', { method: 'POST', body: data }),

    listQueryLogs: (query?: ListQueryLogsQuery) =>
      client.fetchList<ListQueryLogsData>('ai/context/context/query-logs', { query: query as Record<string, unknown> }),
  }
}
