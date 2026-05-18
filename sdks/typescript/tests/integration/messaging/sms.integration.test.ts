import { describe, expect, it } from 'vitest'
import { createConjoinClient } from '../../../src/core/client'
import { createMessaging } from '../../../src/messaging'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  API_KEY,
  BRAND_ID,
  CAMPAIGN_ID,
  describeMessagingSdkContractCases,
  MESSAGE_ID,
  messagingDatedQueryBody,
  messagingDatedQueryBodyForCampaigns,
  messagingSmsBrandFixture,
  messagingSmsCampaignFixture,
  messagingSmsMessageFixture,
  PROFILE_ID,
  REQUEST_ID,
} from './messaging-test-utils'

const smsSendBody = {
  body: 'Hello from contract tests',
  from: 'CONJOIN',
  to: ['+14155550100'],
  truncate_message: false,
}
const readSmsMessagesBody = {
  body: {
    limit: 2,
    sort: {
      date_created: 'desc',
    },
  },
} as const
const smsSummaryBody = {
  query: {
    currency: 'usd',
    message: 'Hello from contract tests',
    to: [
      {
        phone_number: '+14155550100',
      },
    ],
  },
}
const smsBrandCreateBody = {
  brand_city: 'San Francisco',
  brand_country_code: 'US',
  brand_postal_code: '94105',
  brand_region: 'CA',
  brand_registration_type: 'SOLE_PROPRIETOR',
  brand_street_address_1: '1 Market St',
  brand_street_address_2: 'Suite 100',
  display_name: 'Contract Brand',
  email_address: 'owner@example.com',
  first_name: 'Contract',
  last_name: 'Owner',
  mfa_phone_number: '+14155550100',
  phone_number: '+14155550100',
} as const
const smsBrandUpdateBody = {
  updates: {
    display_name: 'Renamed Brand',
  },
} as const
const smsCampaignCreateBody = {
  brand_id: BRAND_ID,
  description: 'Contract campaign',
  help_message: 'Reply HELP for help',
  message_flow: 'Users opt in from the contract test page.',
  message_samples: ['Your contract code is 123456.'],
  opt_out_message: 'Reply STOP to opt out',
  privacy_policy_url: 'https://example.com/privacy',
  terms_and_conditions_url: 'https://example.com/terms',
  title: 'Contract campaign',
  use_case: 'ACCOUNT_NOTIFICATION' as const,
}
const smsCampaignUpdateBody = {
  updates: {},
} as const
describeMessagingSdkContractCases('Messaging SMS SDK contract integration', [
  {
    name: 'sends an SMS',
    method: 'POST',
    path: '/v1/messaging/sms/send',
    expectedBody: smsSendBody,
    response: conjoinSuccess(messagingSmsMessageFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.sms.sendSms(smsSendBody),
    assertResult: result => expect(result).toEqual(messagingSmsMessageFixture()),
  },
  {
    name: 'reads SMS messages',
    method: 'POST',
    path: '/v1/messaging/sms/messages/{message_id}',
    expectedBody: readSmsMessagesBody,
    expectedPath: `/v1/messaging/sms/messages/${MESSAGE_ID}`,
    expectedPathParams: {
      message_id: MESSAGE_ID,
    },
    response: conjoinList([messagingSmsMessageFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.sms.readSmsMessages(MESSAGE_ID, readSmsMessagesBody),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingSmsMessageFixture()], status: 200 }),
  },
])

describe('Messaging SMS generated GET body limitations', () => {
  it('covers getSmsSummary rejecting before transport because Fetch forbids GET bodies', async () => {
    const client = createConjoinClient({
      apiKey: API_KEY,
      baseUrl: 'http://127.0.0.1:1',
      retry: {
        backoffMs: 0,
        maxRetries: 0,
      },
    })

    await expect(createMessaging(client, { profileId: PROFILE_ID }).sms.getSmsSummary(smsSummaryBody)).rejects.toThrow(
      'GET/HEAD method cannot have body',
    )
  })
})

describeMessagingSdkContractCases('Messaging SMS brand SDK contract integration', [
  {
    name: 'creates an SMS brand',
    method: 'POST',
    path: '/v1/messaging/sms/brands/new',
    expectedBody: smsBrandCreateBody,
    response: conjoinSuccess(messagingSmsBrandFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => context.messaging.smsBrands.createSmsBrand(smsBrandCreateBody),
    assertResult: result => expect(result).toEqual(messagingSmsBrandFixture()),
  },
  {
    name: 'reads an SMS brand',
    method: 'POST',
    path: '/v1/messaging/sms/brands/{brand_id}',
    expectedPath: `/v1/messaging/sms/brands/${BRAND_ID}`,
    expectedPathParams: {
      brand_id: BRAND_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsBrandFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.smsBrands.readSmsBrand(BRAND_ID),
    assertResult: result => expect(result).toEqual(messagingSmsBrandFixture()),
  },
  {
    name: 'updates an SMS brand',
    method: 'PATCH',
    path: '/v1/messaging/sms/brands/{brand_id}',
    expectedBody: smsBrandUpdateBody,
    expectedPath: `/v1/messaging/sms/brands/${BRAND_ID}`,
    expectedPathParams: {
      brand_id: BRAND_ID,
    },
    response: conjoinSuccess(messagingSmsBrandFixture({ display_name: 'Renamed Brand' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.smsBrands.updateSmsBrand(BRAND_ID, smsBrandUpdateBody),
    assertResult: result => expect(result).toEqual(messagingSmsBrandFixture({ display_name: 'Renamed Brand' })),
  },
  {
    name: 'deletes an SMS brand',
    method: 'DELETE',
    path: '/v1/messaging/sms/brands/{brand_id}',
    expectedPath: `/v1/messaging/sms/brands/${BRAND_ID}`,
    expectedPathParams: {
      brand_id: BRAND_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsBrandFixture({ date_deleted: '2026-05-16T02:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context => context.messaging.smsBrands.deleteSmsBrand(BRAND_ID),
    assertResult: result =>
      expect(result).toEqual(messagingSmsBrandFixture({ date_deleted: '2026-05-16T02:00:00.000Z' })),
  },
  {
    name: 'lists SMS brands',
    method: 'POST',
    path: '/v1/messaging/sms/brands/',
    expectedBody: messagingDatedQueryBody,
    response: conjoinList([messagingSmsBrandFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.smsBrands.listSmsBrands(messagingDatedQueryBody),
    assertResult: result => expect(result).toEqual({ success: true, data: [messagingSmsBrandFixture()], status: 200 }),
  },
])

describeMessagingSdkContractCases('Messaging SMS campaign SDK contract integration', [
  {
    name: 'creates an SMS campaign',
    method: 'POST',
    path: '/v1/messaging/sms/campaigns/new',
    expectedBody: smsCampaignCreateBody,
    response: conjoinSuccess(messagingSmsCampaignFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => context.messaging.smsCampaigns.createSmsCampaign(smsCampaignCreateBody),
    assertResult: result => expect(result).toEqual(messagingSmsCampaignFixture()),
  },
  {
    name: 'reads an SMS campaign',
    method: 'POST',
    path: '/v1/messaging/sms/campaigns/{campaign_id}',
    expectedPath: `/v1/messaging/sms/campaigns/${CAMPAIGN_ID}`,
    expectedPathParams: {
      campaign_id: CAMPAIGN_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsCampaignFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.smsCampaigns.readSmsCampaign(CAMPAIGN_ID),
    assertResult: result => expect(result).toEqual(messagingSmsCampaignFixture()),
  },
  {
    name: 'updates an SMS campaign',
    method: 'PATCH',
    path: '/v1/messaging/sms/campaigns/{campaign_id}',
    expectedBody: smsCampaignUpdateBody,
    expectedPath: `/v1/messaging/sms/campaigns/${CAMPAIGN_ID}`,
    expectedPathParams: {
      campaign_id: CAMPAIGN_ID,
    },
    response: conjoinSuccess(messagingSmsCampaignFixture({ status: 'pending' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.smsCampaigns.updateSmsCampaign(CAMPAIGN_ID, smsCampaignUpdateBody),
    assertResult: result => expect(result).toEqual(messagingSmsCampaignFixture({ status: 'pending' })),
  },
  {
    name: 'deletes an SMS campaign',
    method: 'DELETE',
    path: '/v1/messaging/sms/campaigns/{campaign_id}',
    expectedPath: `/v1/messaging/sms/campaigns/${CAMPAIGN_ID}`,
    expectedPathParams: {
      campaign_id: CAMPAIGN_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsCampaignFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.smsCampaigns.deleteSmsCampaign(CAMPAIGN_ID),
    assertResult: result => expect(result).toEqual(messagingSmsCampaignFixture({ status: 'deleted' })),
  },
  {
    name: 'lists SMS campaigns',
    method: 'POST',
    path: '/v1/messaging/sms/campaigns/',
    expectedBody: messagingDatedQueryBodyForCampaigns,
    response: conjoinList([messagingSmsCampaignFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.smsCampaigns.listSmsCampaigns(messagingDatedQueryBodyForCampaigns),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingSmsCampaignFixture()], status: 200 }),
  },
])
