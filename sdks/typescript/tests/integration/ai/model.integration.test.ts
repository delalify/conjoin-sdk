import { expect } from 'vitest'
import { createAiModels } from '../../../src/ai'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  aiExpectedListQuery,
  aiListQuery,
  aiModelFixture,
  describeAiSdkContractCases,
  MODEL_ID,
  REQUEST_ID,
} from './ai-test-utils'

describeAiSdkContractCases('AI model SDK contract integration', [
  {
    name: 'lists AI models',
    method: 'GET',
    path: '/v1/ai/model/models',
    expectedQuery: aiExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([aiModelFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createAiModels(context.client).list(aiListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [aiModelFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads an AI model',
    method: 'GET',
    path: '/v1/ai/model/models/{model_id}',
    expectedPath: `/v1/ai/model/models/${MODEL_ID}`,
    expectedPathParams: {
      model_id: MODEL_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(aiModelFixture(), { requestId: REQUEST_ID }),
    run: context => createAiModels(context.client).read(MODEL_ID),
    assertResult: result => expect(result).toEqual(aiModelFixture()),
  },
])
