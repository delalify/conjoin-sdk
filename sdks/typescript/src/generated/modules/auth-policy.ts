import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createPolicy']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createPolicy']['responses']['201']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readPolicy']['responses']['200']['content']['application/json']['data']>
type ListData = NonNullable<operations['listPolicies']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listPolicies']['parameters']['query']>
type UpdateBody = operations['updatePolicy']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updatePolicy']['responses']['200']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deletePolicy']['responses']['200']['content']['application/json']['data']>

export function createAuthPolicies(client: ConjoinClient) {
  return {
    create: (appId: string, organizationId: string, data: CreateBody) =>
      client.fetch<CreateData>(`auth/organization/policy/${appId}/organization/${organizationId}/policy/create`, { method: 'POST', body: data }),

    read: (appId: string, organizationId: string, policyId: string) =>
      client.fetch<ReadData>(`auth/organization/policy/${appId}/organization/${organizationId}/policy/${policyId}`),

    list: (appId: string, organizationId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`auth/organization/policy/${appId}/organization/${organizationId}/policy`, { query: query as Record<string, unknown> }),

    update: (appId: string, organizationId: string, policyId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`auth/organization/policy/${appId}/organization/${organizationId}/policy/${policyId}/update`, { method: 'PATCH', body: data }),

    delete: (appId: string, organizationId: string, policyId: string) =>
      client.fetch<DeleteData>(`auth/organization/policy/${appId}/organization/${organizationId}/policy/${policyId}/delete`, { method: 'POST' }),
  }
}
