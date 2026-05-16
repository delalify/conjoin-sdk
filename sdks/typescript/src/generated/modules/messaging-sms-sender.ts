import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateSmsSenderBody = operations['createSmsSender']['requestBody']['content']['application/json']
type CreateSmsSenderData = NonNullable<operations['createSmsSender']['responses']['201']['content']['application/json']['data']>
type EnableSmsSenderData = NonNullable<operations['enableSmsSender']['responses']['200']['content']['application/json']['data']>
type DisableSmsSenderData = NonNullable<operations['disableSmsSender']['responses']['200']['content']['application/json']['data']>
type ListSmsSenderData = NonNullable<operations['listSmsSender']['responses']['200']['content']['application/json']['data']>
type DeleteSmsSenderData = NonNullable<operations['deleteSmsSender']['responses']['200']['content']['application/json']['data']>
type UpdateOneSmsSenderData = NonNullable<operations['updateOneSmsSender']['responses']['200']['content']['application/json']['data']>
type TransferSmsSenderData = NonNullable<operations['transferSmsSender']['responses']['200']['content']['application/json']['data']>

export function createMessagingSMSSenders(client: ConjoinClient) {
  return {
    createSmsSender: (data: CreateSmsSenderBody) =>
      client.fetch<CreateSmsSenderData>('messaging/sms/senders/new', { method: 'POST', body: data }),

    enableSmsSender: (senderId: string) =>
      client.fetch<EnableSmsSenderData>(`messaging/sms/senders/${senderId}/enable`, { method: 'PATCH' }),

    disableSmsSender: (senderId: string) =>
      client.fetch<DisableSmsSenderData>(`messaging/sms/senders/${senderId}/disable`, { method: 'PATCH' }),

    listSmsSender: (senderId: string) =>
      client.fetch<ListSmsSenderData>(`messaging/sms/senders/${senderId}`),

    deleteSmsSender: (senderId: string) =>
      client.fetch<DeleteSmsSenderData>(`messaging/sms/senders/${senderId}`, { method: 'DELETE' }),

    updateOneSmsSender: (senderId: string) =>
      client.fetch<UpdateOneSmsSenderData>(`messaging/sms/senders/${senderId}`, { method: 'PATCH' }),

    transferSmsSender: (senderId: string, projectId: string) =>
      client.fetch<TransferSmsSenderData>(`messaging/sms/senders/transfers/${senderId}/${projectId}`, { method: 'PATCH' }),
  }
}
