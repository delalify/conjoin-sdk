import { expect } from 'vitest'
import { createRelayPipelines } from '../../../src/relay'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  describeRelaySdkContractCases,
  PIPELINE_ID,
  REQUEST_ID,
  RUN_ID,
  relayExpectedListQuery,
  relayListQuery,
  relayPipelineDefinitionFixture,
  relayPipelineRunFixture,
  STEP_ID,
} from './relay-test-utils'

const createPipelineBody = {
  endpoint_url: 'https://example.com/pipeline',
  name: 'Contract pipeline',
  reference_id: 'pipeline_reference_123',
}
const updatePipelineBody = {
  endpoint_url: 'https://example.com/pipeline-v2',
  name: 'Renamed pipeline',
  status: 'active' as const,
}
const triggerRunBody = {
  payload: {
    id: 'contract',
  },
  reference_id: 'run_reference_123',
}
const approveGateBody = {
  approver_data: {
    approved_by: 'user_123',
  },
}
const rejectGateBody = {
  reason: 'Contract rejection',
}

describeRelaySdkContractCases('Relay pipelines SDK contract integration', [
  {
    name: 'creates a pipeline definition',
    method: 'POST',
    path: '/v1/relay/pipelines/create',
    expectedBody: createPipelineBody,
    response: conjoinSuccess(relayPipelineDefinitionFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelayPipelines(context.client).createPipelineDefinition(createPipelineBody),
    assertResult: result => expect(result).toEqual(relayPipelineDefinitionFixture()),
  },
  {
    name: 'reads pipeline definitions',
    method: 'GET',
    path: '/v1/relay/pipelines/',
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relayPipelineDefinitionFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelayPipelines(context.client).readPipelineDefinitions(relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relayPipelineDefinitionFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'updates a pipeline definition',
    method: 'PATCH',
    path: '/v1/relay/pipelines/{pipeline_id}/update',
    expectedBody: updatePipelineBody,
    expectedPath: `/v1/relay/pipelines/${PIPELINE_ID}/update`,
    expectedPathParams: {
      pipeline_id: PIPELINE_ID,
    },
    response: conjoinSuccess(
      relayPipelineDefinitionFixture({
        endpoint_url: 'https://example.com/pipeline-v2',
        name: 'Renamed pipeline',
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => createRelayPipelines(context.client).updatePipelineDefinition(PIPELINE_ID, updatePipelineBody),
    assertResult: result =>
      expect(result).toEqual(
        relayPipelineDefinitionFixture({
          endpoint_url: 'https://example.com/pipeline-v2',
          name: 'Renamed pipeline',
        }),
      ),
  },
  {
    name: 'deletes a pipeline definition',
    method: 'DELETE',
    path: '/v1/relay/pipelines/{pipeline_id}/delete',
    expectedPath: `/v1/relay/pipelines/${PIPELINE_ID}/delete`,
    expectedPathParams: {
      pipeline_id: PIPELINE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayPipelineDefinitionFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => createRelayPipelines(context.client).deletePipelineDefinition(PIPELINE_ID),
    assertResult: result => expect(result).toEqual(relayPipelineDefinitionFixture({ status: 'deleted' })),
  },
  {
    name: 'triggers a pipeline run',
    method: 'POST',
    path: '/v1/relay/pipelines/{pipeline_id}/trigger',
    expectedBody: triggerRunBody,
    expectedPath: `/v1/relay/pipelines/${PIPELINE_ID}/trigger`,
    expectedPathParams: {
      pipeline_id: PIPELINE_ID,
    },
    response: conjoinSuccess(relayPipelineRunFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelayPipelines(context.client).triggerPipelineRun(PIPELINE_ID, triggerRunBody),
    assertResult: result => expect(result).toEqual(relayPipelineRunFixture()),
  },
  {
    name: 'reads pipeline runs',
    method: 'GET',
    path: '/v1/relay/pipelines/{pipeline_id}/runs',
    expectedPath: `/v1/relay/pipelines/${PIPELINE_ID}/runs`,
    expectedPathParams: {
      pipeline_id: PIPELINE_ID,
    },
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relayPipelineRunFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelayPipelines(context.client).readPipelineRuns(PIPELINE_ID, relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relayPipelineRunFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads a pipeline run',
    method: 'GET',
    path: '/v1/relay/pipelines/{pipeline_id}/runs/{run_id}',
    expectedPath: `/v1/relay/pipelines/${PIPELINE_ID}/runs/${RUN_ID}`,
    expectedPathParams: {
      pipeline_id: PIPELINE_ID,
      run_id: RUN_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayPipelineRunFixture(), { requestId: REQUEST_ID }),
    run: context => createRelayPipelines(context.client).readPipelineRun(PIPELINE_ID, RUN_ID),
    assertResult: result => expect(result).toEqual(relayPipelineRunFixture()),
  },
  {
    name: 'cancels a pipeline run',
    method: 'POST',
    path: '/v1/relay/pipelines/{pipeline_id}/runs/{run_id}/cancel',
    expectedPath: `/v1/relay/pipelines/${PIPELINE_ID}/runs/${RUN_ID}/cancel`,
    expectedPathParams: {
      pipeline_id: PIPELINE_ID,
      run_id: RUN_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayPipelineRunFixture({ status: 'cancelled' }), { requestId: REQUEST_ID }),
    run: context => createRelayPipelines(context.client).cancelPipelineRun(PIPELINE_ID, RUN_ID),
    assertResult: result => expect(result).toEqual(relayPipelineRunFixture({ status: 'cancelled' })),
  },
  {
    name: 'approves a pipeline gate',
    method: 'POST',
    path: '/v1/relay/pipelines/{pipeline_id}/runs/{run_id}/gates/{step_id}/approve',
    expectedBody: approveGateBody,
    expectedPath: `/v1/relay/pipelines/${PIPELINE_ID}/runs/${RUN_ID}/gates/${STEP_ID}/approve`,
    expectedPathParams: {
      pipeline_id: PIPELINE_ID,
      run_id: RUN_ID,
      step_id: STEP_ID,
    },
    response: conjoinSuccess(relayPipelineRunFixture({ status: 'running' }), { requestId: REQUEST_ID }),
    run: context =>
      createRelayPipelines(context.client).approvePipelineGate(PIPELINE_ID, RUN_ID, STEP_ID, approveGateBody),
    assertResult: result => expect(result).toEqual(relayPipelineRunFixture({ status: 'running' })),
  },
  {
    name: 'rejects a pipeline gate',
    method: 'POST',
    path: '/v1/relay/pipelines/{pipeline_id}/runs/{run_id}/gates/{step_id}/reject',
    expectedBody: rejectGateBody,
    expectedPath: `/v1/relay/pipelines/${PIPELINE_ID}/runs/${RUN_ID}/gates/${STEP_ID}/reject`,
    expectedPathParams: {
      pipeline_id: PIPELINE_ID,
      run_id: RUN_ID,
      step_id: STEP_ID,
    },
    response: conjoinSuccess(relayPipelineRunFixture({ status: 'failed' }), { requestId: REQUEST_ID }),
    run: context =>
      createRelayPipelines(context.client).rejectPipelineGate(PIPELINE_ID, RUN_ID, STEP_ID, rejectGateBody),
    assertResult: result => expect(result).toEqual(relayPipelineRunFixture({ status: 'failed' })),
  },
])
