import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type SendBody = operations['sendEmail']['requestBody']['content']['multipart/form-data']
type SendData = NonNullable<operations['sendEmail']['responses']['200']['content']['application/json']['data']>
type ReadMessagesBody = operations['readEmailMessages']['requestBody']['content']['application/json']
type ReadMessagesData = NonNullable<operations['readEmailMessages']['responses']['200']['content']['application/json']['data']>[number]
type GetSummaryBody = operations['getEmailSummary']['requestBody']['content']['application/json']
type GetSummaryData = NonNullable<operations['getEmailSummary']['responses']['200']['content']['application/json']['data']>

export function createMessagingEmails(client: ConjoinClient) {
  return {
    send: (data: SendBody) =>
      client.fetch<SendData>('messaging/email/send', { method: 'POST', body: data }),

    readMessages: (messageId: string, data: ReadMessagesBody) =>
      client.fetchList<ReadMessagesData>(`messaging/email/messages/${messageId}`, { method: 'POST', body: data }),

    getSummary: (data: GetSummaryBody) =>
      client.fetch<GetSummaryData>('messaging/email/summary', { body: data }),
  }
}
