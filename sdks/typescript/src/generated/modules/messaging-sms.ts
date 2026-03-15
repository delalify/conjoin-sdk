import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type SendSmsBody = operations['sendSms']['requestBody']['content']['application/json']
type SendSmsData = NonNullable<operations['sendSms']['responses']['200']['content']['application/json']['data']>
type ReadSmsMessagesBody = operations['readSmsMessages']['requestBody']['content']['application/json']
type ReadSmsMessagesData = NonNullable<operations['readSmsMessages']['responses']['200']['content']['application/json']['data']>[number]
type GetSmsSummaryBody = operations['getSmsSummary']['requestBody']['content']['application/json']
type GetSmsSummaryData = NonNullable<operations['getSmsSummary']['responses']['200']['content']['application/json']['data']>

export function createMessagingSMs(client: ConjoinClient) {
  return {
    sendSms: (data: SendSmsBody) =>
      client.fetch<SendSmsData>('messaging/sms/send', { method: 'POST', body: data }),

    readSmsMessages: (messageId: string, data: ReadSmsMessagesBody) =>
      client.fetchList<ReadSmsMessagesData>(`messaging/sms/messages/${messageId}`, { method: 'POST', body: data }),

    getSmsSummary: (data: GetSmsSummaryBody) =>
      client.fetch<GetSmsSummaryData>('messaging/sms/summary', { body: data }),
  }
}
