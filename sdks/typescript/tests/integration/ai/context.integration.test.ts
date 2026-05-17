import { expect } from 'vitest'
import { createAiContexts } from '../../../src/ai'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  aiContextIndexFixture,
  aiContextQueryLogFixture,
  aiContextQueryResultFixture,
  aiExpectedListQuery,
  aiListQuery,
  describeAiSdkContractCases,
  INDEX_ID,
  REQUEST_ID,
} from './ai-test-utils'

const createContextIndexBody = {
  embedding_model: 'text-embedding-3-small',
  name: 'Support docs',
  reference_id: 'context_reference_123',
  source_config: {
    container_id: 'container_123',
  },
  source_type: 'storage_container' as const,
}
const contextQueryBody = {
  index_ids: [INDEX_ID],
  limit: 2,
  modes: ['vector' as const],
  query: 'How do I reset my password?',
}

describeAiSdkContractCases('AI context SDK contract integration', [
  {
    name: 'creates an AI context index',
    method: 'POST',
    path: '/v1/ai/context/context/indexes/create',
    expectedBody: createContextIndexBody,
    response: conjoinSuccess(aiContextIndexFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createAiContexts(context.client).createIndex(createContextIndexBody),
    assertResult: result => expect(result).toEqual(aiContextIndexFixture()),
  },
  {
    name: 'lists AI context indexes',
    method: 'GET',
    path: '/v1/ai/context/context/indexes',
    expectedQuery: aiExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([aiContextIndexFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createAiContexts(context.client).listIndexes(aiListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [aiContextIndexFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads an AI context index',
    method: 'GET',
    path: '/v1/ai/context/context/indexes/{index_id}',
    expectedPath: `/v1/ai/context/context/indexes/${INDEX_ID}`,
    expectedPathParams: {
      index_id: INDEX_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(aiContextIndexFixture(), { requestId: REQUEST_ID }),
    run: context => createAiContexts(context.client).readIndex(INDEX_ID),
    assertResult: result => expect(result).toEqual(aiContextIndexFixture()),
  },
  {
    name: 'deletes an AI context index',
    method: 'DELETE',
    path: '/v1/ai/context/context/indexes/{index_id}/delete',
    expectedPath: `/v1/ai/context/context/indexes/${INDEX_ID}/delete`,
    expectedPathParams: {
      index_id: INDEX_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(aiContextIndexFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => createAiContexts(context.client).deleteIndex(INDEX_ID),
    assertResult: result => expect(result).toEqual(aiContextIndexFixture({ status: 'deleted' })),
  },
  {
    name: 'syncs an AI context index',
    method: 'POST',
    path: '/v1/ai/context/context/indexes/{index_id}/sync',
    expectedPath: `/v1/ai/context/context/indexes/${INDEX_ID}/sync`,
    expectedPathParams: {
      index_id: INDEX_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(aiContextIndexFixture({ sync_status: 'syncing' }), { requestId: REQUEST_ID }),
    run: context => createAiContexts(context.client).syncIndex(INDEX_ID),
    assertResult: result => expect(result).toEqual(aiContextIndexFixture({ sync_status: 'syncing' })),
  },
  {
    name: 'queries AI context',
    method: 'POST',
    path: '/v1/ai/context/context/query',
    expectedBody: contextQueryBody,
    response: conjoinSuccess(aiContextQueryResultFixture(), { requestId: REQUEST_ID }),
    run: context => createAiContexts(context.client).query(contextQueryBody),
    assertResult: result => expect(result).toEqual(aiContextQueryResultFixture()),
  },
  {
    name: 'lists AI context query logs',
    method: 'GET',
    path: '/v1/ai/context/context/query-logs',
    expectedQuery: aiExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([aiContextQueryLogFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createAiContexts(context.client).listQueryLogs(aiListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [aiContextQueryLogFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
])
