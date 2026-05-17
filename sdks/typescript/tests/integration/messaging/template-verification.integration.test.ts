import { expect } from 'vitest'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  describeMessagingSdkContractCases,
  messagingListBody,
  messagingTemplateFixture,
  messagingVerificationFixture,
  REQUEST_ID,
  TEMPLATE_ID,
  TOKEN,
  VERIFICATION_ID,
} from './messaging-test-utils'

const templateCreateBody = {
  channel: 'email',
  content: 'Hello {{name}}',
  content_type: 'PLAIN_TEXT',
  language: 'en-us',
  title: 'Contract template',
} as const
const templateDeleteManyBody = {
  query: {
    template_id: TEMPLATE_ID,
  },
} as const
const templateUpdateBody = {
  channel: 'email',
  content: 'Hello again {{name}}',
  content_type: 'PLAIN_TEXT',
  title: 'Renamed template',
} as const
const verificationCreateBody = {
  body: 'Your code is 123456',
  channel: 'sms',
  recipient: {
    phone_number: '+14155550100',
  },
} as const
const verificationCheckBody = {
  token: TOKEN,
} as const
const verificationResendBody = {
  params: {
    verification_id: VERIFICATION_ID,
  },
} as const
const verificationListBody = {
  limit: 2,
  query: {
    channel: 'sms',
  },
  sort: {
    date_created: 'desc',
  },
} as const

describeMessagingSdkContractCases('Messaging template SDK contract integration', [
  {
    name: 'creates a message template',
    method: 'POST',
    path: '/v1/messaging/templates/new',
    expectedBody: templateCreateBody,
    response: conjoinSuccess(messagingTemplateFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => context.messaging.templates.createMessage(templateCreateBody),
    assertResult: result => expect(result).toEqual(messagingTemplateFixture()),
  },
  {
    name: 'lists message templates',
    method: 'POST',
    path: '/v1/messaging/templates/{template_id}',
    expectedBody: messagingListBody,
    expectedPath: `/v1/messaging/templates/${TEMPLATE_ID}`,
    expectedPathParams: {
      template_id: TEMPLATE_ID,
    },
    response: conjoinList([messagingTemplateFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.templates.listMessage(TEMPLATE_ID, messagingListBody),
    assertResult: result => expect(result).toEqual({ success: true, data: [messagingTemplateFixture()], status: 200 }),
  },
  {
    name: 'deletes a message template',
    method: 'DELETE',
    path: '/v1/messaging/templates/{template_id}',
    expectedPath: `/v1/messaging/templates/${TEMPLATE_ID}`,
    expectedPathParams: {
      template_id: TEMPLATE_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingTemplateFixture({ date_deleted: '2026-05-16T02:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context => context.messaging.templates.deleteMessage(TEMPLATE_ID),
    assertResult: result =>
      expect(result).toEqual(messagingTemplateFixture({ date_deleted: '2026-05-16T02:00:00.000Z' })),
  },
  {
    name: 'deletes message templates',
    method: 'PATCH',
    path: '/v1/messaging/templates/wipe',
    expectedBody: templateDeleteManyBody,
    response: conjoinSuccess(
      {
        deleted_count: 1,
      },
      { requestId: REQUEST_ID },
    ),
    run: context => context.messaging.templates.deleteMessages(templateDeleteManyBody),
    assertResult: result =>
      expect(result).toEqual({
        deleted_count: 1,
      }),
  },
  {
    name: 'updates a message template',
    method: 'PATCH',
    path: '/v1/messaging/templates/update/{template_id}',
    expectedBody: templateUpdateBody,
    expectedPath: `/v1/messaging/templates/update/${TEMPLATE_ID}`,
    expectedPathParams: {
      template_id: TEMPLATE_ID,
    },
    response: conjoinSuccess(
      messagingTemplateFixture({
        content: 'Hello again {{name}}',
        title: 'Renamed template',
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => context.messaging.templates.updateMessage(TEMPLATE_ID, templateUpdateBody),
    assertResult: result =>
      expect(result).toEqual(
        messagingTemplateFixture({
          content: 'Hello again {{name}}',
          title: 'Renamed template',
        }),
      ),
  },
])

describeMessagingSdkContractCases('Messaging verification SDK contract integration', [
  {
    name: 'creates a verification',
    method: 'POST',
    path: '/v1/messaging/otps/send',
    expectedBody: verificationCreateBody,
    response: conjoinSuccess(messagingVerificationFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.verifications.create(verificationCreateBody),
    assertResult: result => expect(result).toEqual(messagingVerificationFixture()),
  },
  {
    name: 'checks a verification',
    method: 'PATCH',
    path: '/v1/messaging/otps/verify/{token}',
    expectedBody: verificationCheckBody,
    expectedPath: `/v1/messaging/otps/verify/${TOKEN}`,
    expectedPathParams: {
      token: TOKEN,
    },
    response: conjoinSuccess(messagingVerificationFixture({ verification_status: 'verified' }), {
      requestId: REQUEST_ID,
    }),
    run: context => context.messaging.verifications.check(TOKEN, verificationCheckBody),
    assertResult: result => expect(result).toEqual(messagingVerificationFixture({ verification_status: 'verified' })),
  },
  {
    name: 'resends a verification',
    method: 'PATCH',
    path: '/v1/messaging/otps/resend/{verification_id}',
    expectedBody: verificationResendBody,
    expectedPath: `/v1/messaging/otps/resend/${VERIFICATION_ID}`,
    expectedPathParams: {
      verification_id: VERIFICATION_ID,
    },
    response: conjoinSuccess(messagingVerificationFixture({ current_verification_attempts: 1 }), {
      requestId: REQUEST_ID,
    }),
    run: context => context.messaging.verifications.resend(VERIFICATION_ID, verificationResendBody),
    assertResult: result => expect(result).toEqual(messagingVerificationFixture({ current_verification_attempts: 1 })),
  },
  {
    name: 'lists verification messages',
    method: 'POST',
    path: '/v1/messaging/otps/messages',
    expectedBody: verificationListBody,
    response: conjoinList([messagingVerificationFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.verifications.listMessages(verificationListBody),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingVerificationFixture()], status: 200 }),
  },
])
