import { expect } from 'vitest'
import { createRelayBroadcasts } from '../../../src/relay'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  CHANNEL_ID,
  describeRelaySdkContractCases,
  REQUEST_ID,
  relayBroadcastChannelFixture,
  relayExpectedListQuery,
  relayListQuery,
} from './relay-test-utils'

const createChannelBody = {
  authorization_mode: 'token' as const,
  channel_type: 'presence' as const,
  name: 'Contract channel',
  reference_id: 'broadcast_reference_123',
}
const updateChannelBody = {
  authorization_mode: 'token' as const,
  name: 'Renamed channel',
}
const authTokenBody = {
  permissions: ['publish' as const],
  user_id: 'user_123',
}
const publishBody = {
  data: {
    message: 'hello',
  },
  event: 'contract.created',
}

describeRelaySdkContractCases('Relay broadcast SDK contract integration', [
  {
    name: 'generates a broadcast connection token',
    method: 'POST',
    path: '/v1/relay/broadcast/auth',
    expectedRawBody: '',
    response: conjoinSuccess(
      {
        endpoint: 'wss://relay.example.com',
        token: 'connection_token_123',
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createRelayBroadcasts(context.client).generateConnectionToken(),
    assertResult: result =>
      expect(result).toEqual({
        endpoint: 'wss://relay.example.com',
        token: 'connection_token_123',
      }),
  },
  {
    name: 'creates a broadcast channel',
    method: 'POST',
    path: '/v1/relay/broadcast/channels/create',
    expectedBody: createChannelBody,
    response: conjoinSuccess(relayBroadcastChannelFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelayBroadcasts(context.client).createChannel(createChannelBody),
    assertResult: result => expect(result).toEqual(relayBroadcastChannelFixture()),
  },
  {
    name: 'reads broadcast channels',
    method: 'GET',
    path: '/v1/relay/broadcast/channels',
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relayBroadcastChannelFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelayBroadcasts(context.client).readChannels(relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relayBroadcastChannelFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'updates a broadcast channel',
    method: 'PATCH',
    path: '/v1/relay/broadcast/channels/{channel_id}/update',
    expectedBody: updateChannelBody,
    expectedPath: `/v1/relay/broadcast/channels/${CHANNEL_ID}/update`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    response: conjoinSuccess(relayBroadcastChannelFixture({ name: 'Renamed channel' }), { requestId: REQUEST_ID }),
    run: context => createRelayBroadcasts(context.client).updateChannel(CHANNEL_ID, updateChannelBody),
    assertResult: result => expect(result).toEqual(relayBroadcastChannelFixture({ name: 'Renamed channel' })),
  },
  {
    name: 'deletes a broadcast channel',
    method: 'DELETE',
    path: '/v1/relay/broadcast/channels/{channel_id}/delete',
    expectedPath: `/v1/relay/broadcast/channels/${CHANNEL_ID}/delete`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayBroadcastChannelFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => createRelayBroadcasts(context.client).deleteChannel(CHANNEL_ID),
    assertResult: result => expect(result).toEqual(relayBroadcastChannelFixture({ status: 'deleted' })),
  },
  {
    name: 'generates a broadcast channel auth token',
    method: 'POST',
    path: '/v1/relay/broadcast/channels/{channel_id}/auth-token',
    expectedBody: authTokenBody,
    expectedPath: `/v1/relay/broadcast/channels/${CHANNEL_ID}/auth-token`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    response: conjoinSuccess(
      {
        expires_at: '2026-05-17T00:00:00.000Z',
        token: 'broadcast_token_123',
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createRelayBroadcasts(context.client).generateAuthToken(CHANNEL_ID, authTokenBody),
    assertResult: result =>
      expect(result).toEqual({
        expires_at: '2026-05-17T00:00:00.000Z',
        token: 'broadcast_token_123',
      }),
  },
  {
    name: 'publishes to a broadcast channel',
    method: 'POST',
    path: '/v1/relay/broadcast/channels/{channel_id}/publish',
    expectedBody: publishBody,
    expectedPath: `/v1/relay/broadcast/channels/${CHANNEL_ID}/publish`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    response: conjoinSuccess(undefined, { requestId: REQUEST_ID }),
    run: context => createRelayBroadcasts(context.client).publishTo(CHANNEL_ID, publishBody),
    assertResult: result => expect(result).toBeUndefined(),
  },
  {
    name: 'reads broadcast presence',
    method: 'GET',
    path: '/v1/relay/broadcast/channels/{channel_id}/presence',
    expectedPath: `/v1/relay/broadcast/channels/${CHANNEL_ID}/presence`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(
      {
        members: [
          {
            user_id: 'user_123',
          },
        ],
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createRelayBroadcasts(context.client).readPresence(CHANNEL_ID),
    assertResult: result =>
      expect(result).toEqual({
        members: [
          {
            user_id: 'user_123',
          },
        ],
      }),
  },
])
