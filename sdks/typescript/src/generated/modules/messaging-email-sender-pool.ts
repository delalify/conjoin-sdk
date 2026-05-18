import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createEmailSenderPool']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createEmailSenderPool']['responses']['201']['content']['application/json']['data']>
type AddEmailSendersToPoolBody = operations['addEmailSendersToPool']['requestBody']['content']['application/json']
type AddEmailSendersToPoolData = NonNullable<operations['addEmailSendersToPool']['responses']['200']['content']['application/json']['data']>
type GetData = NonNullable<operations['getEmailSenderPool']['responses']['200']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deleteEmailSenderPool']['responses']['200']['content']['application/json']['data']>

export function createMessagingEmailSenderPools(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('messaging/email/sender-pools/new', { method: 'POST', body: data }),

    addEmailSendersToPool: (poolId: string, data: AddEmailSendersToPoolBody) =>
      client.fetch<AddEmailSendersToPoolData>(`messaging/email/sender-pools/${poolId}/senders`, { method: 'POST', body: data }),

    get: (poolId: string) =>
      client.fetch<GetData>(`messaging/email/sender-pools/${poolId}`),

    delete: (poolId: string) =>
      client.fetch<DeleteData>(`messaging/email/sender-pools/${poolId}`, { method: 'DELETE' }),
  }
}
