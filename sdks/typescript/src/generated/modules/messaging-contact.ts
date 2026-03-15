import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createContact']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createContact']['responses']['201']['content']['application/json']['data']>
type SuppressMessagesBody = operations['suppressContactMessages']['requestBody']['content']['application/json']
type SuppressMessagesData = NonNullable<operations['suppressContactMessages']['responses']['200']['content']['application/json']['data']>
type UpdateBody = operations['updateContact']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateContact']['responses']['200']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deleteContact']['responses']['200']['content']['application/json']['data']>
type ListBody = operations['listContacts']['requestBody']['content']['application/json']
type ListData = NonNullable<operations['listContacts']['responses']['200']['content']['application/json']['data']>[number]

export function createMessagingContacts(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('messaging/contacts/new', { method: 'POST', body: data }),

    suppressMessages: (contactId: string, data: SuppressMessagesBody) =>
      client.fetch<SuppressMessagesData>(`messaging/contacts/${contactId}/unsubscribe`, { method: 'PATCH', body: data }),

    update: (contactId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`messaging/contacts/${contactId}`, { method: 'PATCH', body: data }),

    delete: (contactId: string) =>
      client.fetch<DeleteData>(`messaging/contacts/${contactId}`, { method: 'DELETE' }),

    list: (data: ListBody) =>
      client.fetchList<ListData>('messaging/contacts', { method: 'POST', body: data }),
  }
}
