import { expect } from 'vitest'
import { createAiPolicies } from '../../../src/ai'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  aiExpectedListQuery,
  aiListQuery,
  aiPolicyLogFixture,
  aiPolicyRuleFixture,
  describeAiSdkContractCases,
  REQUEST_ID,
  RULE_ID,
} from './ai-test-utils'

const policyCheckBody = {
  content: 'Email me at person@example.com',
  direction: 'request' as const,
}
const createPolicyRuleBody = {
  action: 'redact' as const,
  config: {
    pii_types: ['email'],
  },
  direction: 'request' as const,
  name: 'Redact emails',
  priority: 10,
  reference_id: 'policy_rule_reference_123',
  rule_type: 'pii_redaction' as const,
}
const updatePolicyRuleBody = {
  is_active: true,
  priority: 11,
  status: 'active' as const,
}

describeAiSdkContractCases('AI policy SDK contract integration', [
  {
    name: 'checks AI policy',
    method: 'POST',
    path: '/v1/ai/policy/check',
    expectedBody: policyCheckBody,
    response: conjoinSuccess(
      {
        action_taken: 'redact',
        allowed: true,
        matched_rules: [
          {
            action: 'redact',
            detections: [
              {
                confidence: 0.99,
                position: {
                  end: 28,
                  start: 12,
                },
                type: 'email',
                value: 'person@example.com',
              },
            ],
            rule_id: RULE_ID,
            rule_type: 'pii_redaction',
          },
        ],
        transformed_content: 'Email me at [REDACTED]',
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createAiPolicies(context.client).check(policyCheckBody),
    assertResult: result =>
      expect(result).toEqual({
        action_taken: 'redact',
        allowed: true,
        matched_rules: [
          {
            action: 'redact',
            detections: [
              {
                confidence: 0.99,
                position: {
                  end: 28,
                  start: 12,
                },
                type: 'email',
                value: 'person@example.com',
              },
            ],
            rule_id: RULE_ID,
            rule_type: 'pii_redaction',
          },
        ],
        transformed_content: 'Email me at [REDACTED]',
      }),
  },
  {
    name: 'creates an AI policy rule',
    method: 'POST',
    path: '/v1/ai/policy/rules/create',
    expectedBody: createPolicyRuleBody,
    response: conjoinSuccess(aiPolicyRuleFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createAiPolicies(context.client).createRule(createPolicyRuleBody),
    assertResult: result => expect(result).toEqual(aiPolicyRuleFixture()),
  },
  {
    name: 'lists AI policy rules',
    method: 'GET',
    path: '/v1/ai/policy/rules',
    expectedQuery: aiExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([aiPolicyRuleFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createAiPolicies(context.client).listRules(aiListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [aiPolicyRuleFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads an AI policy rule',
    method: 'GET',
    path: '/v1/ai/policy/rules/{rule_id}',
    expectedPath: `/v1/ai/policy/rules/${RULE_ID}`,
    expectedPathParams: {
      rule_id: RULE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(aiPolicyRuleFixture(), { requestId: REQUEST_ID }),
    run: context => createAiPolicies(context.client).readRule(RULE_ID),
    assertResult: result => expect(result).toEqual(aiPolicyRuleFixture()),
  },
  {
    name: 'updates an AI policy rule',
    method: 'PATCH',
    path: '/v1/ai/policy/rules/{rule_id}/update',
    expectedBody: updatePolicyRuleBody,
    expectedPath: `/v1/ai/policy/rules/${RULE_ID}/update`,
    expectedPathParams: {
      rule_id: RULE_ID,
    },
    response: conjoinSuccess(aiPolicyRuleFixture({ priority: 11 }), { requestId: REQUEST_ID }),
    run: context => createAiPolicies(context.client).updateRule(RULE_ID, updatePolicyRuleBody),
    assertResult: result => expect(result).toEqual(aiPolicyRuleFixture({ priority: 11 })),
  },
  {
    name: 'deletes an AI policy rule',
    method: 'DELETE',
    path: '/v1/ai/policy/rules/{rule_id}/delete',
    expectedPath: `/v1/ai/policy/rules/${RULE_ID}/delete`,
    expectedPathParams: {
      rule_id: RULE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(aiPolicyRuleFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => createAiPolicies(context.client).deleteRule(RULE_ID),
    assertResult: result => expect(result).toEqual(aiPolicyRuleFixture({ status: 'deleted' })),
  },
  {
    name: 'lists AI policy logs',
    method: 'GET',
    path: '/v1/ai/policy/logs',
    expectedQuery: aiExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([aiPolicyLogFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createAiPolicies(context.client).listLogs(aiListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [aiPolicyLogFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
])
