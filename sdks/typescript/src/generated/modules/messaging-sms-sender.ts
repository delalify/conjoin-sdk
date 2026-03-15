import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateSmsSenderBody = operations['createSmsSender']['requestBody']['content']['application/json']
type CreateSmsSenderData = NonNullable<operations['createSmsSender']['responses']['201']['content']['application/json']['data']>
type DisableSmsSenderData = NonNullable<operations['disableSmsSender']['responses']['200']['content']['application/json']['data']>
type ReadSmsSenderData = NonNullable<operations['readSmsSender']['responses']['200']['content']['application/json']['data']>
type DeleteSmsSenderData = NonNullable<operations['deleteSmsSender']['responses']['200']['content']['application/json']['data']>

export function createMessagingSMSSenders(client: ConjoinClient) {
  return {
    createSmsSender: (data: CreateSmsSenderBody) =>
      client.fetch<CreateSmsSenderData>('messaging/senders/sms/new', { method: 'POST', body: data }),

    disableSmsSender: (senderId: string) =>
      client.fetch<DisableSmsSenderData>(`messaging/senders/sms/${senderId}/disable`, { method: 'PATCH' }),

    readSmsSender: (senderId: string) =>
      client.fetch<ReadSmsSenderData>(`messaging/senders/sms/${senderId}`),

    deleteSmsSender: (senderId: string) =>
      client.fetch<DeleteSmsSenderData>(`messaging/senders/sms/${senderId}`, { method: 'DELETE' }),
  }
}
