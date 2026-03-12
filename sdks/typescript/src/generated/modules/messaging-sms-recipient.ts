import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListSmsRecipientsBody = operations['listSmsRecipients']['requestBody']['content']['application/json']
type ListSmsRecipientsData = NonNullable<
  operations['listSmsRecipients']['responses']['200']['content']['application/json']['data']
>[number]

export function createMessagingSMSRecipients(client: ConjoinClient) {
  return {
    listSmsRecipients: (messageId: string, data: ListSmsRecipientsBody) =>
      client.fetchList<ListSmsRecipientsData>(`messaging/sms/messages/${messageId}/recipients`, {
        method: 'POST',
        body: data,
      }),
  }
}
