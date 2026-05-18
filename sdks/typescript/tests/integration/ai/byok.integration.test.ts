import { expect } from 'vitest'
import { createAiBYOKs } from '../../../src/ai'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  aiByokConfigFixture,
  aiExpectedListQuery,
  aiListQuery,
  BYOK_CONFIG_ID,
  describeAiSdkContractCases,
  REQUEST_ID,
} from './ai-test-utils'

const createByokConfigBody = {
  allowed_models: ['gpt-4.1-mini'],
  api_key: 'sk-contract',
  endpoint_url: 'https://api.example.com/v1',
  metadata: {
    source: 'contract',
  },
  provider: 'openai' as const,
  provider_name: 'OpenAI',
  reference_id: 'byok_reference_123',
}
const updateByokConfigBody = {
  is_enabled: true,
  provider_name: 'OpenAI renamed',
  status: 'active' as const,
}

describeAiSdkContractCases('AI BYOK SDK contract integration', [
  {
    name: 'creates an AI BYOK config',
    method: 'POST',
    path: '/v1/ai/byok/create',
    expectedBody: createByokConfigBody,
    response: conjoinSuccess(aiByokConfigFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createAiBYOKs(context.client).createByokConfig(createByokConfigBody),
    assertResult: result => expect(result).toEqual(aiByokConfigFixture()),
  },
  {
    name: 'lists AI BYOK configs',
    method: 'GET',
    path: '/v1/ai/byok/',
    expectedQuery: aiExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([aiByokConfigFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createAiBYOKs(context.client).listByokConfigs(aiListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [aiByokConfigFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads an AI BYOK config',
    method: 'GET',
    path: '/v1/ai/byok/{byok_config_id}',
    expectedPath: `/v1/ai/byok/${BYOK_CONFIG_ID}`,
    expectedPathParams: {
      byok_config_id: BYOK_CONFIG_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(aiByokConfigFixture(), { requestId: REQUEST_ID }),
    run: context => createAiBYOKs(context.client).readByokConfig(BYOK_CONFIG_ID),
    assertResult: result => expect(result).toEqual(aiByokConfigFixture()),
  },
  {
    name: 'updates an AI BYOK config',
    method: 'PATCH',
    path: '/v1/ai/byok/{byok_config_id}/update',
    expectedBody: updateByokConfigBody,
    expectedPath: `/v1/ai/byok/${BYOK_CONFIG_ID}/update`,
    expectedPathParams: {
      byok_config_id: BYOK_CONFIG_ID,
    },
    response: conjoinSuccess(aiByokConfigFixture({ provider_name: 'OpenAI renamed' }), { requestId: REQUEST_ID }),
    run: context => createAiBYOKs(context.client).updateByokConfig(BYOK_CONFIG_ID, updateByokConfigBody),
    assertResult: result => expect(result).toEqual(aiByokConfigFixture({ provider_name: 'OpenAI renamed' })),
  },
  {
    name: 'deletes an AI BYOK config',
    method: 'DELETE',
    path: '/v1/ai/byok/{byok_config_id}/delete',
    expectedPath: `/v1/ai/byok/${BYOK_CONFIG_ID}/delete`,
    expectedPathParams: {
      byok_config_id: BYOK_CONFIG_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(aiByokConfigFixture({ status: 'archived' }), { requestId: REQUEST_ID }),
    run: context => createAiBYOKs(context.client).deleteByokConfig(BYOK_CONFIG_ID),
    assertResult: result => expect(result).toEqual(aiByokConfigFixture({ status: 'archived' })),
  },
  {
    name: 'tests an AI BYOK connection',
    method: 'POST',
    path: '/v1/ai/byok/{byok_config_id}/test',
    expectedPath: `/v1/ai/byok/${BYOK_CONFIG_ID}/test`,
    expectedPathParams: {
      byok_config_id: BYOK_CONFIG_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(
      {
        connected: true,
        message: 'Connection verified',
        provider: 'openai',
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createAiBYOKs(context.client).testByokConnection(BYOK_CONFIG_ID),
    assertResult: result =>
      expect(result).toEqual({
        connected: true,
        message: 'Connection verified',
        provider: 'openai',
      }),
  },
])
