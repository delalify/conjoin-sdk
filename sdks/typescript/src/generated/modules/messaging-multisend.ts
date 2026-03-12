import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createMultisend']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createMultisend']['responses']['200']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readMultisend']['responses']['200']['content']['application/json']['data']>

export function createMessagingMultisends(client: ConjoinClient) {
  return {
    create: (data: CreateBody) => client.fetch<CreateData>('messaging/multisend/send', { method: 'POST', body: data }),

    read: (messageId: string) => client.fetch<ReadData>(`messaging/multisend/${messageId}`),
  }
}
