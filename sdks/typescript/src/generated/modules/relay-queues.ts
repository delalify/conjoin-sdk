import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateQueueDefinitionBody = operations['createQueueDefinition']['requestBody']['content']['application/json']
type CreateQueueDefinitionData = NonNullable<operations['createQueueDefinition']['responses']['201']['content']['application/json']['data']>
type ReadQueueDefinitionsData = NonNullable<operations['readQueueDefinitions']['responses']['200']['content']['application/json']['data']>[number]
type ReadQueueDefinitionsQuery = NonNullable<operations['readQueueDefinitions']['parameters']['query']>
type UpdateQueueDefinitionBody = operations['updateQueueDefinition']['requestBody']['content']['application/json']
type UpdateQueueDefinitionData = NonNullable<operations['updateQueueDefinition']['responses']['200']['content']['application/json']['data']>
type DeleteQueueDefinitionData = NonNullable<operations['deleteQueueDefinition']['responses']['200']['content']['application/json']['data']>
type EnqueueTaskBody = operations['enqueueTask']['requestBody']['content']['application/json']
type EnqueueTaskData = NonNullable<operations['enqueueTask']['responses']['201']['content']['application/json']['data']>
type ReadQueueTasksData = NonNullable<operations['readQueueTasks']['responses']['200']['content']['application/json']['data']>[number]
type ReadQueueTasksQuery = NonNullable<operations['readQueueTasks']['parameters']['query']>
type ReadDeadLetterTasksData = NonNullable<operations['readDeadLetterTasks']['responses']['200']['content']['application/json']['data']>[number]
type ReadDeadLetterTasksQuery = NonNullable<operations['readDeadLetterTasks']['parameters']['query']>
type ReplayDeadLetterTaskData = NonNullable<operations['replayDeadLetterTask']['responses']['200']['content']['application/json']['data']>

export function createRelayQueues(client: ConjoinClient) {
  return {
    createQueueDefinition: (data: CreateQueueDefinitionBody) =>
      client.fetch<CreateQueueDefinitionData>('relay/queues/create', { method: 'POST', body: data }),

    readQueueDefinitions: (query?: ReadQueueDefinitionsQuery) =>
      client.fetchList<ReadQueueDefinitionsData>('relay/queues/', { query: query as Record<string, unknown> }),

    updateQueueDefinition: (queueId: string, data: UpdateQueueDefinitionBody) =>
      client.fetch<UpdateQueueDefinitionData>(`relay/queues/${queueId}/update`, { method: 'PATCH', body: data }),

    deleteQueueDefinition: (queueId: string) =>
      client.fetch<DeleteQueueDefinitionData>(`relay/queues/${queueId}/delete`, { method: 'DELETE' }),

    enqueueTask: (queueId: string, data: EnqueueTaskBody) =>
      client.fetch<EnqueueTaskData>(`relay/queues/${queueId}/tasks/enqueue`, { method: 'POST', body: data }),

    readQueueTasks: (queueId: string, query?: ReadQueueTasksQuery) =>
      client.fetchList<ReadQueueTasksData>(`relay/queues/${queueId}/tasks`, { query: query as Record<string, unknown> }),

    readDeadLetterTasks: (queueId: string, query?: ReadDeadLetterTasksQuery) =>
      client.fetchList<ReadDeadLetterTasksData>(`relay/queues/${queueId}/dead-letter`, { query: query as Record<string, unknown> }),

    replayDeadLetterTask: (queueId: string, dlqEntryId: string) =>
      client.fetch<ReplayDeadLetterTaskData>(`relay/queues/${queueId}/dead-letter/${dlqEntryId}/replay`, { method: 'POST' }),
  }
}
