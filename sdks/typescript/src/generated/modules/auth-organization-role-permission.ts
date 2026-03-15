import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type AssignOrgRolePermissionBody = operations['assignOrgRolePermission']['requestBody']['content']['application/json']
type AssignOrgRolePermissionData = NonNullable<operations['assignOrgRolePermission']['responses']['200']['content']['application/json']['data']>
type ListOrgRolePermissionsData = NonNullable<operations['listOrgRolePermissions']['responses']['200']['content']['application/json']['data']>[number]
type ListOrgRolePermissionsQuery = NonNullable<operations['listOrgRolePermissions']['parameters']['query']>

export function createAuthOrganizationRolePermissions(client: ConjoinClient) {
  return {
    assignOrgRolePermission: (organizationId: string, roleId: string, data: AssignOrgRolePermissionBody) =>
      client.fetch<AssignOrgRolePermissionData>(`auth/organization/role/permission/${organizationId}/${roleId}/assign`, { method: 'POST', body: data }),

    listOrgRolePermissions: (organizationId: string, roleId: string, query?: ListOrgRolePermissionsQuery) =>
      client.fetchList<ListOrgRolePermissionsData>(`auth/organization/role/permission/${organizationId}/${roleId}`, { query: query as Record<string, unknown> }),
  }
}
