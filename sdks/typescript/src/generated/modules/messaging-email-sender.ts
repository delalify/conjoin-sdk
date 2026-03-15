import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type VerifyData = NonNullable<
  operations['verifyEmailSender']['responses']['200']['content']['application/json']['data']
>
type ListManyBody = operations['listManyEmailSenders']['requestBody']['content']['application/json']
type ListManyData = NonNullable<
  operations['listManyEmailSenders']['responses']['200']['content']['application/json']['data']
>[number]
type ListOneBody = operations['listOneEmailSender']['requestBody']['content']['application/json']
type ListOneData = NonNullable<
  operations['listOneEmailSender']['responses']['200']['content']['application/json']['data']
>
type DeleteBody = operations['deleteEmailSender']['requestBody']['content']['application/json']
type DeleteData = NonNullable<
  operations['deleteEmailSender']['responses']['200']['content']['application/json']['data']
>
type CreateBody = operations['createEmailSender']['requestBody']['content']['application/json']
type CreateData = NonNullable<
  operations['createEmailSender']['responses']['201']['content']['application/json']['data']
>
type EnableBody = operations['enableEmailSender']['requestBody']['content']['application/json']
type EnableData = NonNullable<
  operations['enableEmailSender']['responses']['200']['content']['application/json']['data']
>
type DisableBody = operations['disableEmailSender']['requestBody']['content']['application/json']
type DisableData = NonNullable<
  operations['disableEmailSender']['responses']['200']['content']['application/json']['data']
>
type TransferBody = operations['transferEmailSender']['requestBody']['content']['application/json']
type TransferData = NonNullable<
  operations['transferEmailSender']['responses']['200']['content']['application/json']['data']
>

export function createMessagingEmailSenders(client: ConjoinClient) {
  return {
    verify: (senderId: string) =>
      client.fetch<VerifyData>(`messaging/senders/email/verify/${senderId}`, { method: 'PATCH' }),

    listMany: (data: ListManyBody) =>
      client.fetchList<ListManyData>('messaging/senders/email/retrieve', { method: 'POST', body: data }),

    listOne: (sender: string, data: ListOneBody) =>
      client.fetch<ListOneData>(`messaging/senders/email/${sender}`, { body: data }),

    delete: (sender: string, data: DeleteBody) =>
      client.fetch<DeleteData>(`messaging/senders/email/${sender}`, { method: 'DELETE', body: data }),

    create: (data: CreateBody) =>
      client.fetch<CreateData>('messaging/senders/email/new', { method: 'POST', body: data }),

    enable: (sender: string, data: EnableBody) =>
      client.fetch<EnableData>(`messaging/senders/email/enable/${sender}`, { method: 'PATCH', body: data }),

    disable: (sender: string, data: DisableBody) =>
      client.fetch<DisableData>(`messaging/senders/email/disable/${sender}`, { method: 'PATCH', body: data }),

    transfer: (data: TransferBody) =>
      client.fetch<TransferData>('messaging/senders/email/transfers', { method: 'PATCH', body: data }),
  }
}
