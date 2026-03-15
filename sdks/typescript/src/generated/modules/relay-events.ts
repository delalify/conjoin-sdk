import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateEventChannelBody = operations['createEventChannel']['requestBody']['content']['application/json']
type CreateEventChannelData = NonNullable<operations['createEventChannel']['responses']['201']['content']['application/json']['data']>
type ReadEventChannelsData = NonNullable<operations['readEventChannels']['responses']['200']['content']['application/json']['data']>[number]
type ReadEventChannelsQuery = NonNullable<operations['readEventChannels']['parameters']['query']>
type UpdateEventChannelBody = operations['updateEventChannel']['requestBody']['content']['application/json']
type UpdateEventChannelData = NonNullable<operations['updateEventChannel']['responses']['200']['content']['application/json']['data']>
type DeleteEventChannelData = NonNullable<operations['deleteEventChannel']['responses']['200']['content']['application/json']['data']>
type CreateEventSubscriptionBody = operations['createEventSubscription']['requestBody']['content']['application/json']
type CreateEventSubscriptionData = NonNullable<operations['createEventSubscription']['responses']['201']['content']['application/json']['data']>
type ReadEventSubscriptionsData = NonNullable<operations['readEventSubscriptions']['responses']['200']['content']['application/json']['data']>[number]
type ReadEventSubscriptionsQuery = NonNullable<operations['readEventSubscriptions']['parameters']['query']>
type UpdateEventSubscriptionBody = operations['updateEventSubscription']['requestBody']['content']['application/json']
type UpdateEventSubscriptionData = NonNullable<operations['updateEventSubscription']['responses']['200']['content']['application/json']['data']>
type DeleteEventSubscriptionResponse = operations['deleteEventSubscription']['responses']['200']['content']['application/json']
type PublishEventBody = operations['publishEvent']['requestBody']['content']['application/json']
type PublishEventData = NonNullable<operations['publishEvent']['responses']['200']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readEvents']['responses']['200']['content']['application/json']['data']>[number]
type ReadQuery = NonNullable<operations['readEvents']['parameters']['query']>
type ReplayBody = operations['replayEvents']['requestBody']['content']['application/json']
type ReplayResponse = operations['replayEvents']['responses']['200']['content']['application/json']

export function createRelayEvents(client: ConjoinClient) {
  return {
    createEventChannel: (data: CreateEventChannelBody) =>
      client.fetch<CreateEventChannelData>('relay/events/channels/create', { method: 'POST', body: data }),

    readEventChannels: (query?: ReadEventChannelsQuery) =>
      client.fetchList<ReadEventChannelsData>('relay/events/channels', { query: query as Record<string, unknown> }),

    updateEventChannel: (channelId: string, data: UpdateEventChannelBody) =>
      client.fetch<UpdateEventChannelData>(`relay/events/channels/${channelId}/update`, { method: 'PATCH', body: data }),

    deleteEventChannel: (channelId: string) =>
      client.fetch<DeleteEventChannelData>(`relay/events/channels/${channelId}/delete`, { method: 'DELETE' }),

    createEventSubscription: (channelId: string, data: CreateEventSubscriptionBody) =>
      client.fetch<CreateEventSubscriptionData>(`relay/events/channels/${channelId}/subscriptions/create`, { method: 'POST', body: data }),

    readEventSubscriptions: (channelId: string, query?: ReadEventSubscriptionsQuery) =>
      client.fetchList<ReadEventSubscriptionsData>(`relay/events/channels/${channelId}/subscriptions`, { query: query as Record<string, unknown> }),

    updateEventSubscription: (channelId: string, subscriptionId: string, data: UpdateEventSubscriptionBody) =>
      client.fetch<UpdateEventSubscriptionData>(`relay/events/channels/${channelId}/subscriptions/${subscriptionId}/update`, { method: 'PATCH', body: data }),

    deleteEventSubscription: (channelId: string, subscriptionId: string) =>
      client.fetch<DeleteEventSubscriptionResponse>(`relay/events/channels/${channelId}/subscriptions/${subscriptionId}/delete`, { method: 'DELETE' }),

    publishEvent: (channelId: string, data: PublishEventBody) =>
      client.fetch<PublishEventData>(`relay/events/channels/${channelId}/publish`, { method: 'POST', body: data }),

    read: (channelId: string, query?: ReadQuery) =>
      client.fetchList<ReadData>(`relay/events/channels/${channelId}/events`, { query: query as Record<string, unknown> }),

    replay: (channelId: string, data: ReplayBody) =>
      client.fetch<ReplayResponse>(`relay/events/channels/${channelId}/replay`, { method: 'POST', body: data }),
  }
}
