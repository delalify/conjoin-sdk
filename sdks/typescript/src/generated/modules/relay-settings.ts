import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type GetData = NonNullable<operations['getRelaySettings']['responses']['200']['content']['application/json']['data']>
type UpdateSchedulerDefaultsBody = operations['updateRelaySchedulerDefaults']['requestBody']['content']['application/json']
type UpdateSchedulerDefaultsData = NonNullable<operations['updateRelaySchedulerDefaults']['responses']['200']['content']['application/json']['data']>
type UpdateQueueDefaultsBody = operations['updateRelayQueueDefaults']['requestBody']['content']['application/json']
type UpdateQueueDefaultsData = NonNullable<operations['updateRelayQueueDefaults']['responses']['200']['content']['application/json']['data']>
type UpdateEventDefaultsBody = operations['updateRelayEventDefaults']['requestBody']['content']['application/json']
type UpdateEventDefaultsData = NonNullable<operations['updateRelayEventDefaults']['responses']['200']['content']['application/json']['data']>
type UpdatePipelineDefaultsBody = operations['updateRelayPipelineDefaults']['requestBody']['content']['application/json']
type UpdatePipelineDefaultsData = NonNullable<operations['updateRelayPipelineDefaults']['responses']['200']['content']['application/json']['data']>
type RotateSigningSecretData = NonNullable<operations['rotateRelaySigningSecret']['responses']['200']['content']['application/json']['data']>
type RevealSigningSecretData = NonNullable<operations['revealRelaySigningSecret']['responses']['200']['content']['application/json']['data']>

export function createRelaySettings(client: ConjoinClient) {
  return {
    get: () =>
      client.fetch<GetData>('relay/settings/'),

    updateSchedulerDefaults: (data: UpdateSchedulerDefaultsBody) =>
      client.fetch<UpdateSchedulerDefaultsData>('relay/settings/scheduler', { method: 'PATCH', body: data }),

    updateQueueDefaults: (data: UpdateQueueDefaultsBody) =>
      client.fetch<UpdateQueueDefaultsData>('relay/settings/queues', { method: 'PATCH', body: data }),

    updateEventDefaults: (data: UpdateEventDefaultsBody) =>
      client.fetch<UpdateEventDefaultsData>('relay/settings/events', { method: 'PATCH', body: data }),

    updatePipelineDefaults: (data: UpdatePipelineDefaultsBody) =>
      client.fetch<UpdatePipelineDefaultsData>('relay/settings/pipelines', { method: 'PATCH', body: data }),

    rotateSigningSecret: () =>
      client.fetch<RotateSigningSecretData>('relay/settings/signing-secret/rotate', { method: 'POST' }),

    revealSigningSecret: () =>
      client.fetch<RevealSigningSecretData>('relay/settings/signing-secret'),
  }
}
