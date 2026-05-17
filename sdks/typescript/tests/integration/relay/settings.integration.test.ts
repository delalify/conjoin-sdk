import { expect } from 'vitest'
import { createRelaySettings } from '../../../src/relay'
import { conjoinSuccess } from '../contract-server/response-fixtures'
import { describeRelaySdkContractCases, REQUEST_ID, relaySettingsFixture } from './relay-test-utils'

const schedulerDefaultsBody = {
  dlq_retention_days: 7,
  max_retries: 3,
  retry_backoff_base_seconds: 30,
  retry_backoff_strategy: 'exponential' as const,
  timeout_seconds: 30,
}
const queueDefaultsBody = {
  max_retries: 3,
  retry_backoff_base_seconds: 30,
  retry_backoff_strategy: 'exponential' as const,
}
const eventDefaultsBody = {
  max_retries: 3,
  retry_backoff_base_seconds: 30,
  retry_backoff_strategy: 'exponential' as const,
}
const pipelineDefaultsBody = {
  headers: {
    'x-contract': 'true',
  },
}

describeRelaySdkContractCases('Relay settings SDK contract integration', [
  {
    name: 'gets relay settings',
    method: 'GET',
    path: '/v1/relay/settings/',
    expectedRawBody: '',
    response: conjoinSuccess(relaySettingsFixture(), { requestId: REQUEST_ID }),
    run: context => createRelaySettings(context.client).get(),
    assertResult: result => expect(result).toEqual(relaySettingsFixture()),
  },
  {
    name: 'updates relay scheduler defaults',
    method: 'PATCH',
    path: '/v1/relay/settings/scheduler',
    expectedBody: schedulerDefaultsBody,
    response: conjoinSuccess(
      relaySettingsFixture({
        scheduler: schedulerDefaultsBody,
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => createRelaySettings(context.client).updateSchedulerDefaults(schedulerDefaultsBody),
    assertResult: result =>
      expect(result).toEqual(
        relaySettingsFixture({
          scheduler: schedulerDefaultsBody,
        }),
      ),
  },
  {
    name: 'updates relay queue defaults',
    method: 'PATCH',
    path: '/v1/relay/settings/queues',
    expectedBody: queueDefaultsBody,
    response: conjoinSuccess(
      relaySettingsFixture({
        queues: queueDefaultsBody,
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => createRelaySettings(context.client).updateQueueDefaults(queueDefaultsBody),
    assertResult: result =>
      expect(result).toEqual(
        relaySettingsFixture({
          queues: queueDefaultsBody,
        }),
      ),
  },
  {
    name: 'updates relay event defaults',
    method: 'PATCH',
    path: '/v1/relay/settings/events',
    expectedBody: eventDefaultsBody,
    response: conjoinSuccess(
      relaySettingsFixture({
        events: eventDefaultsBody,
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => createRelaySettings(context.client).updateEventDefaults(eventDefaultsBody),
    assertResult: result =>
      expect(result).toEqual(
        relaySettingsFixture({
          events: eventDefaultsBody,
        }),
      ),
  },
  {
    name: 'updates relay pipeline defaults',
    method: 'PATCH',
    path: '/v1/relay/settings/pipelines',
    expectedBody: pipelineDefaultsBody,
    response: conjoinSuccess(
      relaySettingsFixture({
        pipelines: pipelineDefaultsBody,
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => createRelaySettings(context.client).updatePipelineDefaults(pipelineDefaultsBody),
    assertResult: result =>
      expect(result).toEqual(
        relaySettingsFixture({
          pipelines: pipelineDefaultsBody,
        }),
      ),
  },
  {
    name: 'rotates relay signing secret',
    method: 'POST',
    path: '/v1/relay/settings/signing-secret/rotate',
    expectedRawBody: '',
    response: conjoinSuccess(
      relaySettingsFixture({
        signing_secret_rotated_at: '2026-05-16T02:00:00.000Z',
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => createRelaySettings(context.client).rotateSigningSecret(),
    assertResult: result =>
      expect(result).toEqual(
        relaySettingsFixture({
          signing_secret_rotated_at: '2026-05-16T02:00:00.000Z',
        }),
      ),
  },
  {
    name: 'reveals relay signing secret',
    method: 'GET',
    path: '/v1/relay/settings/signing-secret',
    expectedRawBody: '',
    response: conjoinSuccess(
      {
        signing_secret: 'cnj_whsec_contract',
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createRelaySettings(context.client).revealSigningSecret(),
    assertResult: result =>
      expect(result).toEqual({
        signing_secret: 'cnj_whsec_contract',
      }),
  },
])
