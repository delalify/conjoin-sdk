import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createAuthClient']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createAuthClient']['responses']['201']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readAuthClient']['responses']['200']['content']['application/json']['data']>
type ListData = NonNullable<
  operations['listAuthClients']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listAuthClients']['parameters']['query']>

export function createAuthClients(client: ConjoinClient) {
  return {
    create: (appId: string, data: CreateBody) =>
      client.fetch<CreateData>(`auth/client/${appId}/client/create`, { method: 'POST', body: data }),

    read: (appId: string, clientId: string) => client.fetch<ReadData>(`auth/client/${appId}/client/${clientId}`),

    list: (appId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`auth/client/${appId}/client`, { query: query as Record<string, unknown> }),
  }
}
