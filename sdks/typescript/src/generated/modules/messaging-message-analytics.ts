import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<
  operations['listMessageAnalytics']['responses']['200']['content']['application/json']['data']
>[number]
type GenerateSummaryData = NonNullable<
  operations['generateMessageAnalyticsSummary']['responses']['201']['content']['application/json']['data']
>
type CreateReportData = NonNullable<
  operations['createMessageAnalyticsReport']['responses']['200']['content']['application/json']['data']
>

export function createMessagingMessageAnalytics(client: ConjoinClient) {
  return {
    list: () => client.fetchList<ListData>('messaging/analytics/', { method: 'POST' }),

    generateSummary: (channelId: string) =>
      client.fetch<GenerateSummaryData>(`messaging/analytics/channels/${channelId}/generate`, { method: 'POST' }),

    createReport: (messageId: string, channelId: string) =>
      client.fetch<CreateReportData>(`messaging/analytics/messages/${messageId}/channels/${channelId}/reports`, {
        method: 'POST',
      }),
  }
}
