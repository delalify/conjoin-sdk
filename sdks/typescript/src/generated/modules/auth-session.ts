import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ReadData = NonNullable<operations['readAuthSession']['responses']['200']['content']['application/json']['data']>
type ListData = NonNullable<operations['listAuthSessions']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listAuthSessions']['parameters']['query']>
type CountData = NonNullable<operations['countAuthSessions']['responses']['200']['content']['application/json']['data']>
type CountQuery = NonNullable<operations['countAuthSessions']['parameters']['query']>
type UpdateBody = operations['updateAuthSession']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateAuthSession']['responses']['200']['content']['application/json']['data']>
type RefreshBody = operations['refreshAuthSession']['requestBody']['content']['application/json']
type RefreshData = NonNullable<operations['refreshAuthSession']['responses']['200']['content']['application/json']['data']>
type ValidateBody = operations['validateAuthSession']['requestBody']['content']['application/json']
type ValidateData = NonNullable<operations['validateAuthSession']['responses']['200']['content']['application/json']['data']>
type RevokeBody = operations['revokeAuthSession']['requestBody']['content']['application/json']
type RevokeData = NonNullable<operations['revokeAuthSession']['responses']['200']['content']['application/json']['data']>
type RevokeAllForAccountBody = operations['revokeAllAuthSessionsForAccount']['requestBody']['content']['application/json']
type RevokeAllForAccountData = NonNullable<operations['revokeAllAuthSessionsForAccount']['responses']['200']['content']['application/json']['data']>
type BulkRevokeAccountBody = operations['bulkRevokeAccountSessions']['requestBody']['content']['application/json']
type BulkRevokeAccountData = NonNullable<operations['bulkRevokeAccountSessions']['responses']['200']['content']['application/json']['data']>
type BulkRevokeClientBody = operations['bulkRevokeClientSessions']['requestBody']['content']['application/json']
type BulkRevokeClientData = NonNullable<operations['bulkRevokeClientSessions']['responses']['200']['content']['application/json']['data']>
type ListByAccountData = NonNullable<operations['listSessionsByAccount']['responses']['200']['content']['application/json']['data']>[number]
type ListByAccountQuery = NonNullable<operations['listSessionsByAccount']['parameters']['query']>
type ListByClientData = NonNullable<operations['listSessionsByClient']['responses']['200']['content']['application/json']['data']>[number]
type ListByClientQuery = NonNullable<operations['listSessionsByClient']['parameters']['query']>
type GetActiveCountData = NonNullable<operations['getActiveSessionCount']['responses']['200']['content']['application/json']['data']>
type GetActiveCountQuery = NonNullable<operations['getActiveSessionCount']['parameters']['query']>
type GetActiveClientCountData = NonNullable<operations['getActiveClientSessionCount']['responses']['200']['content']['application/json']['data']>
type GetActiveClientCountQuery = NonNullable<operations['getActiveClientSessionCount']['parameters']['query']>
type GetAnalyticsData = NonNullable<operations['getSessionAnalytics']['responses']['200']['content']['application/json']['data']>
type GetAnalyticsQuery = NonNullable<operations['getSessionAnalytics']['parameters']['query']>

export function createAuthSessions(client: ConjoinClient) {
  return {
    read: (appId: string, sessionId: string) =>
      client.fetch<ReadData>(`auth/session/${appId}/session/${sessionId}`),

    list: (clientId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`auth/session/client/${clientId}/sessions`, { query: query as Record<string, unknown> }),

    count: (query?: CountQuery) =>
      client.fetch<CountData>('auth/session/session/count', { query: query as Record<string, unknown> }),

    update: (appId: string, sessionId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`auth/session/${appId}/session/${sessionId}/update`, { method: 'PATCH', body: data }),

    refresh: (appId: string, sessionId: string, data: RefreshBody) =>
      client.fetch<RefreshData>(`auth/session/${appId}/session/${sessionId}/refresh`, { method: 'POST', body: data }),

    validate: (appId: string, sessionId: string, data: ValidateBody) =>
      client.fetch<ValidateData>(`auth/session/${appId}/session/${sessionId}/validate`, { method: 'POST', body: data }),

    revoke: (appId: string, clientId: string, sessionId: string, data: RevokeBody) =>
      client.fetch<RevokeData>(`auth/session/${appId}/client/${clientId}/session/${sessionId}/revoke`, { method: 'POST', body: data }),

    revokeAllForAccount: (appId: string, accountId: string, data: RevokeAllForAccountBody) =>
      client.fetch<RevokeAllForAccountData>(`auth/session/${appId}/account/${accountId}/sessions/revoke`, { method: 'POST', body: data }),

    bulkRevokeAccount: (accountId: string, data: BulkRevokeAccountBody) =>
      client.fetch<BulkRevokeAccountData>(`auth/session/account/${accountId}/sessions/revoke/bulk`, { method: 'POST', body: data }),

    bulkRevokeClient: (clientId: string, data: BulkRevokeClientBody) =>
      client.fetch<BulkRevokeClientData>(`auth/session/client/${clientId}/sessions/revoke/bulk`, { method: 'POST', body: data }),

    listByAccount: (query?: ListByAccountQuery) =>
      client.fetchList<ListByAccountData>('auth/session/sessions/account', { query: query as Record<string, unknown> }),

    listByClient: (query?: ListByClientQuery) =>
      client.fetchList<ListByClientData>('auth/session/sessions/client', { query: query as Record<string, unknown> }),

    getActiveCount: (query?: GetActiveCountQuery) =>
      client.fetch<GetActiveCountData>('auth/session/session/active/count', { query: query as Record<string, unknown> }),

    getActiveClientCount: (query?: GetActiveClientCountQuery) =>
      client.fetch<GetActiveClientCountData>('auth/session/session/active/client-count', { query: query as Record<string, unknown> }),

    getAnalytics: (query?: GetAnalyticsQuery) =>
      client.fetch<GetAnalyticsData>('auth/session/session/analytics', { query: query as Record<string, unknown> }),
  }
}
