import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateIndexBody = operations['createSearchIndex']['requestBody']['content']['application/json']
type CreateIndexData = NonNullable<operations['createSearchIndex']['responses']['201']['content']['application/json']['data']>
type ReadIndexesData = NonNullable<operations['readSearchIndexes']['responses']['200']['content']['application/json']['data']>[number]
type ReadIndexesQuery = NonNullable<operations['readSearchIndexes']['parameters']['query']>
type DeleteIndexData = NonNullable<operations['deleteSearchIndex']['responses']['200']['content']['application/json']['data']>
type IndexDocumentBody = operations['indexSearchDocument']['requestBody']['content']['application/json']
type IndexDocumentData = NonNullable<operations['indexSearchDocument']['responses']['201']['content']['application/json']['data']>
type IndexDocumentBatchBody = operations['indexSearchDocumentBatch']['requestBody']['content']['application/json']
type IndexDocumentBatchData = NonNullable<operations['indexSearchDocumentBatch']['responses']['201']['content']['application/json']['data']>[number]
type RemoveDocumentResponse = operations['removeSearchDocument']['responses']['200']['content']['application/json']
type SearchQueryBody = operations['searchQuery']['requestBody']['content']['application/json']
type SearchQueryData = NonNullable<operations['searchQuery']['responses']['200']['content']['application/json']['data']>
type AutoSuggestBody = operations['autoSuggestSearch']['requestBody']['content']['application/json']
type AutoSuggestData = NonNullable<operations['autoSuggestSearch']['responses']['200']['content']['application/json']['data']>

export function createRelaySearches(client: ConjoinClient) {
  return {
    createIndex: (data: CreateIndexBody) =>
      client.fetch<CreateIndexData>('relay/search/indexes/create', { method: 'POST', body: data }),

    readIndexes: (query?: ReadIndexesQuery) =>
      client.fetchList<ReadIndexesData>('relay/search/indexes', { query: query as Record<string, unknown> }),

    deleteIndex: (indexId: string) =>
      client.fetch<DeleteIndexData>(`relay/search/indexes/${indexId}/delete`, { method: 'DELETE' }),

    indexDocument: (indexId: string, data: IndexDocumentBody) =>
      client.fetch<IndexDocumentData>(`relay/search/indexes/${indexId}/documents`, { method: 'POST', body: data }),

    indexDocumentBatch: (indexId: string, data: IndexDocumentBatchBody) =>
      client.fetchList<IndexDocumentBatchData>(`relay/search/indexes/${indexId}/documents/batch`, { method: 'POST', body: data }),

    removeDocument: (indexId: string, documentId: string) =>
      client.fetch<RemoveDocumentResponse>(`relay/search/indexes/${indexId}/documents/${documentId}`, { method: 'DELETE' }),

    searchQuery: (indexId: string, data: SearchQueryBody) =>
      client.fetch<SearchQueryData>(`relay/search/indexes/${indexId}/query`, { method: 'POST', body: data }),

    autoSuggest: (indexId: string, data: AutoSuggestBody) =>
      client.fetch<AutoSuggestData>(`relay/search/indexes/${indexId}/suggest`, { method: 'POST', body: data }),
  }
}
