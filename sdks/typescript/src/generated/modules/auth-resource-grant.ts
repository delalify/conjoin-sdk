import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type GrantResourcePermissionBody = operations['grantResourcePermission']['requestBody']['content']['application/json']
type GrantResourcePermissionData = NonNullable<
  operations['grantResourcePermission']['responses']['201']['content']['application/json']['data']
>
type RevokeResourcePermissionBody = operations['revokeResourcePermission']['requestBody']['content']['application/json']
type RevokeResourcePermissionData = NonNullable<
  operations['revokeResourcePermission']['responses']['200']['content']['application/json']['data']
>
type CheckResourcePermissionBody = operations['checkResourcePermission']['requestBody']['content']['application/json']
type CheckResourcePermissionData = NonNullable<
  operations['checkResourcePermission']['responses']['200']['content']['application/json']['data']
>
type ListData = NonNullable<
  operations['listResourceGrants']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listResourceGrants']['parameters']['query']>

export function createAuthResourceGrants(client: ConjoinClient) {
  return {
    grantResourcePermission: (
      appId: string,
      organizationId: string,
      accountId: string,
      data: GrantResourcePermissionBody,
    ) =>
      client.fetch<GrantResourcePermissionData>(
        `auth/organization/resource-grant/${appId}/organization/${organizationId}/account/${accountId}/resource-grants/grant`,
        { method: 'POST', body: data },
      ),

    revokeResourcePermission: (
      appId: string,
      organizationId: string,
      accountId: string,
      data: RevokeResourcePermissionBody,
    ) =>
      client.fetch<RevokeResourcePermissionData>(
        `auth/organization/resource-grant/${appId}/organization/${organizationId}/account/${accountId}/resource-grants/revoke`,
        { method: 'POST', body: data },
      ),

    checkResourcePermission: (
      appId: string,
      organizationId: string,
      accountId: string,
      data: CheckResourcePermissionBody,
    ) =>
      client.fetch<CheckResourcePermissionData>(
        `auth/organization/resource-grant/${appId}/organization/${organizationId}/account/${accountId}/resource-grants/check`,
        { method: 'POST', body: data },
      ),

    list: (appId: string, organizationId: string, query?: ListQuery) =>
      client.fetchList<ListData>(
        `auth/organization/resource-grant/${appId}/organization/${organizationId}/resource-grants`,
        { query: query as Record<string, unknown> },
      ),
  }
}
