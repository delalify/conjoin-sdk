import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreatePipelineDefinitionBody = operations['createPipelineDefinition']['requestBody']['content']['application/json']
type CreatePipelineDefinitionData = NonNullable<
  operations['createPipelineDefinition']['responses']['201']['content']['application/json']['data']
>
type ReadPipelineDefinitionsData = NonNullable<
  operations['readPipelineDefinitions']['responses']['200']['content']['application/json']['data']
>[number]
type ReadPipelineDefinitionsQuery = NonNullable<operations['readPipelineDefinitions']['parameters']['query']>
type UpdatePipelineDefinitionBody = operations['updatePipelineDefinition']['requestBody']['content']['application/json']
type UpdatePipelineDefinitionData = NonNullable<
  operations['updatePipelineDefinition']['responses']['200']['content']['application/json']['data']
>
type DeletePipelineDefinitionData = NonNullable<
  operations['deletePipelineDefinition']['responses']['200']['content']['application/json']['data']
>
type TriggerPipelineRunBody = operations['triggerPipelineRun']['requestBody']['content']['application/json']
type TriggerPipelineRunData = NonNullable<
  operations['triggerPipelineRun']['responses']['201']['content']['application/json']['data']
>
type ReadPipelineRunsData = NonNullable<
  operations['readPipelineRuns']['responses']['200']['content']['application/json']['data']
>[number]
type ReadPipelineRunsQuery = NonNullable<operations['readPipelineRuns']['parameters']['query']>
type ReadPipelineRunData = NonNullable<
  operations['readPipelineRun']['responses']['200']['content']['application/json']['data']
>
type CancelPipelineRunData = NonNullable<
  operations['cancelPipelineRun']['responses']['200']['content']['application/json']['data']
>
type ApprovePipelineGateBody = operations['approvePipelineGate']['requestBody']['content']['application/json']
type ApprovePipelineGateData = NonNullable<
  operations['approvePipelineGate']['responses']['200']['content']['application/json']['data']
>
type RejectPipelineGateBody = operations['rejectPipelineGate']['requestBody']['content']['application/json']
type RejectPipelineGateData = NonNullable<
  operations['rejectPipelineGate']['responses']['200']['content']['application/json']['data']
>

export function createRelayPipelines(client: ConjoinClient) {
  return {
    createPipelineDefinition: (data: CreatePipelineDefinitionBody) =>
      client.fetch<CreatePipelineDefinitionData>('relay/pipelines/create', { method: 'POST', body: data }),

    readPipelineDefinitions: (query?: ReadPipelineDefinitionsQuery) =>
      client.fetchList<ReadPipelineDefinitionsData>('relay/pipelines/', { query: query as Record<string, unknown> }),

    updatePipelineDefinition: (pipelineId: string, data: UpdatePipelineDefinitionBody) =>
      client.fetch<UpdatePipelineDefinitionData>(`relay/pipelines/${pipelineId}/update`, {
        method: 'PATCH',
        body: data,
      }),

    deletePipelineDefinition: (pipelineId: string) =>
      client.fetch<DeletePipelineDefinitionData>(`relay/pipelines/${pipelineId}/delete`, { method: 'DELETE' }),

    triggerPipelineRun: (pipelineId: string, data: TriggerPipelineRunBody) =>
      client.fetch<TriggerPipelineRunData>(`relay/pipelines/${pipelineId}/trigger`, { method: 'POST', body: data }),

    readPipelineRuns: (pipelineId: string, query?: ReadPipelineRunsQuery) =>
      client.fetchList<ReadPipelineRunsData>(`relay/pipelines/${pipelineId}/runs`, {
        query: query as Record<string, unknown>,
      }),

    readPipelineRun: (pipelineId: string, runId: string) =>
      client.fetch<ReadPipelineRunData>(`relay/pipelines/${pipelineId}/runs/${runId}`),

    cancelPipelineRun: (pipelineId: string, runId: string) =>
      client.fetch<CancelPipelineRunData>(`relay/pipelines/${pipelineId}/runs/${runId}/cancel`, { method: 'POST' }),

    approvePipelineGate: (pipelineId: string, runId: string, stepId: string, data: ApprovePipelineGateBody) =>
      client.fetch<ApprovePipelineGateData>(`relay/pipelines/${pipelineId}/runs/${runId}/gates/${stepId}/approve`, {
        method: 'POST',
        body: data,
      }),

    rejectPipelineGate: (pipelineId: string, runId: string, stepId: string, data: RejectPipelineGateBody) =>
      client.fetch<RejectPipelineGateData>(`relay/pipelines/${pipelineId}/runs/${runId}/gates/${stepId}/reject`, {
        method: 'POST',
        body: data,
      }),
  }
}
