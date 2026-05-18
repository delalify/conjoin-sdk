import { expect } from 'vitest'
import { createRelaySchedulers } from '../../../src/relay'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  DLQ_ENTRY_ID,
  describeRelaySdkContractCases,
  REQUEST_ID,
  relayExpectedListQuery,
  relayListQuery,
  relaySchedulerDeadLetterFixture,
  relaySchedulerDefinitionFixture,
  relaySchedulerExecutionFixture,
  SCHEDULE_ID,
} from './relay-test-utils'

const createDefinitionBody = {
  cron_expression: '*/5 * * * *',
  max_retries: 3,
  name: 'Contract schedule',
  retry_backoff_strategy: 'exponential' as const,
  schedule_type: 'cron' as const,
  target_url: 'https://example.com/schedules',
  timezone: 'UTC',
}
const updateDefinitionBody = {
  name: 'Renamed schedule',
  target_url: 'https://example.com/schedules-v2',
}

describeRelaySdkContractCases('Relay scheduler SDK contract integration', [
  {
    name: 'creates a scheduler definition',
    method: 'POST',
    path: '/v1/relay/scheduler/create',
    expectedBody: createDefinitionBody,
    response: conjoinSuccess(relaySchedulerDefinitionFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelaySchedulers(context.client).createDefinition(createDefinitionBody),
    assertResult: result => expect(result).toEqual(relaySchedulerDefinitionFixture()),
  },
  {
    name: 'reads scheduler definitions',
    method: 'GET',
    path: '/v1/relay/scheduler/',
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relaySchedulerDefinitionFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelaySchedulers(context.client).readDefinitions(relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relaySchedulerDefinitionFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'updates a scheduler definition',
    method: 'PATCH',
    path: '/v1/relay/scheduler/{schedule_id}/update',
    expectedBody: updateDefinitionBody,
    expectedPath: `/v1/relay/scheduler/${SCHEDULE_ID}/update`,
    expectedPathParams: {
      schedule_id: SCHEDULE_ID,
    },
    response: conjoinSuccess(
      relaySchedulerDefinitionFixture({
        name: 'Renamed schedule',
        target_url: 'https://example.com/schedules-v2',
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => createRelaySchedulers(context.client).updateDefinition(SCHEDULE_ID, updateDefinitionBody),
    assertResult: result =>
      expect(result).toEqual(
        relaySchedulerDefinitionFixture({
          name: 'Renamed schedule',
          target_url: 'https://example.com/schedules-v2',
        }),
      ),
  },
  {
    name: 'pauses a scheduler definition',
    method: 'POST',
    path: '/v1/relay/scheduler/{schedule_id}/pause',
    expectedPath: `/v1/relay/scheduler/${SCHEDULE_ID}/pause`,
    expectedPathParams: {
      schedule_id: SCHEDULE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relaySchedulerDefinitionFixture({ status: 'paused' }), { requestId: REQUEST_ID }),
    run: context => createRelaySchedulers(context.client).pause(SCHEDULE_ID),
    assertResult: result => expect(result).toEqual(relaySchedulerDefinitionFixture({ status: 'paused' })),
  },
  {
    name: 'resumes a scheduler definition',
    method: 'POST',
    path: '/v1/relay/scheduler/{schedule_id}/resume',
    expectedPath: `/v1/relay/scheduler/${SCHEDULE_ID}/resume`,
    expectedPathParams: {
      schedule_id: SCHEDULE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relaySchedulerDefinitionFixture({ status: 'active' }), { requestId: REQUEST_ID }),
    run: context => createRelaySchedulers(context.client).resume(SCHEDULE_ID),
    assertResult: result => expect(result).toEqual(relaySchedulerDefinitionFixture({ status: 'active' })),
  },
  {
    name: 'cancels a scheduler definition',
    method: 'POST',
    path: '/v1/relay/scheduler/{schedule_id}/cancel',
    expectedPath: `/v1/relay/scheduler/${SCHEDULE_ID}/cancel`,
    expectedPathParams: {
      schedule_id: SCHEDULE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relaySchedulerDefinitionFixture({ status: 'cancelled' }), { requestId: REQUEST_ID }),
    run: context => createRelaySchedulers(context.client).cancel(SCHEDULE_ID),
    assertResult: result => expect(result).toEqual(relaySchedulerDefinitionFixture({ status: 'cancelled' })),
  },
  {
    name: 'triggers a scheduler execution',
    method: 'POST',
    path: '/v1/relay/scheduler/{schedule_id}/trigger',
    expectedPath: `/v1/relay/scheduler/${SCHEDULE_ID}/trigger`,
    expectedPathParams: {
      schedule_id: SCHEDULE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relaySchedulerExecutionFixture(), { requestId: REQUEST_ID }),
    run: context => createRelaySchedulers(context.client).triggerExecution(SCHEDULE_ID),
    assertResult: result => expect(result).toEqual(relaySchedulerExecutionFixture()),
  },
  {
    name: 'reads scheduler executions',
    method: 'GET',
    path: '/v1/relay/scheduler/{schedule_id}/executions',
    expectedPath: `/v1/relay/scheduler/${SCHEDULE_ID}/executions`,
    expectedPathParams: {
      schedule_id: SCHEDULE_ID,
    },
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relaySchedulerExecutionFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelaySchedulers(context.client).readExecutions(SCHEDULE_ID, relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relaySchedulerExecutionFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads scheduler dead-letter entries',
    method: 'GET',
    path: '/v1/relay/scheduler/{schedule_id}/dead-letters',
    expectedPath: `/v1/relay/scheduler/${SCHEDULE_ID}/dead-letters`,
    expectedPathParams: {
      schedule_id: SCHEDULE_ID,
    },
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relaySchedulerDeadLetterFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelaySchedulers(context.client).readDeadLetterEntries(SCHEDULE_ID, relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relaySchedulerDeadLetterFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'replays a scheduler dead-letter entry',
    method: 'POST',
    path: '/v1/relay/scheduler/{schedule_id}/dead-letters/{dlq_entry_id}/replay',
    expectedPath: `/v1/relay/scheduler/${SCHEDULE_ID}/dead-letters/${DLQ_ENTRY_ID}/replay`,
    expectedPathParams: {
      dlq_entry_id: DLQ_ENTRY_ID,
      schedule_id: SCHEDULE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relaySchedulerDeadLetterFixture({ replayed: true }), { requestId: REQUEST_ID }),
    run: context => createRelaySchedulers(context.client).replayDeadLetterEntry(SCHEDULE_ID, DLQ_ENTRY_ID),
    assertResult: result => expect(result).toEqual(relaySchedulerDeadLetterFixture({ replayed: true })),
  },
])
