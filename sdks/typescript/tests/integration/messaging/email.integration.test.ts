import { describe, expect, it } from 'vitest'
import { createConjoinClient } from '../../../src/core/client'
import { createMessaging, createMessagingEmailSenderPools } from '../../../src/messaging'
import { expectMultipartFields } from '../contract-server/assertions'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  API_KEY,
  describeMessagingSdkContractCases,
  EMAIL_POOL_ID,
  EMAIL_SENDER_ID,
  MESSAGE_ID,
  messagingEmailMessageFixture,
  messagingEmailSenderFixture,
  messagingEmailSenderPoolFixture,
  messagingListBody,
  PROFILE_ID,
  REQUEST_ID,
} from './messaging-test-utils'

const emailSendBody = {
  from: 'sender@example.com',
  html: '<p>Hello from contract tests</p>',
  subject: 'Contract email',
  to: ['person@example.com'],
}
const readEmailMessagesBody = {
  body: messagingListBody,
} as const
const emailSummaryBody = {
  query: {
    currency: 'usd',
    message: 'Hello from contract tests',
    to: ['person@example.com'],
  },
}
const emailSenderPoolCreateBody = {
  capability: 'email_messages' as const,
  senders: [EMAIL_SENDER_ID],
  title: 'Contract email pool',
}
const emailSenderPoolAddBody = {
  senders: [EMAIL_SENDER_ID],
}
const emailSenderListOneBody = {
  params: {
    sender: 'sender@example.com',
  },
} as const
const emailSenderDeleteBody = {
  params: {
    sender_id: EMAIL_SENDER_ID,
  },
} as const
const emailSenderCreateBody = {
  capability: 'email_messages' as const,
  sender: 'sender@example.com',
  sender_type: 'email_address' as const,
}
const emailSenderUpdateBody = {
  params: {
    sender_id: EMAIL_SENDER_ID,
  },
} as const

describeMessagingSdkContractCases('Messaging email SDK contract integration', [
  {
    name: 'sends an email as multipart/form-data',
    method: 'POST',
    path: '/v1/messaging/email/send',
    response: conjoinSuccess(messagingEmailMessageFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.emails.send(emailSendBody),
    assertResult: result => expect(result).toEqual(messagingEmailMessageFixture()),
    assertRequest: request =>
      expectMultipartFields(request, {
        from: [emailSendBody.from],
        html: [emailSendBody.html],
        subject: [emailSendBody.subject],
        to: emailSendBody.to,
      }),
  },
  {
    name: 'reads email messages',
    method: 'POST',
    path: '/v1/messaging/email/messages/{message_id}',
    expectedBody: readEmailMessagesBody,
    expectedPath: `/v1/messaging/email/messages/${MESSAGE_ID}`,
    expectedPathParams: {
      message_id: MESSAGE_ID,
    },
    response: conjoinList([messagingEmailMessageFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.emails.readMessages(MESSAGE_ID, readEmailMessagesBody),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingEmailMessageFixture()], status: 200 }),
  },
])

describe('Messaging email generated GET body limitations', () => {
  it('covers getSummary rejecting before transport because Fetch forbids GET bodies', async () => {
    const messaging = createMessaging(
      createConjoinClient({
        apiKey: API_KEY,
        baseUrl: 'http://127.0.0.1:1',
        retry: {
          backoffMs: 0,
          maxRetries: 0,
        },
      }),
      { profileId: PROFILE_ID },
    )

    await expect(messaging.emails.getSummary(emailSummaryBody)).rejects.toThrow('GET/HEAD method cannot have body')
  })
})

describeMessagingSdkContractCases('Messaging email sender pool SDK contract integration', [
  {
    name: 'creates an email sender pool',
    method: 'POST',
    path: '/v1/messaging/email/sender-pools/new',
    expectedBody: emailSenderPoolCreateBody,
    response: conjoinSuccess(messagingEmailSenderPoolFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => createMessagingEmailSenderPools(context.profiledClient).create(emailSenderPoolCreateBody),
    assertResult: result => expect(result).toEqual(messagingEmailSenderPoolFixture()),
  },
  {
    name: 'adds email senders to a pool',
    method: 'POST',
    path: '/v1/messaging/email/sender-pools/{pool_id}/senders',
    expectedBody: emailSenderPoolAddBody,
    expectedPath: `/v1/messaging/email/sender-pools/${EMAIL_POOL_ID}/senders`,
    expectedPathParams: {
      pool_id: EMAIL_POOL_ID,
    },
    response: conjoinSuccess(messagingEmailSenderPoolFixture(), { requestId: REQUEST_ID }),
    run: context =>
      createMessagingEmailSenderPools(context.profiledClient).addEmailSendersToPool(
        EMAIL_POOL_ID,
        emailSenderPoolAddBody,
      ),
    assertResult: result => expect(result).toEqual(messagingEmailSenderPoolFixture()),
  },
  {
    name: 'gets an email sender pool',
    method: 'GET',
    path: '/v1/messaging/email/sender-pools/{pool_id}',
    expectedPath: `/v1/messaging/email/sender-pools/${EMAIL_POOL_ID}`,
    expectedPathParams: {
      pool_id: EMAIL_POOL_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingEmailSenderPoolFixture(), { requestId: REQUEST_ID }),
    run: context => createMessagingEmailSenderPools(context.profiledClient).get(EMAIL_POOL_ID),
    assertResult: result => expect(result).toEqual(messagingEmailSenderPoolFixture()),
  },
  {
    name: 'deletes an email sender pool',
    method: 'DELETE',
    path: '/v1/messaging/email/sender-pools/{pool_id}',
    expectedPath: `/v1/messaging/email/sender-pools/${EMAIL_POOL_ID}`,
    expectedPathParams: {
      pool_id: EMAIL_POOL_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingEmailSenderPoolFixture({ date_deleted: '2026-05-16T02:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createMessagingEmailSenderPools(context.profiledClient).delete(EMAIL_POOL_ID),
    assertResult: result =>
      expect(result).toEqual(messagingEmailSenderPoolFixture({ date_deleted: '2026-05-16T02:00:00.000Z' })),
  },
])

describeMessagingSdkContractCases('Messaging email sender SDK contract integration', [
  {
    name: 'verifies an email sender',
    method: 'PATCH',
    path: '/v1/messaging/email/senders/verify/{sender_id}',
    expectedPath: `/v1/messaging/email/senders/verify/${EMAIL_SENDER_ID}`,
    expectedPathParams: {
      sender_id: EMAIL_SENDER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingEmailSenderFixture({ status: 'verifying' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.emailSenders.verify(EMAIL_SENDER_ID),
    assertResult: result => expect(result).toEqual(messagingEmailSenderFixture({ status: 'verifying' })),
  },
  {
    name: 'lists many email senders',
    method: 'POST',
    path: '/v1/messaging/email/senders/retrieve',
    expectedBody: messagingListBody,
    response: conjoinList([messagingEmailSenderFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.emailSenders.listMany(messagingListBody),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingEmailSenderFixture()], status: 200 }),
  },
  {
    name: 'deletes an email sender',
    method: 'DELETE',
    path: '/v1/messaging/email/senders/{sender_id}',
    expectedBody: emailSenderDeleteBody,
    expectedPath: `/v1/messaging/email/senders/${EMAIL_SENDER_ID}`,
    expectedPathParams: {
      sender_id: EMAIL_SENDER_ID,
    },
    response: conjoinSuccess(messagingEmailSenderFixture({ status: 'disabled' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.emailSenders.delete(EMAIL_SENDER_ID, emailSenderDeleteBody),
    assertResult: result => expect(result).toEqual(messagingEmailSenderFixture({ status: 'disabled' })),
  },
  {
    name: 'creates an email sender',
    method: 'POST',
    path: '/v1/messaging/email/senders/new',
    expectedBody: emailSenderCreateBody,
    response: conjoinSuccess(messagingEmailSenderFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => context.messaging.emailSenders.create(emailSenderCreateBody),
    assertResult: result => expect(result).toEqual(messagingEmailSenderFixture()),
  },
  {
    name: 'enables an email sender',
    method: 'PATCH',
    path: '/v1/messaging/email/senders/enable/{sender_id}',
    expectedBody: emailSenderUpdateBody,
    expectedPath: `/v1/messaging/email/senders/enable/${EMAIL_SENDER_ID}`,
    expectedPathParams: {
      sender_id: EMAIL_SENDER_ID,
    },
    response: conjoinSuccess(messagingEmailSenderFixture({ status: 'active' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.emailSenders.enable(EMAIL_SENDER_ID, emailSenderUpdateBody),
    assertResult: result => expect(result).toEqual(messagingEmailSenderFixture({ status: 'active' })),
  },
  {
    name: 'disables an email sender',
    method: 'PATCH',
    path: '/v1/messaging/email/senders/disable/{sender_id}',
    expectedBody: emailSenderUpdateBody,
    expectedPath: `/v1/messaging/email/senders/disable/${EMAIL_SENDER_ID}`,
    expectedPathParams: {
      sender_id: EMAIL_SENDER_ID,
    },
    response: conjoinSuccess(messagingEmailSenderFixture({ status: 'disabled' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.emailSenders.disable(EMAIL_SENDER_ID, emailSenderUpdateBody),
    assertResult: result => expect(result).toEqual(messagingEmailSenderFixture({ status: 'disabled' })),
  },
  {
    name: 'transfers an email sender',
    method: 'PATCH',
    path: '/v1/messaging/email/senders/transfers/{sender_id}/{project_id}',
    expectedPath: `/v1/messaging/email/senders/transfers/${EMAIL_SENDER_ID}/project_456`,
    expectedPathParams: {
      project_id: 'project_456',
      sender_id: EMAIL_SENDER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingEmailSenderFixture({ conjoin_project_id: 'project_456' }), {
      requestId: REQUEST_ID,
    }),
    run: context => context.messaging.emailSenders.transfer(EMAIL_SENDER_ID, 'project_456'),
    assertResult: result => expect(result).toEqual(messagingEmailSenderFixture({ conjoin_project_id: 'project_456' })),
  },
])

describe('Messaging email sender generated GET body limitations', () => {
  it('covers listOne rejecting before transport because Fetch forbids GET bodies', async () => {
    const messaging = createMessaging(
      createConjoinClient({
        apiKey: API_KEY,
        baseUrl: 'http://127.0.0.1:1',
        retry: {
          backoffMs: 0,
          maxRetries: 0,
        },
      }),
      { profileId: PROFILE_ID },
    )

    await expect(messaging.emailSenders.listOne(EMAIL_SENDER_ID, emailSenderListOneBody)).rejects.toThrow(
      'GET/HEAD method cannot have body',
    )
  })
})
