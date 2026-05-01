import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListBody = operations['listEmailRecipients']['requestBody']['content']['application/json']
type ListData = NonNullable<operations['listEmailRecipients']['responses']['200']['content']['application/json']['data']>[number]

export function createMessagingEmailRecipients(client: ConjoinClient) {
  return {
    list: (messageId: string, data: ListBody) =>
      client.fetchList<ListData>(`messaging/email/messages/${messageId}/recipients`, { method: 'POST', body: data }),
  }
}
