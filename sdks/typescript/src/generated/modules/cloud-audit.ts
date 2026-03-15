import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ReadLogsData = NonNullable<
  operations['readAuditLogs']['responses']['200']['content']['application/json']['data']
>[number]
type ReadLogsQuery = NonNullable<operations['readAuditLogs']['parameters']['query']>
type ReadStatsData = NonNullable<
  operations['readAuditStats']['responses']['200']['content']['application/json']['data']
>
type ReadStatsQuery = NonNullable<operations['readAuditStats']['parameters']['query']>

export function createCloudAudits(client: ConjoinClient) {
  return {
    readLogs: (query?: ReadLogsQuery) =>
      client.fetchList<ReadLogsData>('cloud/audit/logs', { query: query as Record<string, unknown> }),

    readStats: (query?: ReadStatsQuery) =>
      client.fetch<ReadStatsData>('cloud/audit/stats', { query: query as Record<string, unknown> }),
  }
}
