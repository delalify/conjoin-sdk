import { expect } from 'vitest'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  CHANNEL_ID,
  describeMessagingSdkContractCases,
  MESSAGE_ID,
  messagingAnalyticsFixture,
  messagingExpectedPhoneNumberListQuery,
  messagingMultisendFixture,
  messagingPhoneNumberFixture,
  messagingPhoneNumberListQuery,
  PHONE_NUMBER,
  REQUEST_ID,
} from './messaging-test-utils'

const multisendCreateBody = {
  accepts_replies: true,
  body: 'Hello from contract tests',
  message_channels: ['sms' as const, 'email' as const],
  message_config: {
    email: {
      from: 'sender@example.com',
      subject: 'Contract email',
      text: 'Hello from contract tests',
    },
    sms: {
      body: 'Hello from contract tests',
      from: 'CONJOIN',
    },
  },
  message_priority: 'all' as const,
  to: [
    {
      email: 'person@example.com',
      phone_number: PHONE_NUMBER,
    },
  ],
}
const phoneNumberPurchaseBody = {
  callback_url: 'https://example.com/phone-callback',
  config: {
    sms: {
      campaign_id: 'campaign_123',
    },
  },
  country_iso_code: 'US',
  phone_number: PHONE_NUMBER,
  title: 'Contract phone number',
  type: 'local' as const,
}
const availablePhoneNumbersQuery = {
  country_iso_code: 'US',
  limit: 2,
} as const
const expectedAvailablePhoneNumbersQuery = {
  country_iso_code: 'US',
  limit: '2',
}

describeMessagingSdkContractCases('Messaging analytics SDK contract integration', [
  {
    name: 'lists message analytics',
    method: 'POST',
    path: '/v1/messaging/analytics/',
    expectedRawBody: '',
    response: conjoinList([messagingAnalyticsFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.analytics.list(),
    assertResult: result => expect(result).toEqual({ success: true, data: [messagingAnalyticsFixture()], status: 200 }),
  },
  {
    name: 'generates message analytics summaries',
    method: 'POST',
    path: '/v1/messaging/analytics/channels/{channel_id}/generate',
    expectedPath: `/v1/messaging/analytics/channels/${CHANNEL_ID}/generate`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingAnalyticsFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => context.messaging.analytics.generateSummaries(CHANNEL_ID),
    assertResult: result => expect(result).toEqual(messagingAnalyticsFixture()),
  },
  {
    name: 'creates a message analytics report',
    method: 'POST',
    path: '/v1/messaging/analytics/messages/{message_id}/channels/{channel_id}/reports',
    expectedPath: `/v1/messaging/analytics/messages/${MESSAGE_ID}/channels/${CHANNEL_ID}/reports`,
    expectedPathParams: {
      channel_id: CHANNEL_ID,
      message_id: MESSAGE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingAnalyticsFixture({ report_id: 'report_123' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.analytics.createReport(MESSAGE_ID, CHANNEL_ID),
    assertResult: result => expect(result).toEqual(messagingAnalyticsFixture({ report_id: 'report_123' })),
  },
])

describeMessagingSdkContractCases('Messaging multisend SDK contract integration', [
  {
    name: 'creates a multisend message',
    method: 'POST',
    path: '/v1/messaging/multisend/send',
    expectedBody: multisendCreateBody,
    response: conjoinSuccess(messagingMultisendFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.multisend.create(multisendCreateBody),
    assertResult: result => expect(result).toEqual(messagingMultisendFixture()),
  },
  {
    name: 'reads a multisend message',
    method: 'GET',
    path: '/v1/messaging/multisend/{message_id}',
    expectedPath: `/v1/messaging/multisend/${MESSAGE_ID}`,
    expectedPathParams: {
      message_id: MESSAGE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingMultisendFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.multisend.read(MESSAGE_ID),
    assertResult: result => expect(result).toEqual(messagingMultisendFixture()),
  },
])

describeMessagingSdkContractCases('Messaging phone number SDK contract integration', [
  {
    name: 'purchases a phone number',
    method: 'POST',
    path: '/v1/messaging/phone-numbers/provision/{phone_number}',
    expectedBody: phoneNumberPurchaseBody,
    expectedPath: `/v1/messaging/phone-numbers/provision/${PHONE_NUMBER}`,
    expectedPathParams: {
      phone_number: PHONE_NUMBER,
    },
    response: conjoinSuccess(messagingPhoneNumberFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => context.messaging.phoneNumbers.purchase(PHONE_NUMBER, phoneNumberPurchaseBody),
    assertResult: result => expect(result).toEqual(messagingPhoneNumberFixture()),
  },
  {
    name: 'updates a phone number project',
    method: 'PATCH',
    path: '/v1/messaging/phone-numbers/transfer/{phone_number}/project/{project_id}',
    expectedPath: `/v1/messaging/phone-numbers/transfer/${PHONE_NUMBER}/project/project_456`,
    expectedPathParams: {
      phone_number: PHONE_NUMBER,
      project_id: 'project_456',
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingPhoneNumberFixture({ conjoin_project_id: 'project_456' }), {
      requestId: REQUEST_ID,
    }),
    run: context => context.messaging.phoneNumbers.update(PHONE_NUMBER, 'project_456'),
    assertResult: result => expect(result).toEqual(messagingPhoneNumberFixture({ conjoin_project_id: 'project_456' })),
  },
  {
    name: 'lists available phone numbers',
    method: 'GET',
    path: '/v1/messaging/phone-numbers/available',
    expectedQuery: expectedAvailablePhoneNumbersQuery,
    expectedRawBody: '',
    response: conjoinList([messagingPhoneNumberFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.phoneNumbers.listAvailable(availablePhoneNumbersQuery),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingPhoneNumberFixture()], status: 200 }),
  },
  {
    name: 'lists phone numbers',
    method: 'GET',
    path: '/v1/messaging/phone-numbers/',
    expectedQuery: messagingExpectedPhoneNumberListQuery,
    expectedRawBody: '',
    response: conjoinList([messagingPhoneNumberFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.phoneNumbers.list(messagingPhoneNumberListQuery),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingPhoneNumberFixture()], status: 200 }),
  },
  {
    name: 'releases a phone number',
    method: 'POST',
    path: '/v1/messaging/phone-numbers/release/{phone_number}',
    expectedPath: `/v1/messaging/phone-numbers/release/${PHONE_NUMBER}`,
    expectedPathParams: {
      phone_number: PHONE_NUMBER,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingPhoneNumberFixture({ status: 'released' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.phoneNumbers.release(PHONE_NUMBER),
    assertResult: result => expect(result).toEqual(messagingPhoneNumberFixture({ status: 'released' })),
  },
])
