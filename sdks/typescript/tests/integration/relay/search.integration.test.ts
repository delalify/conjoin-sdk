import { expect } from 'vitest'
import { createRelaySearches } from '../../../src/relay'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  DOCUMENT_ID,
  describeRelaySdkContractCases,
  INDEX_ID,
  REQUEST_ID,
  relayExpectedListQuery,
  relayListQuery,
  relaySearchDocumentFixture,
  relaySearchIndexFixture,
} from './relay-test-utils'

const createIndexBody = {
  name: 'Contract search',
  reference_id: 'search_reference_123',
  schema_definition: {
    fields: {
      title: {
        type: 'string' as const,
      },
    },
  },
}
const indexDocumentBody = {
  content: {
    title: 'Contract document',
  },
  reference_id: 'document_reference_123',
}
const indexDocumentBatchBody = {
  documents: [indexDocumentBody],
}
const searchQueryBody = {
  limit: 10,
  term: 'contract',
}
const autoSuggestBody = {
  field: 'title',
  limit: 5,
  prefix: 'con',
}

describeRelaySdkContractCases('Relay search SDK contract integration', [
  {
    name: 'creates a search index',
    method: 'POST',
    path: '/v1/relay/search/indexes/create',
    expectedBody: createIndexBody,
    response: conjoinSuccess(relaySearchIndexFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelaySearches(context.client).createIndex(createIndexBody),
    assertResult: result => expect(result).toEqual(relaySearchIndexFixture()),
  },
  {
    name: 'reads search indexes',
    method: 'GET',
    path: '/v1/relay/search/indexes',
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relaySearchIndexFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelaySearches(context.client).readIndexes(relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relaySearchIndexFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'deletes a search index',
    method: 'DELETE',
    path: '/v1/relay/search/indexes/{index_id}/delete',
    expectedPath: `/v1/relay/search/indexes/${INDEX_ID}/delete`,
    expectedPathParams: {
      index_id: INDEX_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relaySearchIndexFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => createRelaySearches(context.client).deleteIndex(INDEX_ID),
    assertResult: result => expect(result).toEqual(relaySearchIndexFixture({ status: 'deleted' })),
  },
  {
    name: 'indexes a search document',
    method: 'POST',
    path: '/v1/relay/search/indexes/{index_id}/documents',
    expectedBody: indexDocumentBody,
    expectedPath: `/v1/relay/search/indexes/${INDEX_ID}/documents`,
    expectedPathParams: {
      index_id: INDEX_ID,
    },
    response: conjoinSuccess(relaySearchDocumentFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelaySearches(context.client).indexDocument(INDEX_ID, indexDocumentBody),
    assertResult: result => expect(result).toEqual(relaySearchDocumentFixture()),
  },
  {
    name: 'batch indexes search documents',
    method: 'POST',
    path: '/v1/relay/search/indexes/{index_id}/documents/batch',
    expectedBody: indexDocumentBatchBody,
    expectedPath: `/v1/relay/search/indexes/${INDEX_ID}/documents/batch`,
    expectedPathParams: {
      index_id: INDEX_ID,
    },
    response: conjoinList([relaySearchDocumentFixture()], {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelaySearches(context.client).indexDocumentBatch(INDEX_ID, indexDocumentBatchBody),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relaySearchDocumentFixture()],
        status: 201,
      }),
  },
  {
    name: 'removes a search document',
    method: 'DELETE',
    path: '/v1/relay/search/indexes/{index_id}/documents/{document_id}',
    expectedPath: `/v1/relay/search/indexes/${INDEX_ID}/documents/${DOCUMENT_ID}`,
    expectedPathParams: {
      document_id: DOCUMENT_ID,
      index_id: INDEX_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(undefined, { requestId: REQUEST_ID }),
    run: context => createRelaySearches(context.client).removeDocument(INDEX_ID, DOCUMENT_ID),
    assertResult: result => expect(result).toBeUndefined(),
  },
  {
    name: 'queries a search index',
    method: 'POST',
    path: '/v1/relay/search/indexes/{index_id}/query',
    expectedBody: searchQueryBody,
    expectedPath: `/v1/relay/search/indexes/${INDEX_ID}/query`,
    expectedPathParams: {
      index_id: INDEX_ID,
    },
    response: conjoinSuccess(
      {
        hits: [
          {
            document: relaySearchDocumentFixture(),
            document_id: DOCUMENT_ID,
            score: 0.99,
          },
        ],
        query_time_ms: 3,
        total: 1,
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createRelaySearches(context.client).searchQuery(INDEX_ID, searchQueryBody),
    assertResult: result =>
      expect(result).toEqual({
        hits: [
          {
            document: relaySearchDocumentFixture(),
            document_id: DOCUMENT_ID,
            score: 0.99,
          },
        ],
        query_time_ms: 3,
        total: 1,
      }),
  },
  {
    name: 'returns search suggestions',
    method: 'POST',
    path: '/v1/relay/search/indexes/{index_id}/suggest',
    expectedBody: autoSuggestBody,
    expectedPath: `/v1/relay/search/indexes/${INDEX_ID}/suggest`,
    expectedPathParams: {
      index_id: INDEX_ID,
    },
    response: conjoinSuccess(
      {
        suggestions: [
          {
            score: 0.9,
            text: 'contract',
          },
        ],
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createRelaySearches(context.client).autoSuggest(INDEX_ID, autoSuggestBody),
    assertResult: result =>
      expect(result).toEqual({
        suggestions: [
          {
            score: 0.9,
            text: 'contract',
          },
        ],
      }),
  },
])
