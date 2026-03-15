import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createConversation']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createConversation']['responses']['201']['content']['application/json']['data']>
type CloneBody = operations['cloneConversation']['requestBody']['content']['application/json']
type CloneData = NonNullable<operations['cloneConversation']['responses']['201']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deleteConversation']['responses']['200']['content']['application/json']['data']>
type ArchiveBody = operations['archiveConversation']['requestBody']['content']['application/json']
type ArchiveData = NonNullable<operations['archiveConversation']['responses']['200']['content']['application/json']['data']>
type UpdateBody = operations['updateConversation']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateConversation']['responses']['200']['content']['application/json']['data']>
type ListBody = operations['listConversations']['requestBody']['content']['application/json']
type ListData = NonNullable<operations['listConversations']['responses']['200']['content']['application/json']['data']>[number]
type ReadMessagesData = NonNullable<operations['readConversationMessages']['responses']['200']['content']['application/json']['data']>[number]
type ReadOneRecipientData = NonNullable<operations['readOneConversationRecipient']['responses']['200']['content']['application/json']['data']>
type DeleteRecipientsData = NonNullable<operations['deleteConversationRecipients']['responses']['200']['content']['application/json']['data']>
type ReadManyRecipientsData = NonNullable<operations['readManyConversationRecipients']['responses']['200']['content']['application/json']['data']>[number]
type AddOneRecipientData = NonNullable<operations['addOneConversationRecipient']['responses']['200']['content']['application/json']['data']>
type AddManyRecipientsData = NonNullable<operations['addManyConversationRecipients']['responses']['200']['content']['application/json']['data']>[number]

export function createMessagingConversations(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('messaging/conversations/new', { method: 'POST', body: data }),

    clone: (conversationId: string, data: CloneBody) =>
      client.fetch<CloneData>(`messaging/conversations/clone/${conversationId}`, { method: 'POST', body: data }),

    delete: (conversationId: string) =>
      client.fetch<DeleteData>(`messaging/conversations/wipe/${conversationId}`, { method: 'PATCH' }),

    archive: (conversationId: string, data: ArchiveBody) =>
      client.fetch<ArchiveData>(`messaging/conversations/archive/${conversationId}`, { method: 'PATCH', body: data }),

    update: (conversationId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`messaging/conversations/${conversationId}`, { method: 'PATCH', body: data }),

    list: (conversationId: string, data: ListBody) =>
      client.fetchList<ListData>(`messaging/conversations/${conversationId}`, { method: 'POST', body: data }),

    readMessages: (conversationId: string, parentMessageId: string) =>
      client.fetchList<ReadMessagesData>(`messaging/conversations/${conversationId}/messages/${parentMessageId}`, { method: 'POST' }),

    readOneRecipient: (conversationId: string, recipientId: string) =>
      client.fetch<ReadOneRecipientData>(`messaging/conversations/${conversationId}/recipients/${recipientId}`),

    deleteRecipients: (conversationId: string, recipientId: string) =>
      client.fetch<DeleteRecipientsData>(`messaging/conversations/${conversationId}/recipients/${recipientId}`, { method: 'DELETE' }),

    readManyRecipients: (conversationId: string) =>
      client.fetchList<ReadManyRecipientsData>(`messaging/conversations/${conversationId}/recipients`, { method: 'POST' }),

    addOneRecipient: (conversationId: string) =>
      client.fetch<AddOneRecipientData>(`messaging/conversations/${conversationId}/recipients/new`, { method: 'POST' }),

    addManyRecipients: (conversationId: string) =>
      client.fetchList<AddManyRecipientsData>(`messaging/conversations/${conversationId}/recipients/batch`, { method: 'POST' }),
  }
}
