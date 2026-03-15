import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type GenerateConnectionTokenData = NonNullable<operations['generateBroadcastConnectionToken']['responses']['200']['content']['application/json']['data']>
type CreateChannelBody = operations['createBroadcastChannel']['requestBody']['content']['application/json']
type CreateChannelData = NonNullable<operations['createBroadcastChannel']['responses']['201']['content']['application/json']['data']>
type ReadChannelsData = NonNullable<operations['readBroadcastChannels']['responses']['200']['content']['application/json']['data']>[number]
type ReadChannelsQuery = NonNullable<operations['readBroadcastChannels']['parameters']['query']>
type UpdateChannelBody = operations['updateBroadcastChannel']['requestBody']['content']['application/json']
type UpdateChannelData = NonNullable<operations['updateBroadcastChannel']['responses']['200']['content']['application/json']['data']>
type DeleteChannelData = NonNullable<operations['deleteBroadcastChannel']['responses']['200']['content']['application/json']['data']>
type GenerateAuthTokenBody = operations['generateBroadcastAuthToken']['requestBody']['content']['application/json']
type GenerateAuthTokenData = NonNullable<operations['generateBroadcastAuthToken']['responses']['200']['content']['application/json']['data']>
type PublishToBody = operations['publishToBroadcast']['requestBody']['content']['application/json']
type PublishToResponse = operations['publishToBroadcast']['responses']['200']['content']['application/json']
type ReadPresenceData = NonNullable<operations['readBroadcastPresence']['responses']['200']['content']['application/json']['data']>

export function createRelayBroadcasts(client: ConjoinClient) {
  return {
    generateConnectionToken: () =>
      client.fetch<GenerateConnectionTokenData>('relay/broadcast/auth', { method: 'POST' }),

    createChannel: (data: CreateChannelBody) =>
      client.fetch<CreateChannelData>('relay/broadcast/channels/create', { method: 'POST', body: data }),

    readChannels: (query?: ReadChannelsQuery) =>
      client.fetchList<ReadChannelsData>('relay/broadcast/channels', { query: query as Record<string, unknown> }),

    updateChannel: (channelId: string, data: UpdateChannelBody) =>
      client.fetch<UpdateChannelData>(`relay/broadcast/channels/${channelId}/update`, { method: 'PATCH', body: data }),

    deleteChannel: (channelId: string) =>
      client.fetch<DeleteChannelData>(`relay/broadcast/channels/${channelId}/delete`, { method: 'DELETE' }),

    generateAuthToken: (channelId: string, data: GenerateAuthTokenBody) =>
      client.fetch<GenerateAuthTokenData>(`relay/broadcast/channels/${channelId}/auth-token`, { method: 'POST', body: data }),

    publishTo: (channelId: string, data: PublishToBody) =>
      client.fetch<PublishToResponse>(`relay/broadcast/channels/${channelId}/publish`, { method: 'POST', body: data }),

    readPresence: (channelId: string) =>
      client.fetch<ReadPresenceData>(`relay/broadcast/channels/${channelId}/presence`),
  }
}
