import { createConjoinClient } from '../../../src/core/client'
import type { ConjoinClient } from '../../../src/core/types'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../../src/core/version'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { startConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { describeSdkContractCases, type SdkContractCase } from '../sdk-contract/run-sdk-contract-cases'

export const API_KEY = 'ck_test_ai_contract'
export const BYOK_CONFIG_ID = 'byok_config_123'
export const CONJOIN_ACCOUNT_ID = 'account_123'
export const CONJOIN_PROJECT_ID = 'project_123'
export const DATE_CREATED = '2026-05-16T00:00:00.000Z'
export const DATE_UPDATED = '2026-05-16T01:00:00.000Z'
export const INDEX_ID = 'context_index_123'
export const LOG_ID = 'policy_log_123'
export const MODEL_ID = 'model_123'
export const QUERY_ID = 'query_123'
export const RECORD_ID = 'usage_record_123'
export const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'
export const RULE_ID = 'policy_rule_123'

export type AiContractTestContext = {
  client: ConjoinClient
  server: ConjoinContractServer
}

export type AiSdkContractCase<TResult = unknown> = SdkContractCase<AiContractTestContext, TResult>

export const startAiContractTest = async (): Promise<AiContractTestContext> => {
  const server = await startConjoinContractServer()
  const client = createConjoinClient({
    apiKey: API_KEY,
    baseUrl: server.baseUrl,
  })

  return {
    client,
    server,
  }
}

export const describeAiSdkContractCases = (suiteName: string, cases: AiSdkContractCase[]): void => {
  describeSdkContractCases({
    cases,
    defaultExpectedHeaders: {
      authorization: `Bearer ${API_KEY}`,
      'x-conjoin-api-version': DEFAULT_API_VERSION,
      'x-conjoin-sdk-version': SDK_VERSION,
    },
    startContext: startAiContractTest,
    suiteName,
  })
}

export const aiListQuery = {
  limit: 2,
}

export const aiExpectedListQuery = {
  limit: '2',
}

export const aiByokConfigFixture = (overrides: Record<string, unknown> = {}) => ({
  allowed_models: ['gpt-5.5'],
  byok_config_id: BYOK_CONFIG_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  endpoint_url: 'https://api.example.com/v1',
  has_api_key: true,
  is_enabled: true,
  live_mode: false,
  metadata: {
    source: 'contract',
  },
  provider: 'openai',
  provider_name: 'OpenAI',
  reference_id: 'byok_reference_123',
  status: 'active',
  ...overrides,
})

export const aiContextIndexFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  document_count: 3,
  embedding_dimensions: 1536,
  embedding_model: 'text-embedding-3-small',
  index_id: INDEX_ID,
  live_mode: false,
  metadata: {
    source: 'contract',
  },
  name: 'Support docs',
  reference_id: 'context_reference_123',
  source_config: {
    container_id: 'container_123',
  },
  source_type: 'storage_container',
  status: 'active',
  sync_status: 'synced',
  total_size_bytes: 2048,
  ...overrides,
})

export const aiContextQueryResultFixture = (overrides: Record<string, unknown> = {}) => ({
  latency_ms: 18,
  modes_used: ['vector'],
  query_id: QUERY_ID,
  results: [
    {
      chunk_index: 0,
      document_id: 'document_123',
      score: 0.97,
      source_path: '/support/reset-password.md',
      text_content: 'The answer is in the support guide.',
    },
  ],
  total_results: 1,
  ...overrides,
})

export const aiContextQueryLogFixture = (overrides: Record<string, unknown> = {}) => ({
  agentic_reads_count: 0,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  fulltext_results_count: 0,
  index_ids: [INDEX_ID],
  latency_ms: 18,
  live_mode: false,
  modes_used: ['vector'],
  queried_at: DATE_CREATED,
  query_id: QUERY_ID,
  token_cost_usd: 0.001,
  total_results_returned: 1,
  vector_results_count: 1,
  ...overrides,
})

export const aiInferenceRequestFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  conjoin_request_id: REQUEST_ID,
  context_used: false,
  cost_usd: 0.001,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  is_byok: false,
  latency_ms: 42,
  live_mode: false,
  model: MODEL_ID,
  policy_applied: false,
  provider: 'openai',
  request_id: REQUEST_ID,
  request_type: 'chat_completion',
  status: 'completed',
  streaming_enabled: false,
  token_usage: {
    input_tokens: 12,
    output_tokens: 8,
    total_tokens: 20,
  },
  ...overrides,
})

export const aiModelFixture = (overrides: Record<string, unknown> = {}) => ({
  capabilities: {
    chat: true,
  },
  context_window: 128000,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  display_name: 'Contract Model',
  is_active: true,
  max_output_tokens: 4096,
  model_id: MODEL_ID,
  plan_availability: 'starter',
  pricing: {
    currency: 'USD',
    input_per_million_tokens: 1,
    last_verified_at: DATE_CREATED,
    output_per_million_tokens: 3,
  },
  vendor: 'openai',
  ...overrides,
})

export const aiPolicyRuleFixture = (overrides: Record<string, unknown> = {}) => ({
  action: 'redact',
  config: {
    pii_types: ['email'],
  },
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  direction: 'request',
  is_active: true,
  live_mode: false,
  metadata: {
    source: 'contract',
  },
  name: 'Redact emails',
  priority: 10,
  reference_id: 'policy_rule_reference_123',
  rule_id: RULE_ID,
  rule_type: 'pii_redaction',
  status: 'active',
  ...overrides,
})

export const aiPolicyLogFixture = (overrides: Record<string, unknown> = {}) => ({
  action_taken: 'redact',
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
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
  direction: 'request',
  live_mode: false,
  log_id: LOG_ID,
  logged_at: DATE_CREATED,
  request_id: REQUEST_ID,
  rule_id: RULE_ID,
  rule_type: 'pii_redaction',
  severity: 'low',
  ...overrides,
})

export const aiUsageRecordFixture = (overrides: Record<string, unknown> = {}) => ({
  billing_period: '2026-05',
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  conjoin_request_id: REQUEST_ID,
  cost_usd: 0.001,
  date_created: DATE_CREATED,
  input_tokens: 12,
  is_billable: true,
  latency_ms: 42,
  live_mode: false,
  output_tokens: 8,
  record_id: RECORD_ID,
  record_type: 'inference',
  recorded_at: DATE_CREATED,
  total_tokens: 20,
  ...overrides,
})

export const aiUsageSummaryFixture = (overrides: Record<string, unknown> = {}) => ({
  billing_period: '2026-05',
  breakdown_by_model: [
    {
      model: MODEL_ID,
      total_cost_usd: 0.001,
      total_requests: 1,
      total_tokens: 20,
    },
  ],
  breakdown_by_type: [
    {
      record_type: 'inference',
      total_cost_usd: 0.001,
      total_requests: 1,
      total_tokens: 20,
    },
  ],
  total_cost_usd: 0.001,
  total_requests: 1,
  total_tokens: 20,
  ...overrides,
})
