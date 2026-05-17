import { expect } from 'vitest'
import { createAiUsages } from '../../../src/ai'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  aiExpectedListQuery,
  aiListQuery,
  aiUsageRecordFixture,
  aiUsageSummaryFixture,
  describeAiSdkContractCases,
  REQUEST_ID,
} from './ai-test-utils'

const usageSummaryQuery = {
  billing_period: '2026-05',
}

describeAiSdkContractCases('AI usage SDK contract integration', [
  {
    name: 'lists AI usage records',
    method: 'GET',
    path: '/v1/ai/usage/usage/records',
    expectedQuery: aiExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([aiUsageRecordFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createAiUsages(context.client).listRecords(aiListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [aiUsageRecordFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads AI usage summary',
    method: 'GET',
    path: '/v1/ai/usage/usage/summary',
    expectedQuery: {
      billing_period: '2026-05',
    },
    expectedRawBody: '',
    response: conjoinSuccess(aiUsageSummaryFixture(), { requestId: REQUEST_ID }),
    run: context => createAiUsages(context.client).readSummary(usageSummaryQuery),
    assertResult: result => expect(result).toEqual(aiUsageSummaryFixture()),
  },
])
