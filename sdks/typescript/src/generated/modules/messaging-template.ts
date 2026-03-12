import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateMessageBody = operations['createMessageTemplate']['requestBody']['content']['application/json']
type CreateMessageData = NonNullable<
  operations['createMessageTemplate']['responses']['201']['content']['application/json']['data']
>
type ListMessageBody = operations['listMessageTemplates']['requestBody']['content']['application/json']
type ListMessageData = NonNullable<
  operations['listMessageTemplates']['responses']['200']['content']['application/json']['data']
>[number]
type DeleteMessageData = NonNullable<
  operations['deleteMessageTemplate']['responses']['200']['content']['application/json']['data']
>
type DeleteMessagesBody = operations['deleteMessageTemplates']['requestBody']['content']['application/json']
type DeleteMessagesResponse = operations['deleteMessageTemplates']['responses']['200']['content']['application/json']
type UpdateMessageBody = operations['updateMessageTemplate']['requestBody']['content']['application/json']
type UpdateMessageData = NonNullable<
  operations['updateMessageTemplate']['responses']['200']['content']['application/json']['data']
>

export function createMessagingTemplates(client: ConjoinClient) {
  return {
    createMessage: (data: CreateMessageBody) =>
      client.fetch<CreateMessageData>('messaging/templates/new', { method: 'POST', body: data }),

    listMessage: (templateId: string, data: ListMessageBody) =>
      client.fetchList<ListMessageData>(`messaging/templates/${templateId}`, { method: 'POST', body: data }),

    deleteMessage: (templateId: string) =>
      client.fetch<DeleteMessageData>(`messaging/templates/${templateId}`, { method: 'DELETE' }),

    deleteMessages: (data: DeleteMessagesBody) =>
      client.fetch<DeleteMessagesResponse>('messaging/templates/wipe', { method: 'PATCH', body: data }),

    updateMessage: (templateId: string, data: UpdateMessageBody) =>
      client.fetch<UpdateMessageData>(`messaging/templates/update/${templateId}`, { method: 'PATCH', body: data }),
  }
}
