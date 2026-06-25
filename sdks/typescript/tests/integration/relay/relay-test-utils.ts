import { createConjoinClient } from '../../../src/core/client'
import type { ConjoinClient } from '../../../src/core/types'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../../src/core/version'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { startConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { describeSdkContractCases, type SdkContractCase } from '../sdk-contract/run-sdk-contract-cases'

export const API_KEY = 'ck_test_relay_contract'
export const CHANNEL_ID = 'relay_channel_123'
export const CLUSTER_ID = 'memorystore_cluster_123'
export const CONJOIN_ACCOUNT_ID = 'account_123'
export const CONJOIN_PROJECT_ID = 'project_123'
export const DATE_CREATED = '2026-05-16T00:00:00.000Z'
export const DATE_UPDATED = '2026-05-16T01:00:00.000Z'
export const DLQ_ENTRY_ID = 'dlq_entry_123'
export const DOCUMENT_ID = 'document_123'
export const EVENT_ID = 'event_123'
export const EXECUTION_ID = 'execution_123'
export const INDEX_ID = 'search_index_123'
export const PIPELINE_ID = 'pipeline_123'
export const QUEUE_ID = 'queue_123'
export const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'
export const RUN_ID = 'pipeline_run_123'
export const SCHEDULE_ID = 'schedule_123'
export const SETTINGS_ID = 'settings_123'
export const STEP_ID = 'gate_step_123'
export const SUBSCRIPTION_ID = 'subscription_123'
export const TASK_ID = 'task_123'

export type RelayContractTestContext = {
  client: ConjoinClient
  server: ConjoinContractServer
}

export type RelaySdkContractCase<TResult = unknown> = SdkContractCase<RelayContractTestContext, TResult>

export const startRelayContractTest = async (): Promise<RelayContractTestContext> => {
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

export const describeRelaySdkContractCases = (suiteName: string, cases: RelaySdkContractCase[]): void => {
  describeSdkContractCases({
    cases,
    defaultExpectedHeaders: {
      authorization: `Bearer ${API_KEY}`,
      'x-conjoin-api-version': DEFAULT_API_VERSION,
      'x-conjoin-sdk-version': SDK_VERSION,
    },
    startContext: startRelayContractTest,
    suiteName,
  })
}

export const relayListQuery = {
  limit: 2,
}

export const relayExpectedListQuery = {
  limit: '2',
}

export const relayBroadcastChannelFixture = (overrides: Record<string, unknown> = {}) => ({
  authorization_mode: 'token',
  channel_id: CHANNEL_ID,
  channel_type: 'presence',
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  name: 'Contract channel',
  status: 'active',
  ...overrides,
})

export const relayEventChannelFixture = (overrides: Record<string, unknown> = {}) => ({
  channel_id: CHANNEL_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  name: 'Contract events',
  status: 'active',
  ...overrides,
})

export const relayEventSubscriptionFixture = (overrides: Record<string, unknown> = {}) => ({
  channel_id: CHANNEL_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  endpoint_url: 'https://example.com/events',
  live_mode: false,
  status: 'active',
  subscription_id: SUBSCRIPTION_ID,
  ...overrides,
})

export const relayEventFixture = (overrides: Record<string, unknown> = {}) => ({
  channel_id: CHANNEL_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  event_id: EVENT_ID,
  event_type: 'contract.created',
  live_mode: false,
  status: 'published',
  ...overrides,
})

export const relayMemorystoreClusterFixture = (overrides: Record<string, unknown> = {}) => ({
  cluster_id: CLUSTER_ID,
  cluster_type: 'shared',
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  name: 'Contract cache',
  status: 'active',
  ...overrides,
})

export const relayPipelineDefinitionFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  endpoint_url: 'https://example.com/pipeline',
  live_mode: false,
  name: 'Contract pipeline',
  pipeline_id: PIPELINE_ID,
  status: 'active',
  ...overrides,
})

export const relayPipelineRunFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  conjoin_request_id: REQUEST_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  pipeline_id: PIPELINE_ID,
  run_id: RUN_ID,
  status: 'running',
  ...overrides,
})

export const relayQueueDefinitionFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  name: 'Contract queue',
  queue_id: QUEUE_ID,
  status: 'active',
  target_url: 'https://example.com/tasks',
  ...overrides,
})

export const relayQueueTaskFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  conjoin_request_id: REQUEST_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  queue_id: QUEUE_ID,
  status: 'queued',
  task_id: TASK_ID,
  ...overrides,
})

export const relayQueueDeadLetterFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  conjoin_request_id: REQUEST_ID,
  date_created: DATE_CREATED,
  dlq_entry_id: DLQ_ENTRY_ID,
  live_mode: false,
  queue_id: QUEUE_ID,
  task_id: TASK_ID,
  ...overrides,
})

export const relaySchedulerDefinitionFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  dlq_enabled: true,
  live_mode: false,
  max_retries: 3,
  name: 'Contract schedule',
  retry_backoff_base_seconds: 30,
  retry_backoff_strategy: 'exponential',
  schedule_id: SCHEDULE_ID,
  schedule_type: 'cron',
  status: 'active',
  target_url: 'https://example.com/schedules',
  timeout_seconds: 30,
  ...overrides,
})

export const relaySchedulerExecutionFixture = (overrides: Record<string, unknown> = {}) => ({
  attempts: 1,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  conjoin_request_id: REQUEST_ID,
  date_created: DATE_CREATED,
  executed_at: DATE_CREATED,
  execution_id: EXECUTION_ID,
  live_mode: false,
  max_attempts: 3,
  schedule_id: SCHEDULE_ID,
  status: 'success',
  ...overrides,
})

export const relaySchedulerDeadLetterFixture = (overrides: Record<string, unknown> = {}) => ({
  attempts: 3,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  conjoin_request_id: REQUEST_ID,
  date_created: DATE_CREATED,
  dlq_entry_id: DLQ_ENTRY_ID,
  execution_id: EXECUTION_ID,
  failed_at: DATE_CREATED,
  failure_reason: 'Endpoint unavailable',
  live_mode: false,
  payload: {
    id: 'contract',
  },
  replayed: false,
  schedule_id: SCHEDULE_ID,
  target_url: 'https://example.com/schedules',
  ...overrides,
})

export const relaySearchIndexFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  index_id: INDEX_ID,
  live_mode: false,
  name: 'Contract search',
  schema_definition: {
    fields: {
      title: {
        type: 'string',
      },
    },
  },
  status: 'active',
  ...overrides,
})

export const relaySearchDocumentFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  content: {
    title: 'Contract document',
  },
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  document_id: DOCUMENT_ID,
  index_id: INDEX_ID,
  live_mode: false,
  ...overrides,
})

export const relaySettingsFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  live_mode: false,
  settings_id: SETTINGS_ID,
  signing_secret_masked: 'cnj_whsec_****1234',
  ...overrides,
})
