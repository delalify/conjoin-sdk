import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<operations['listMessageAnalytics']['responses']['200']['content']['application/json']['data']>[number]
type GenerateSummariesData = NonNullable<operations['generateMessageAnalyticsSummaries']['responses']['201']['content']['application/json']['data']>
type CreateReportData = NonNullable<operations['createMessageAnalyticsReport']['responses']['200']['content']['application/json']['data']>

export function createMessagingMessageAnalytics(client: ConjoinClient) {
  return {
    list: () =>
      client.fetchList<ListData>('messaging/analytics/', { method: 'POST' }),

    generateSummaries: (channelId: string) =>
      client.fetch<GenerateSummariesData>(`messaging/analytics/channels/${channelId}/generate`, { method: 'POST' }),

    createReport: (messageId: string, channelId: string) =>
      client.fetch<CreateReportData>(`messaging/analytics/messages/${messageId}/channels/${channelId}/reports`, { method: 'POST' }),
  }
}
