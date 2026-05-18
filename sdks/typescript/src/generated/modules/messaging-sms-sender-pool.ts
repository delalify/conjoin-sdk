import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateSmsSenderPoolBody = operations['createSmsSenderPool']['requestBody']['content']['application/json']
type CreateSmsSenderPoolData = NonNullable<operations['createSmsSenderPool']['responses']['201']['content']['application/json']['data']>
type AddSmsSendersToPoolBody = operations['addSmsSendersToPool']['requestBody']['content']['application/json']
type AddSmsSendersToPoolData = NonNullable<operations['addSmsSendersToPool']['responses']['200']['content']['application/json']['data']>
type GetSmsSenderPoolData = NonNullable<operations['getSmsSenderPool']['responses']['200']['content']['application/json']['data']>
type DeleteSmsSenderPoolData = NonNullable<operations['deleteSmsSenderPool']['responses']['200']['content']['application/json']['data']>

export function createMessagingSMSSenderPools(client: ConjoinClient) {
  return {
    createSmsSenderPool: (data: CreateSmsSenderPoolBody) =>
      client.fetch<CreateSmsSenderPoolData>('messaging/sms/sender-pools/new', { method: 'POST', body: data }),

    addSmsSendersToPool: (poolId: string, data: AddSmsSendersToPoolBody) =>
      client.fetch<AddSmsSendersToPoolData>(`messaging/sms/sender-pools/${poolId}/senders`, { method: 'POST', body: data }),

    getSmsSenderPool: (poolId: string) =>
      client.fetch<GetSmsSenderPoolData>(`messaging/sms/sender-pools/${poolId}`),

    deleteSmsSenderPool: (poolId: string) =>
      client.fetch<DeleteSmsSenderPoolData>(`messaging/sms/sender-pools/${poolId}`, { method: 'DELETE' }),
  }
}
