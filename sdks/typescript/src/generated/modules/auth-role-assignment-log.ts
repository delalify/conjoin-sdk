import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<operations['listRoleAssignmentLogs']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listRoleAssignmentLogs']['parameters']['query']>

export function createAuthRoleAssignmentLogs(client: ConjoinClient) {
  return {
    list: (appId: string, organizationId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`auth/organization/role-assignment-log/${appId}/organization/${organizationId}/role-assignment-logs`, { query: query as Record<string, unknown> }),
  }
}
