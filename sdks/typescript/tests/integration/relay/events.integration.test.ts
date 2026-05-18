import { expect } from 'vitest'
import { createRelayEvents } from '../../../src/relay'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  CHANNEL_ID,
  describeRelaySdkContractCases,
  REQUEST_ID,
  relayEventChannelFixture,
  relayEventFixture,
  relayEventSubscriptionFixture,
  relayExpectedListQuery,
  relayListQuery,
  SUBSCRIPTION_ID,
} from './relay-test-utils'

const createChannelBody = {
  name: 'Contract events',
  reference_id: 'event_channel_reference_123',
  retention_hours: 24,
}
const updateChannelBody = {
  name: 'Renamed events',
  status: 'active' as const,
}
const createSubscriptionBody = {
  endpoint_url: 'https://example.com/events',
  reference_id: 'event_subscription_reference_123',
}
const updateSubscriptionBody = {
  endpoint_url: 'https://example.com/events-v2',
  status: 'active' as const,
}
const publishEventBody = {
  event_type: 'contract.created',
  payload: {
    id: 'contract',
  },
}
const replayBody = {
  from_timestamp: '2026-05-16T00:00:00.000Z',
  subscription_id: SUBSCRIPTION_ID,
}

describeRelaySdkContractCases('Relay events SDK contract integration', [
  {
    name: 'creates an event channel',
    method: 'POST',
    path: '/v1/relay/events/channels/create',
    expectedBody: createChannelBody,
    response: conjoinSuccess(relayEventChannelFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelayEvents(context.client).createEventChannel(createChannelBody),
    assertResult: result => expect(result).toEqual(relayEventChannelFixture()),
  },
  {
    name: 'reads event channels',
    method: 'GET',
    path: '/v1/relay/events/channels',
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relayEventChannelFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelayEvents(context.client).readEventChannels(relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relayEventChannelFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'updates an event channel',
    method: 'PATCH',
    path: '/v1/relay/events/channels/{channel_id}/update',
    expectedBody: updateChannelBody,
    expectedPath: `/v1/relay/events/channels/${CHANNEL_ID}/update`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    response: conjoinSuccess(relayEventChannelFixture({ name: 'Renamed events' }), { requestId: REQUEST_ID }),
    run: context => createRelayEvents(context.client).updateEventChannel(CHANNEL_ID, updateChannelBody),
    assertResult: result => expect(result).toEqual(relayEventChannelFixture({ name: 'Renamed events' })),
  },
  {
    name: 'deletes an event channel',
    method: 'DELETE',
    path: '/v1/relay/events/channels/{channel_id}/delete',
    expectedPath: `/v1/relay/events/channels/${CHANNEL_ID}/delete`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayEventChannelFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => createRelayEvents(context.client).deleteEventChannel(CHANNEL_ID),
    assertResult: result => expect(result).toEqual(relayEventChannelFixture({ status: 'deleted' })),
  },
  {
    name: 'creates an event subscription',
    method: 'POST',
    path: '/v1/relay/events/channels/{channel_id}/subscriptions/create',
    expectedBody: createSubscriptionBody,
    expectedPath: `/v1/relay/events/channels/${CHANNEL_ID}/subscriptions/create`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    response: conjoinSuccess(relayEventSubscriptionFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelayEvents(context.client).createEventSubscription(CHANNEL_ID, createSubscriptionBody),
    assertResult: result => expect(result).toEqual(relayEventSubscriptionFixture()),
  },
  {
    name: 'reads event subscriptions',
    method: 'GET',
    path: '/v1/relay/events/channels/{channel_id}/subscriptions',
    expectedPath: `/v1/relay/events/channels/${CHANNEL_ID}/subscriptions`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relayEventSubscriptionFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelayEvents(context.client).readEventSubscriptions(CHANNEL_ID, relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relayEventSubscriptionFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'updates an event subscription',
    method: 'PATCH',
    path: '/v1/relay/events/channels/{channel_id}/subscriptions/{subscription_id}/update',
    expectedBody: updateSubscriptionBody,
    expectedPath: `/v1/relay/events/channels/${CHANNEL_ID}/subscriptions/${SUBSCRIPTION_ID}/update`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(relayEventSubscriptionFixture({ endpoint_url: 'https://example.com/events-v2' }), {
      requestId: REQUEST_ID,
    }),
    run: context =>
      createRelayEvents(context.client).updateEventSubscription(CHANNEL_ID, SUBSCRIPTION_ID, updateSubscriptionBody),
    assertResult: result =>
      expect(result).toEqual(relayEventSubscriptionFixture({ endpoint_url: 'https://example.com/events-v2' })),
  },
  {
    name: 'deletes an event subscription',
    method: 'DELETE',
    path: '/v1/relay/events/channels/{channel_id}/subscriptions/{subscription_id}/delete',
    expectedPath: `/v1/relay/events/channels/${CHANNEL_ID}/subscriptions/${SUBSCRIPTION_ID}/delete`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(undefined, { requestId: REQUEST_ID }),
    run: context => createRelayEvents(context.client).deleteEventSubscription(CHANNEL_ID, SUBSCRIPTION_ID),
    assertResult: result => expect(result).toBeUndefined(),
  },
  {
    name: 'publishes an event',
    method: 'POST',
    path: '/v1/relay/events/channels/{channel_id}/publish',
    expectedBody: publishEventBody,
    expectedPath: `/v1/relay/events/channels/${CHANNEL_ID}/publish`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    response: conjoinSuccess(relayEventFixture(), {
      requestId: REQUEST_ID,
    }),
    run: context => createRelayEvents(context.client).publishEvent(CHANNEL_ID, publishEventBody),
    assertResult: result => expect(result).toEqual(relayEventFixture()),
  },
  {
    name: 'reads events',
    method: 'GET',
    path: '/v1/relay/events/channels/{channel_id}/events',
    expectedPath: `/v1/relay/events/channels/${CHANNEL_ID}/events`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relayEventFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelayEvents(context.client).read(CHANNEL_ID, relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relayEventFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'replays events',
    method: 'POST',
    path: '/v1/relay/events/channels/{channel_id}/replay',
    expectedBody: replayBody,
    expectedPath: `/v1/relay/events/channels/${CHANNEL_ID}/replay`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    response: conjoinSuccess(undefined, { requestId: REQUEST_ID }),
    run: context => createRelayEvents(context.client).replay(CHANNEL_ID, replayBody),
    assertResult: result => expect(result).toBeUndefined(),
  },
])
