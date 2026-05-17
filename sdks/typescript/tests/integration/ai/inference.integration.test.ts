import { expect } from 'vitest'
import { createAiInferences } from '../../../src/ai'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  aiExpectedListQuery,
  aiInferenceRequestFixture,
  aiListQuery,
  describeAiSdkContractCases,
  MODEL_ID,
  REQUEST_ID,
} from './ai-test-utils'

const chatCompletionBody = {
  max_tokens: 128,
  messages: [
    {
      content: 'Summarize the contract.',
      role: 'user',
    },
  ],
  model: MODEL_ID,
  stream: false,
}
const multiModelBody = {
  messages: [
    {
      content: 'Compare these options.',
      role: 'user',
    },
  ],
  models: [MODEL_ID],
  synthesize: true,
}
const bestOfNBody = {
  messages: [
    {
      content: 'Draft a concise answer.',
      role: 'user',
    },
  ],
  model: MODEL_ID,
  n: 2,
  selection_criteria: 'coherence' as const,
}

describeAiSdkContractCases('AI inference SDK contract integration', [
  {
    name: 'creates an AI chat completion',
    method: 'POST',
    path: '/v1/ai/inference/chat/completions',
    expectedBody: chatCompletionBody,
    response: conjoinSuccess(aiInferenceRequestFixture(), { requestId: REQUEST_ID }),
    run: context => createAiInferences(context.client).createChatCompletion(chatCompletionBody),
    assertResult: result => expect(result).toEqual(aiInferenceRequestFixture()),
  },
  {
    name: 'creates an AI multi-model inference',
    method: 'POST',
    path: '/v1/ai/inference/multi-model',
    expectedBody: multiModelBody,
    response: conjoinSuccess(aiInferenceRequestFixture({ request_type: 'multi_model' }), { requestId: REQUEST_ID }),
    run: context => createAiInferences(context.client).createAiMultiModel(multiModelBody),
    assertResult: result => expect(result).toEqual(aiInferenceRequestFixture({ request_type: 'multi_model' })),
  },
  {
    name: 'creates an AI best-of-n inference',
    method: 'POST',
    path: '/v1/ai/inference/best-of-n',
    expectedBody: bestOfNBody,
    response: conjoinSuccess(aiInferenceRequestFixture({ request_type: 'best_of_n' }), { requestId: REQUEST_ID }),
    run: context => createAiInferences(context.client).createAiBestOfN(bestOfNBody),
    assertResult: result => expect(result).toEqual(aiInferenceRequestFixture({ request_type: 'best_of_n' })),
  },
  {
    name: 'lists AI inference requests',
    method: 'GET',
    path: '/v1/ai/inference/requests',
    expectedQuery: aiExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([aiInferenceRequestFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createAiInferences(context.client).listRequests(aiListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [aiInferenceRequestFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads an AI inference request',
    method: 'GET',
    path: '/v1/ai/inference/requests/{request_id}',
    expectedPath: `/v1/ai/inference/requests/${REQUEST_ID}`,
    expectedPathParams: {
      request_id: REQUEST_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(aiInferenceRequestFixture(), { requestId: REQUEST_ID }),
    run: context => createAiInferences(context.client).readRequest(REQUEST_ID),
    assertResult: result => expect(result).toEqual(aiInferenceRequestFixture()),
  },
])
