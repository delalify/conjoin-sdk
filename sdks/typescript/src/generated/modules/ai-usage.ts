import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListRecordsData = NonNullable<
  operations['listAiUsageRecords']['responses']['200']['content']['application/json']['data']
>[number]
type ListRecordsQuery = NonNullable<operations['listAiUsageRecords']['parameters']['query']>
type ReadSummaryData = NonNullable<
  operations['readAiUsageSummary']['responses']['200']['content']['application/json']['data']
>
type ReadSummaryQuery = NonNullable<operations['readAiUsageSummary']['parameters']['query']>

export function createAiUsages(client: ConjoinClient) {
  return {
    listRecords: (query?: ListRecordsQuery) =>
      client.fetchList<ListRecordsData>('ai/usage/usage/records', { query: query as Record<string, unknown> }),

    readSummary: (query?: ReadSummaryQuery) =>
      client.fetch<ReadSummaryData>('ai/usage/usage/summary', { query: query as Record<string, unknown> }),
  }
}
