import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateDefinitionBody = operations['createSchedulerDefinition']['requestBody']['content']['application/json']
type CreateDefinitionData = NonNullable<
  operations['createSchedulerDefinition']['responses']['201']['content']['application/json']['data']
>
type ReadDefinitionsData = NonNullable<
  operations['readSchedulerDefinitions']['responses']['200']['content']['application/json']['data']
>[number]
type ReadDefinitionsQuery = NonNullable<operations['readSchedulerDefinitions']['parameters']['query']>
type UpdateDefinitionBody = operations['updateSchedulerDefinition']['requestBody']['content']['application/json']
type UpdateDefinitionData = NonNullable<
  operations['updateSchedulerDefinition']['responses']['200']['content']['application/json']['data']
>
type PauseData = NonNullable<operations['pauseScheduler']['responses']['200']['content']['application/json']['data']>
type ResumeData = NonNullable<operations['resumeScheduler']['responses']['200']['content']['application/json']['data']>
type CancelData = NonNullable<operations['cancelScheduler']['responses']['200']['content']['application/json']['data']>
type TriggerExecutionData = NonNullable<
  operations['triggerSchedulerExecution']['responses']['200']['content']['application/json']['data']
>
type ReadExecutionsData = NonNullable<
  operations['readSchedulerExecutions']['responses']['200']['content']['application/json']['data']
>[number]
type ReadExecutionsQuery = NonNullable<operations['readSchedulerExecutions']['parameters']['query']>

export function createRelaySchedulers(client: ConjoinClient) {
  return {
    createDefinition: (data: CreateDefinitionBody) =>
      client.fetch<CreateDefinitionData>('relay/scheduler/create', { method: 'POST', body: data }),

    readDefinitions: (query?: ReadDefinitionsQuery) =>
      client.fetchList<ReadDefinitionsData>('relay/scheduler/', { query: query as Record<string, unknown> }),

    updateDefinition: (scheduleId: string, data: UpdateDefinitionBody) =>
      client.fetch<UpdateDefinitionData>(`relay/scheduler/${scheduleId}/update`, { method: 'PATCH', body: data }),

    pause: (scheduleId: string) => client.fetch<PauseData>(`relay/scheduler/${scheduleId}/pause`, { method: 'POST' }),

    resume: (scheduleId: string) =>
      client.fetch<ResumeData>(`relay/scheduler/${scheduleId}/resume`, { method: 'POST' }),

    cancel: (scheduleId: string) =>
      client.fetch<CancelData>(`relay/scheduler/${scheduleId}/cancel`, { method: 'POST' }),

    triggerExecution: (scheduleId: string) =>
      client.fetch<TriggerExecutionData>(`relay/scheduler/${scheduleId}/trigger`, { method: 'POST' }),

    readExecutions: (scheduleId: string, query?: ReadExecutionsQuery) =>
      client.fetchList<ReadExecutionsData>(`relay/scheduler/${scheduleId}/executions`, {
        query: query as Record<string, unknown>,
      }),
  }
}
