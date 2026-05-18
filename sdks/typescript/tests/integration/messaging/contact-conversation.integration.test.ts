import { expect } from 'vitest'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  CONTACT_ID,
  CONVERSATION_ID,
  describeMessagingSdkContractCases,
  MESSAGE_ID,
  messagingContactFixture,
  messagingConversationFixture,
  messagingConversationRecipientFixture,
  messagingListBody,
  RECIPIENT_ID,
  REQUEST_ID,
} from './messaging-test-utils'

const contactCreateBody = {
  email: 'person@example.com',
  first_name: 'Contract',
  last_name: 'Recipient',
  preferred_channels: ['email' as const],
  reference_id: 'contact_reference_123',
}
const contactSuppressBody = {
  channels: ['email' as const],
}
const contactUpdateBody = {
  email: 'renamed@example.com',
  name: 'Renamed Recipient',
  preferred_channels: ['email'],
}
const conversationCreateBody = {
  accepts_replies: true,
  channels: ['email' as const],
  recipients: [
    {
      email: 'person@example.com',
      first_name: 'Contract',
      last_name: 'Recipient',
      reference_id: 'recipient_reference_123',
    },
  ],
  senders: {
    email: {
      sender: 'sender@example.com',
      type: 'sender' as const,
    },
  },
  title: 'Contract conversation',
}
const conversationCloneBody = {
  title: 'Cloned conversation',
}
const conversationArchiveBody = {}
const conversationUpdateBody = {
  accepts_replies: false,
  title: 'Renamed conversation',
}

describeMessagingSdkContractCases('Messaging contact SDK contract integration', [
  {
    name: 'creates a contact',
    method: 'POST',
    path: '/v1/messaging/contacts/new',
    expectedBody: contactCreateBody,
    response: conjoinSuccess(messagingContactFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => context.messaging.contacts.create(contactCreateBody),
    assertResult: result => expect(result).toEqual(messagingContactFixture()),
  },
  {
    name: 'suppresses contact messages',
    method: 'PATCH',
    path: '/v1/messaging/contacts/{contact_id}/unsubscribe',
    expectedBody: contactSuppressBody,
    expectedPath: `/v1/messaging/contacts/${CONTACT_ID}/unsubscribe`,
    expectedPathParams: {
      contact_id: CONTACT_ID,
    },
    response: conjoinSuccess(messagingContactFixture({ preferred_channels: [] }), { requestId: REQUEST_ID }),
    run: context => context.messaging.contacts.suppressMessages(CONTACT_ID, contactSuppressBody),
    assertResult: result => expect(result).toEqual(messagingContactFixture({ preferred_channels: [] })),
  },
  {
    name: 'updates a contact',
    method: 'PATCH',
    path: '/v1/messaging/contacts/{contact_id}',
    expectedBody: contactUpdateBody,
    expectedPath: `/v1/messaging/contacts/${CONTACT_ID}`,
    expectedPathParams: {
      contact_id: CONTACT_ID,
    },
    response: conjoinSuccess(messagingContactFixture({ email: 'renamed@example.com' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.contacts.update(CONTACT_ID, contactUpdateBody),
    assertResult: result => expect(result).toEqual(messagingContactFixture({ email: 'renamed@example.com' })),
  },
  {
    name: 'deletes a contact',
    method: 'DELETE',
    path: '/v1/messaging/contacts/{contact_id}',
    expectedPath: `/v1/messaging/contacts/${CONTACT_ID}`,
    expectedPathParams: {
      contact_id: CONTACT_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingContactFixture({ date_deleted: '2026-05-16T02:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context => context.messaging.contacts.delete(CONTACT_ID),
    assertResult: result =>
      expect(result).toEqual(messagingContactFixture({ date_deleted: '2026-05-16T02:00:00.000Z' })),
  },
  {
    name: 'lists contacts',
    method: 'POST',
    path: '/v1/messaging/contacts/',
    expectedBody: messagingListBody,
    response: conjoinList([messagingContactFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => context.messaging.contacts.list(messagingListBody),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [messagingContactFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
])

describeMessagingSdkContractCases('Messaging conversation SDK contract integration', [
  {
    name: 'creates a conversation',
    method: 'POST',
    path: '/v1/messaging/conversations/new',
    expectedBody: conversationCreateBody,
    response: conjoinSuccess(messagingConversationFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => context.messaging.conversations.create(conversationCreateBody),
    assertResult: result => expect(result).toEqual(messagingConversationFixture()),
  },
  {
    name: 'clones a conversation',
    method: 'POST',
    path: '/v1/messaging/conversations/clone/{conversation_id}',
    expectedBody: conversationCloneBody,
    expectedPath: `/v1/messaging/conversations/clone/${CONVERSATION_ID}`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
    },
    response: conjoinSuccess(messagingConversationFixture({ title: 'Cloned conversation' }), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => context.messaging.conversations.clone(CONVERSATION_ID, conversationCloneBody),
    assertResult: result => expect(result).toEqual(messagingConversationFixture({ title: 'Cloned conversation' })),
  },
  {
    name: 'deletes a conversation',
    method: 'PATCH',
    path: '/v1/messaging/conversations/wipe/{conversation_id}',
    expectedPath: `/v1/messaging/conversations/wipe/${CONVERSATION_ID}`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingConversationFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.conversations.delete(CONVERSATION_ID),
    assertResult: result => expect(result).toEqual(messagingConversationFixture({ status: 'deleted' })),
  },
  {
    name: 'archives a conversation',
    method: 'PATCH',
    path: '/v1/messaging/conversations/archive/{conversation_id}',
    expectedBody: conversationArchiveBody,
    expectedPath: `/v1/messaging/conversations/archive/${CONVERSATION_ID}`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
    },
    response: conjoinSuccess(messagingConversationFixture({ status: 'archived' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.conversations.archive(CONVERSATION_ID, conversationArchiveBody),
    assertResult: result => expect(result).toEqual(messagingConversationFixture({ status: 'archived' })),
  },
  {
    name: 'updates a conversation',
    method: 'PATCH',
    path: '/v1/messaging/conversations/{conversation_id}',
    expectedBody: conversationUpdateBody,
    expectedPath: `/v1/messaging/conversations/${CONVERSATION_ID}`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
    },
    response: conjoinSuccess(
      messagingConversationFixture({
        accepts_replies: false,
        title: 'Renamed conversation',
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => context.messaging.conversations.update(CONVERSATION_ID, conversationUpdateBody),
    assertResult: result =>
      expect(result).toEqual(
        messagingConversationFixture({
          accepts_replies: false,
          title: 'Renamed conversation',
        }),
      ),
  },
  {
    name: 'lists conversations',
    method: 'POST',
    path: '/v1/messaging/conversations/{conversation_id}',
    expectedBody: messagingListBody,
    expectedPath: `/v1/messaging/conversations/${CONVERSATION_ID}`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
    },
    response: conjoinList([messagingConversationFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.conversations.list(CONVERSATION_ID, messagingListBody),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingConversationFixture()], status: 200 }),
  },
  {
    name: 'reads conversation messages',
    method: 'POST',
    path: '/v1/messaging/conversations/{conversation_id}/messages/{parent_message_id}',
    expectedPath: `/v1/messaging/conversations/${CONVERSATION_ID}/messages/${MESSAGE_ID}`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
      parent_message_id: MESSAGE_ID,
    },
    expectedRawBody: '',
    response: conjoinList([messagingConversationFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.conversations.readMessages(CONVERSATION_ID, MESSAGE_ID),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingConversationFixture()], status: 200 }),
  },
  {
    name: 'reads one conversation recipient',
    method: 'GET',
    path: '/v1/messaging/conversations/{conversation_id}/recipients/{recipient_id}',
    expectedPath: `/v1/messaging/conversations/${CONVERSATION_ID}/recipients/${RECIPIENT_ID}`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
      recipient_id: RECIPIENT_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingConversationRecipientFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.conversations.readOneRecipient(CONVERSATION_ID, RECIPIENT_ID),
    assertResult: result => expect(result).toEqual(messagingConversationRecipientFixture()),
  },
  {
    name: 'deletes conversation recipients',
    method: 'DELETE',
    path: '/v1/messaging/conversations/{conversation_id}/recipients/{recipient_id}',
    expectedPath: `/v1/messaging/conversations/${CONVERSATION_ID}/recipients/${RECIPIENT_ID}`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
      recipient_id: RECIPIENT_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingConversationRecipientFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.conversations.deleteRecipients(CONVERSATION_ID, RECIPIENT_ID),
    assertResult: result => expect(result).toEqual(messagingConversationRecipientFixture({ status: 'deleted' })),
  },
  {
    name: 'reads many conversation recipients',
    method: 'POST',
    path: '/v1/messaging/conversations/{conversation_id}/recipients',
    expectedPath: `/v1/messaging/conversations/${CONVERSATION_ID}/recipients`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
    },
    expectedRawBody: '',
    response: conjoinList([messagingConversationRecipientFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.conversations.readManyRecipients(CONVERSATION_ID),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingConversationRecipientFixture()], status: 200 }),
  },
  {
    name: 'adds one conversation recipient',
    method: 'POST',
    path: '/v1/messaging/conversations/{conversation_id}/recipients/new',
    expectedPath: `/v1/messaging/conversations/${CONVERSATION_ID}/recipients/new`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingConversationRecipientFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.conversations.addOneRecipient(CONVERSATION_ID),
    assertResult: result => expect(result).toEqual(messagingConversationRecipientFixture()),
  },
  {
    name: 'adds many conversation recipients',
    method: 'POST',
    path: '/v1/messaging/conversations/{conversation_id}/recipients/batch',
    expectedPath: `/v1/messaging/conversations/${CONVERSATION_ID}/recipients/batch`,
    expectedPathParams: {
      conversation_id: CONVERSATION_ID,
    },
    expectedRawBody: '',
    response: conjoinList([messagingConversationRecipientFixture()], { requestId: REQUEST_ID }),
    run: context => context.messaging.conversations.addManyRecipients(CONVERSATION_ID),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [messagingConversationRecipientFixture()], status: 200 }),
  },
])
