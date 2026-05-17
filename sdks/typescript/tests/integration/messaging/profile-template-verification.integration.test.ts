import { expect } from 'vitest'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  describeMessagingProfileSdkContractCases,
  messagingListBody,
  messagingProfileFixture,
  PROFILE_ID,
  REQUEST_ID,
} from './messaging-test-utils'

const trackingConfig = {
  clicks: {
    track: true,
    tracking_domain: 'links.example.com',
  },
  opens: {
    track: true,
    tracking_domain: 'open.example.com',
  },
  unsubscribes: {
    redirect_url: 'https://example.com/preferences',
    track: true,
    tracking_domain: 'unsubscribe.example.com',
    tracking_url: 'https://example.com/unsubscribe',
  },
} as const
const profileCreateBody = {
  email_config: {
    tracking: trackingConfig,
  },
  features: {
    email: true,
    sms: true,
  },
  name: 'Contract profile',
  resource_region: 'US',
  sms_config: {
    tracking: trackingConfig,
  },
} as const
const profileUpdateBody = {
  message_retention_days: 60,
  name: 'Renamed profile',
} as const
const profileEmailConfigBody = {
  email_config: {
    tracking: trackingConfig,
  },
} as const
const profileMultisendConfigBody = {
  multisend_config: {
    preferred_channels: ['sms' as const, 'email' as const],
  },
}
const profileVerificationsConfigBody = {
  verifications_config: {
    preferred_sender: 'CONJOIN',
  },
} as const
describeMessagingProfileSdkContractCases('Messaging profile SDK contract integration', [
  {
    name: 'creates a messaging profile',
    method: 'POST',
    path: '/v1/messaging/profiles/new',
    expectedBody: profileCreateBody,
    response: conjoinSuccess(messagingProfileFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => context.messaging.profiles.create(profileCreateBody),
    assertResult: result => expect(result).toEqual(messagingProfileFixture()),
  },
  {
    name: 'enables a messaging profile',
    method: 'PATCH',
    path: '/v1/messaging/profiles/{profile_id}/enable',
    expectedPath: `/v1/messaging/profiles/${PROFILE_ID}/enable`,
    expectedPathParams: {
      profile_id: PROFILE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingProfileFixture({ status: 'active' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.profiles.enable(PROFILE_ID),
    assertResult: result => expect(result).toEqual(messagingProfileFixture({ status: 'active' })),
  },
  {
    name: 'disables a messaging profile',
    method: 'PATCH',
    path: '/v1/messaging/profiles/{profile_id}/disable',
    expectedPath: `/v1/messaging/profiles/${PROFILE_ID}/disable`,
    expectedPathParams: {
      profile_id: PROFILE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingProfileFixture({ status: 'disabled' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.profiles.disable(PROFILE_ID),
    assertResult: result => expect(result).toEqual(messagingProfileFixture({ status: 'disabled' })),
  },
  {
    name: 'closes a messaging profile',
    method: 'PATCH',
    path: '/v1/messaging/profiles/{profile_id}/close',
    expectedPath: `/v1/messaging/profiles/${PROFILE_ID}/close`,
    expectedPathParams: {
      profile_id: PROFILE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingProfileFixture({ status: 'closed' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.profiles.close(PROFILE_ID),
    assertResult: result => expect(result).toEqual(messagingProfileFixture({ status: 'closed' })),
  },
  {
    name: 'updates a messaging profile',
    method: 'PATCH',
    path: '/v1/messaging/profiles/{profile_id}',
    expectedBody: profileUpdateBody,
    expectedPath: `/v1/messaging/profiles/${PROFILE_ID}`,
    expectedPathParams: {
      profile_id: PROFILE_ID,
    },
    response: conjoinSuccess(
      messagingProfileFixture({
        message_retention_days: 60,
        name: 'Renamed profile',
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => context.messaging.profiles.update(PROFILE_ID, profileUpdateBody),
    assertResult: result =>
      expect(result).toEqual(
        messagingProfileFixture({
          message_retention_days: 60,
          name: 'Renamed profile',
        }),
      ),
  },
  {
    name: 'reads a messaging profile',
    method: 'GET',
    path: '/v1/messaging/profiles/{profile_id}',
    expectedPath: `/v1/messaging/profiles/${PROFILE_ID}`,
    expectedPathParams: {
      profile_id: PROFILE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingProfileFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.profiles.read(PROFILE_ID),
    assertResult: result => expect(result).toEqual(messagingProfileFixture()),
  },
  {
    name: 'deletes a messaging profile',
    method: 'DELETE',
    path: '/v1/messaging/profiles/{profile_id}',
    expectedPath: `/v1/messaging/profiles/${PROFILE_ID}`,
    expectedPathParams: {
      profile_id: PROFILE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingProfileFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.profiles.delete(PROFILE_ID),
    assertResult: result => expect(result).toEqual(messagingProfileFixture({ status: 'deleted' })),
  },
  {
    name: 'updates messaging profile email config',
    method: 'PATCH',
    path: '/v1/messaging/profiles/{profile_id}/emails-config',
    expectedBody: profileEmailConfigBody,
    expectedPath: `/v1/messaging/profiles/${PROFILE_ID}/emails-config`,
    expectedPathParams: {
      profile_id: PROFILE_ID,
    },
    response: conjoinSuccess(messagingProfileFixture({ email_config: profileEmailConfigBody.email_config }), {
      requestId: REQUEST_ID,
    }),
    run: context => context.messaging.profiles.updateEmailConfig(PROFILE_ID, profileEmailConfigBody),
    assertResult: result =>
      expect(result).toEqual(messagingProfileFixture({ email_config: profileEmailConfigBody.email_config })),
  },
  {
    name: 'updates messaging profile multisend config',
    method: 'PATCH',
    path: '/v1/messaging/profiles/{profile_id}/multisend-config',
    expectedBody: profileMultisendConfigBody,
    expectedPath: `/v1/messaging/profiles/${PROFILE_ID}/multisend-config`,
    expectedPathParams: {
      profile_id: PROFILE_ID,
    },
    response: conjoinSuccess(
      messagingProfileFixture({ multisend_config: profileMultisendConfigBody.multisend_config }),
      {
        requestId: REQUEST_ID,
      },
    ),
    run: context => context.messaging.profiles.updateMultisendConfig(PROFILE_ID, profileMultisendConfigBody),
    assertResult: result =>
      expect(result).toEqual(
        messagingProfileFixture({ multisend_config: profileMultisendConfigBody.multisend_config }),
      ),
  },
  {
    name: 'updates messaging profile verifications config',
    method: 'PATCH',
    path: '/v1/messaging/profiles/{profile_id}/verifications-config',
    expectedBody: profileVerificationsConfigBody,
    expectedPath: `/v1/messaging/profiles/${PROFILE_ID}/verifications-config`,
    expectedPathParams: {
      profile_id: PROFILE_ID,
    },
    response: conjoinSuccess(
      messagingProfileFixture({ verifications_config: profileVerificationsConfigBody.verifications_config }),
      { requestId: REQUEST_ID },
    ),
    run: context => context.messaging.profiles.updateVerificationsConfig(PROFILE_ID, profileVerificationsConfigBody),
    assertResult: result =>
      expect(result).toEqual(
        messagingProfileFixture({ verifications_config: profileVerificationsConfigBody.verifications_config }),
      ),
  },
  {
    name: 'lists messaging profiles',
    method: 'POST',
    path: '/v1/messaging/profiles/',
    expectedBody: messagingListBody,
    response: conjoinList([messagingProfileFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.profiles.list(messagingListBody),
    assertResult: result => expect(result).toEqual({ success: true, data: [messagingProfileFixture()], status: 200 }),
  },
])
