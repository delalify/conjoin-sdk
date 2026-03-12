import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createVerification']['requestBody']['content']['application/json']
type CreateData = NonNullable<
  operations['createVerification']['responses']['200']['content']['application/json']['data']
>
type CheckBody = operations['checkVerification']['requestBody']['content']['application/json']
type CheckData = NonNullable<operations['checkVerification']['responses']['200']['content']['application/json']['data']>
type ResendBody = operations['resendVerification']['requestBody']['content']['application/json']
type ResendData = NonNullable<
  operations['resendVerification']['responses']['200']['content']['application/json']['data']
>
type ListMessagesBody = operations['listVerificationMessages']['requestBody']['content']['application/json']
type ListMessagesData = NonNullable<
  operations['listVerificationMessages']['responses']['200']['content']['application/json']['data']
>[number]
type ReadBody = operations['readVerification']['requestBody']['content']['application/json']
type ReadData = NonNullable<
  operations['readVerification']['responses']['200']['content']['application/json']['data']
>[number]

export function createMessagingVerifications(client: ConjoinClient) {
  return {
    create: (data: CreateBody) => client.fetch<CreateData>('messaging/otps/send', { method: 'POST', body: data }),

    check: (token: string, data: CheckBody) =>
      client.fetch<CheckData>(`messaging/otps/verify/${token}`, { method: 'PATCH', body: data }),

    resend: (verificationId: string, data: ResendBody) =>
      client.fetch<ResendData>(`messaging/otps/resend/${verificationId}`, { method: 'PATCH', body: data }),

    listMessages: (data: ListMessagesBody) =>
      client.fetchList<ListMessagesData>('messaging/otps/messages', { method: 'POST', body: data }),

    read: (verificationId: string, data: ReadBody) =>
      client.fetchList<ReadData>(`messaging/otps/${verificationId}`, { method: 'POST', body: data }),
  }
}
