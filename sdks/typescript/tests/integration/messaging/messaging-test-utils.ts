import { createConjoinClient } from '../../../src/core/client'
import type { ConjoinClient, RequestOptions } from '../../../src/core/types'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../../src/core/version'
import { createMessaging } from '../../../src/messaging'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { startConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { describeSdkContractCases, type SdkContractCase } from '../sdk-contract/run-sdk-contract-cases'

export const API_KEY = 'ck_test_messaging_contract'
export const BRAND_ID = 'brand_123'
export const CAMPAIGN_ID = 'campaign_123'
export const CHANNEL_ID = 'channel_123'
export const CONTACT_ID = 'contact_123'
export const CONJOIN_ACCOUNT_ID = 'account_123'
export const CONJOIN_PROJECT_ID = 'project_123'
export const CONVERSATION_ID = 'conversation_123'
export const DATE_CREATED = '2026-05-16T00:00:00.000Z'
export const DATE_UPDATED = '2026-05-16T01:00:00.000Z'
export const EMAIL_POOL_ID = 'email_pool_123'
export const EMAIL_SENDER_ID = 'email_sender_123'
export const MESSAGE_ANALYTICS_ID = 'message_analytics_123'
export const MESSAGE_ID = 'message_123'
export const PHONE_NUMBER = '+14155550100'
export const PHONE_NUMBER_ID = 'phone_number_123'
export const PROFILE_ID = 'profile_123'
export const RECIPIENT_ID = 'recipient_123'
export const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'
export const SMS_POOL_ID = 'sms_pool_123'
export const SMS_SENDER_ID = 'sms_sender_123'
export const TEMPLATE_ID = 'template_123'
export const TOKEN = '123456'
export const VERIFICATION_ID = 'verification_123'

export type MessagingContractTestContext = {
  client: ConjoinClient
  messaging: ReturnType<typeof createMessaging>
  profiledClient: ConjoinClient
  server: ConjoinContractServer
}

export type MessagingSdkContractCase<TResult = unknown> = SdkContractCase<MessagingContractTestContext, TResult>

export const messagingListBody = {
  limit: 2,
  sort: {
    date_created: 'desc',
  },
} as const

export const messagingExpectedProfileHeader = {
  'messaging-profile-id': PROFILE_ID,
}

export const messagingDatedQueryBody = {
  limit: 2,
  query: {
    date_created: {
      greater_than_or_equals: DATE_CREATED,
    },
    date_deleted: {},
    date_updated: {},
  },
  sort: {
    date_created: 'desc',
  },
} as const

export const messagingDatedQueryBodyForCampaigns = messagingDatedQueryBody

export const messagingPhoneNumberListQuery = {
  limit: 2,
  sort: {
    date_created: 'desc',
  },
} as const

export const messagingExpectedPhoneNumberListQuery = {
  limit: '2',
  'sort[date_created]': 'desc',
}

export const startMessagingContractTest = async (): Promise<MessagingContractTestContext> => {
  const server = await startConjoinContractServer()
  const client = createConjoinClient({
    apiKey: API_KEY,
    baseUrl: server.baseUrl,
  })
  const profiledClient = withMessagingProfileHeader(client)

  return {
    client,
    messaging: createMessaging(client, { profileId: PROFILE_ID }),
    profiledClient,
    server,
  }
}

export const describeMessagingSdkContractCases = (suiteName: string, cases: MessagingSdkContractCase[]): void => {
  describeSdkContractCases({
    cases,
    defaultExpectedHeaders: {
      authorization: `Bearer ${API_KEY}`,
      'x-conjoin-api-version': DEFAULT_API_VERSION,
      'x-conjoin-sdk-version': SDK_VERSION,
      ...messagingExpectedProfileHeader,
    },
    startContext: startMessagingContractTest,
    suiteName,
  })
}

export const describeMessagingProfileSdkContractCases = (
  suiteName: string,
  cases: MessagingSdkContractCase[],
): void => {
  describeSdkContractCases({
    cases,
    defaultExpectedHeaders: {
      authorization: `Bearer ${API_KEY}`,
      'x-conjoin-api-version': DEFAULT_API_VERSION,
      'x-conjoin-sdk-version': SDK_VERSION,
    },
    startContext: startMessagingContractTest,
    suiteName,
  })
}

const withMessagingProfileHeader = (client: ConjoinClient): ConjoinClient => {
  const injectHeader = (options?: RequestOptions): RequestOptions => ({
    ...options,
    headers: {
      ...options?.headers,
      'Messaging-Profile-ID': PROFILE_ID,
    },
  })

  return {
    config: client.config,
    fetch: <T>(path: string, options?: RequestOptions) => client.fetch<T>(path, injectHeader(options)),
    fetchList: <T>(path: string, options?: RequestOptions) => client.fetchList<T>(path, injectHeader(options)),
    fetchListWithResponse: <T>(path: string, options?: RequestOptions) =>
      client.fetchListWithResponse<T>(path, injectHeader(options)),
    fetchRaw: (path: string, options?: RequestOptions) => client.fetchRaw(path, injectHeader(options)),
    fetchWithResponse: <T>(path: string, options?: RequestOptions) =>
      client.fetchWithResponse<T>(path, injectHeader(options)),
    withRequestTrace: async (callback, options) =>
      client.withRequestTrace(
        (scopedClient, requestId) => callback(withMessagingProfileHeader(scopedClient), requestId),
        options,
      ),
  }
}

const baseMessagingFixture = () => ({
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  profile_id: PROFILE_ID,
})

export const messagingContactFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  contact_id: CONTACT_ID,
  email: 'person@example.com',
  first_name: 'Contract',
  last_name: 'Recipient',
  preferred_channels: ['email'],
  ...overrides,
})

export const messagingConversationFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  accepts_replies: true,
  conversation_id: CONVERSATION_ID,
  message_channels: {
    email: {
      enabled: true,
    },
  },
  title: 'Contract conversation',
  total_recipients: 1,
  ...overrides,
})

export const messagingConversationRecipientFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  contact_id: CONTACT_ID,
  conversation_id: CONVERSATION_ID,
  conversation_recipient_id: RECIPIENT_ID,
  ...overrides,
})

export const messagingEmailMessageFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  accepts_replies: true,
  body: 'Hello from contract tests',
  from: 'sender@example.com',
  message_id: MESSAGE_ID,
  sent_at: DATE_CREATED,
  status: 'sent',
  subject: 'Contract email',
  type: 'email',
  ...overrides,
})

export const messagingSmsMessageFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  body: 'Hello from contract tests',
  message_id: MESSAGE_ID,
  sent_at: DATE_CREATED,
  status: 'sent',
  truncate_message: false,
  type: 'sms',
  ...overrides,
})

export const messagingSummaryFixture = (overrides: Record<string, unknown> = {}) => ({
  cost_per_part: 1,
  currency: 'usd',
  total_cost: 1,
  total_parts: 1,
  total_recipients: 1,
  ...overrides,
})

export const messagingEmailSenderFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  capability: 'email_messages',
  sender: 'sender@example.com',
  sender_id: EMAIL_SENDER_ID,
  sender_type: 'email_address',
  status: 'active',
  submitted_at: DATE_CREATED,
  ...overrides,
})

export const messagingEmailSenderPoolFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  capability: 'email_messages',
  pool_id: EMAIL_POOL_ID,
  senders: [EMAIL_SENDER_ID],
  title: 'Contract email pool',
  ...overrides,
})

export const messagingAnalyticsFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  events: {
    delivered: {
      recipient_events: {
        recipient_123: {
          timestamp: DATE_CREATED,
        },
      },
      total_count: 1,
    },
  },
  message_analytics_id: MESSAGE_ANALYTICS_ID,
  total_message_count: 1,
  ...overrides,
})

export const messagingMultisendFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  accepts_replies: true,
  channel_messages: {
    sms: messagingSmsMessageFixture(),
  },
  message_id: MESSAGE_ID,
  priority: ['sms', 'email'],
  sent_at: DATE_CREATED,
  type: 'multisend',
  ...overrides,
})

export const messagingPhoneNumberFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  country_iso_code: 'US',
  phone_number: PHONE_NUMBER,
  phone_number_id: PHONE_NUMBER_ID,
  region_code: 'CA',
  status: 'active',
  title: 'Contract phone number',
  type: 'local',
  ...overrides,
})

export const messagingProfileFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  features: {
    email: true,
    sms: true,
  },
  is_system_profile: false,
  message_retention_days: 30,
  name: 'Contract profile',
  resource_region: 'US',
  status: 'active',
  ...overrides,
})

export const messagingSmsBrandFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  brand_id: BRAND_ID,
  brand_registration_type: 'SOLE_PROPRIETOR',
  display_name: 'Contract Brand',
  ...overrides,
})

export const messagingSmsCampaignFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  brand_id: BRAND_ID,
  campaign_id: CAMPAIGN_ID,
  status: 'active',
  ...overrides,
})

export const messagingSmsSenderFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  brand_id: BRAND_ID,
  capability: 'sms_messages',
  is_phone_number: false,
  sender: 'CONJOIN',
  sender_id: SMS_SENDER_ID,
  status: 'active',
  submitted_at: DATE_CREATED,
  ...overrides,
})

export const messagingSmsSenderPoolFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  pool_id: SMS_POOL_ID,
  senders: [SMS_SENDER_ID],
  ...overrides,
})

export const messagingTemplateFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  channel: 'email',
  content: 'Hello {{name}}',
  content_type: 'PLAIN_TEXT',
  is_default: false,
  is_favourite: false,
  language: 'en-us',
  template_id: TEMPLATE_ID,
  title: 'Contract template',
  ...overrides,
})

export const messagingVerificationFixture = (overrides: Record<string, unknown> = {}) => ({
  ...baseMessagingFixture(),
  current_verification_attempts: 0,
  expires_at: '2026-05-17T00:00:00.000Z',
  from: 'CONJOIN',
  max_verification_attempts: 3,
  message_channel: 'sms',
  message_status: 'sent',
  recipient: {
    phone_number: PHONE_NUMBER,
  },
  sent_at: DATE_CREATED,
  token_type: 'numeric',
  verification_id: VERIFICATION_ID,
  verification_status: 'pending',
  ...overrides,
})
