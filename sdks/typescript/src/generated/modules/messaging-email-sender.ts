import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type VerifyData = NonNullable<operations['verifyEmailSender']['responses']['200']['content']['application/json']['data']>
type ListManyBody = operations['listManyEmailSenders']['requestBody']['content']['application/json']
type ListManyData = NonNullable<operations['listManyEmailSenders']['responses']['200']['content']['application/json']['data']>[number]
type ListOneBody = operations['listOneEmailSender']['requestBody']['content']['application/json']
type ListOneData = NonNullable<operations['listOneEmailSender']['responses']['200']['content']['application/json']['data']>
type DeleteBody = operations['deleteEmailSender']['requestBody']['content']['application/json']
type DeleteData = NonNullable<operations['deleteEmailSender']['responses']['200']['content']['application/json']['data']>
type CreateBody = operations['createEmailSender']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createEmailSender']['responses']['201']['content']['application/json']['data']>
type EnableBody = operations['enableEmailSender']['requestBody']['content']['application/json']
type EnableData = NonNullable<operations['enableEmailSender']['responses']['200']['content']['application/json']['data']>
type DisableBody = operations['disableEmailSender']['requestBody']['content']['application/json']
type DisableData = NonNullable<operations['disableEmailSender']['responses']['200']['content']['application/json']['data']>
type TransferData = NonNullable<operations['transferEmailSender']['responses']['200']['content']['application/json']['data']>

export function createMessagingEmailSenders(client: ConjoinClient) {
  return {
    verify: (senderId: string) =>
      client.fetch<VerifyData>(`messaging/email/senders/verify/${senderId}`, { method: 'PATCH' }),

    listMany: (data: ListManyBody) =>
      client.fetchList<ListManyData>('messaging/email/senders/retrieve', { method: 'POST', body: data }),

    listOne: (senderId: string, data: ListOneBody) =>
      client.fetch<ListOneData>(`messaging/email/senders/${senderId}`, { body: data }),

    delete: (senderId: string, data: DeleteBody) =>
      client.fetch<DeleteData>(`messaging/email/senders/${senderId}`, { method: 'DELETE', body: data }),

    create: (data: CreateBody) =>
      client.fetch<CreateData>('messaging/email/senders/new', { method: 'POST', body: data }),

    enable: (senderId: string, data: EnableBody) =>
      client.fetch<EnableData>(`messaging/email/senders/enable/${senderId}`, { method: 'PATCH', body: data }),

    disable: (senderId: string, data: DisableBody) =>
      client.fetch<DisableData>(`messaging/email/senders/disable/${senderId}`, { method: 'PATCH', body: data }),

    transfer: (senderId: string, projectId: string) =>
      client.fetch<TransferData>(`messaging/email/senders/transfers/${senderId}/${projectId}`, { method: 'PATCH' }),
  }
}
