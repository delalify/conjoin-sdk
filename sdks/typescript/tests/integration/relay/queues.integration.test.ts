import { expect } from 'vitest'
import { createRelayQueues } from '../../../src/relay'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  DLQ_ENTRY_ID,
  describeRelaySdkContractCases,
  QUEUE_ID,
  REQUEST_ID,
  relayExpectedListQuery,
  relayListQuery,
  relayQueueDeadLetterFixture,
  relayQueueDefinitionFixture,
  relayQueueTaskFixture,
  TASK_ID,
} from './relay-test-utils'

const createQueueBody = {
  max_retries: 3,
  name: 'Contract queue',
  reference_id: 'queue_reference_123',
  retry_backoff_strategy: 'exponential' as const,
  target_url: 'https://example.com/tasks',
}
const updateQueueBody = {
  name: 'Renamed queue',
  target_url: 'https://example.com/tasks-v2',
}
const enqueueTaskBody = {
  payload: {
    id: 'contract',
  },
  reference_id: 'task_reference_123',
}
const batchEnqueueTasksBody = {
  tasks: [
    {
      payload: {
        id: 'contract',
      },
      reference_id: 'task_reference_123',
    },
  ],
}
const batchGetQueueTasksBody = {
  task_ids: [TASK_ID],
}
const purgeQueueTasksBody = {
  status: 'completed' as const,
}

describeRelaySdkContractCases('Relay queues SDK contract integration', [
  {
    name: 'creates a queue definition',
    method: 'POST',
    path: '/v1/relay/queues/create',
    expectedBody: createQueueBody,
    response: conjoinSuccess(relayQueueDefinitionFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelayQueues(context.client).createQueueDefinition(createQueueBody),
    assertResult: result => expect(result).toEqual(relayQueueDefinitionFixture()),
  },
  {
    name: 'reads queue definitions',
    method: 'GET',
    path: '/v1/relay/queues/',
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relayQueueDefinitionFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelayQueues(context.client).readQueueDefinitions(relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relayQueueDefinitionFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'updates a queue definition',
    method: 'PATCH',
    path: '/v1/relay/queues/{queue_id}/update',
    expectedBody: updateQueueBody,
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/update`,
    expectedPathParams: {
      queue_id: QUEUE_ID,
    },
    response: conjoinSuccess(
      relayQueueDefinitionFixture({
        name: 'Renamed queue',
        target_url: 'https://example.com/tasks-v2',
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => createRelayQueues(context.client).updateQueueDefinition(QUEUE_ID, updateQueueBody),
    assertResult: result =>
      expect(result).toEqual(
        relayQueueDefinitionFixture({
          name: 'Renamed queue',
          target_url: 'https://example.com/tasks-v2',
        }),
      ),
  },
  {
    name: 'deletes a queue definition',
    method: 'DELETE',
    path: '/v1/relay/queues/{queue_id}/delete',
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/delete`,
    expectedPathParams: {
      queue_id: QUEUE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayQueueDefinitionFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => createRelayQueues(context.client).deleteQueueDefinition(QUEUE_ID),
    assertResult: result => expect(result).toEqual(relayQueueDefinitionFixture({ status: 'deleted' })),
  },
  {
    name: 'pauses a queue',
    method: 'POST',
    path: '/v1/relay/queues/{queue_id}/pause',
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/pause`,
    expectedPathParams: {
      queue_id: QUEUE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayQueueDefinitionFixture({ status: 'paused' }), { requestId: REQUEST_ID }),
    run: context => createRelayQueues(context.client).pauseQueue(QUEUE_ID),
    assertResult: result => expect(result).toEqual(relayQueueDefinitionFixture({ status: 'paused' })),
  },
  {
    name: 'resumes a queue',
    method: 'POST',
    path: '/v1/relay/queues/{queue_id}/resume',
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/resume`,
    expectedPathParams: {
      queue_id: QUEUE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayQueueDefinitionFixture({ status: 'active' }), { requestId: REQUEST_ID }),
    run: context => createRelayQueues(context.client).resumeQueue(QUEUE_ID),
    assertResult: result => expect(result).toEqual(relayQueueDefinitionFixture({ status: 'active' })),
  },
  {
    name: 'enqueues a queue task',
    method: 'POST',
    path: '/v1/relay/queues/{queue_id}/tasks/enqueue',
    expectedBody: enqueueTaskBody,
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/tasks/enqueue`,
    expectedPathParams: {
      queue_id: QUEUE_ID,
    },
    response: conjoinSuccess(relayQueueTaskFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelayQueues(context.client).enqueueTask(QUEUE_ID, enqueueTaskBody),
    assertResult: result => expect(result).toEqual(relayQueueTaskFixture()),
  },
  {
    name: 'batch enqueues queue tasks',
    method: 'POST',
    path: '/v1/relay/queues/{queue_id}/tasks/enqueue-batch',
    expectedBody: batchEnqueueTasksBody,
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/tasks/enqueue-batch`,
    expectedPathParams: {
      queue_id: QUEUE_ID,
    },
    response: conjoinSuccess(
      {
        tasks: [relayQueueTaskFixture()],
        tasks_created: 1,
      },
      {
        requestId: REQUEST_ID,
        status: 201,
      },
    ),
    run: context => createRelayQueues(context.client).batchEnqueueTasks(QUEUE_ID, batchEnqueueTasksBody),
    assertResult: result =>
      expect(result).toEqual({
        tasks: [relayQueueTaskFixture()],
        tasks_created: 1,
      }),
  },
  {
    name: 'reads queue tasks',
    method: 'GET',
    path: '/v1/relay/queues/{queue_id}/tasks',
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/tasks`,
    expectedPathParams: {
      queue_id: QUEUE_ID,
    },
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relayQueueTaskFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelayQueues(context.client).readQueueTasks(QUEUE_ID, relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relayQueueTaskFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads queue dead-letter tasks',
    method: 'GET',
    path: '/v1/relay/queues/{queue_id}/dead-letter',
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/dead-letter`,
    expectedPathParams: {
      queue_id: QUEUE_ID,
    },
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relayQueueDeadLetterFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelayQueues(context.client).readDeadLetterTasks(QUEUE_ID, relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relayQueueDeadLetterFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'replays a queue dead-letter task',
    method: 'POST',
    path: '/v1/relay/queues/{queue_id}/dead-letter/{dlq_entry_id}/replay',
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/dead-letter/${DLQ_ENTRY_ID}/replay`,
    expectedPathParams: {
      dlq_entry_id: DLQ_ENTRY_ID,
      queue_id: QUEUE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayQueueTaskFixture({ status: 'queued' }), { requestId: REQUEST_ID }),
    run: context => createRelayQueues(context.client).replayDeadLetterTask(QUEUE_ID, DLQ_ENTRY_ID),
    assertResult: result => expect(result).toEqual(relayQueueTaskFixture({ status: 'queued' })),
  },
  {
    name: 'batch gets queue tasks',
    method: 'POST',
    path: '/v1/relay/queues/{queue_id}/tasks/batch',
    expectedBody: batchGetQueueTasksBody,
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/tasks/batch`,
    expectedPathParams: {
      queue_id: QUEUE_ID,
    },
    response: conjoinSuccess(
      {
        not_found: [],
        tasks: [relayQueueTaskFixture()],
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createRelayQueues(context.client).batchGetQueueTasks(QUEUE_ID, batchGetQueueTasksBody),
    assertResult: result =>
      expect(result).toEqual({
        not_found: [],
        tasks: [relayQueueTaskFixture()],
      }),
  },
  {
    name: 'purges queue tasks',
    method: 'POST',
    path: '/v1/relay/queues/{queue_id}/tasks/purge',
    expectedBody: purgeQueueTasksBody,
    expectedPath: `/v1/relay/queues/${QUEUE_ID}/tasks/purge`,
    expectedPathParams: {
      queue_id: QUEUE_ID,
    },
    response: conjoinSuccess(
      {
        dead_letters_deleted: 0,
        tasks_deleted: 1,
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createRelayQueues(context.client).purgeQueueTasks(QUEUE_ID, purgeQueueTasksBody),
    assertResult: result =>
      expect(result).toEqual({
        dead_letters_deleted: 0,
        tasks_deleted: 1,
      }),
  },
])
