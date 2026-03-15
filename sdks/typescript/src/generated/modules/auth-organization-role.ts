import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateOrgRoleBody = operations['createOrgRole']['requestBody']['content']['application/json']
type CreateOrgRoleData = NonNullable<operations['createOrgRole']['responses']['201']['content']['application/json']['data']>
type ReadOrgRoleData = NonNullable<operations['readOrgRole']['responses']['200']['content']['application/json']['data']>
type ListOrgRolesData = NonNullable<operations['listOrgRoles']['responses']['200']['content']['application/json']['data']>[number]
type ListOrgRolesQuery = NonNullable<operations['listOrgRoles']['parameters']['query']>
type UpdateOrgRoleBody = operations['updateOrgRole']['requestBody']['content']['application/json']
type UpdateOrgRoleData = NonNullable<operations['updateOrgRole']['responses']['200']['content']['application/json']['data']>
type ArchiveOrgRoleData = NonNullable<operations['archiveOrgRole']['responses']['200']['content']['application/json']['data']>
type RestoreOrgRoleData = NonNullable<operations['restoreOrgRole']['responses']['200']['content']['application/json']['data']>
type DeleteOrgRoleData = NonNullable<operations['deleteOrgRole']['responses']['200']['content']['application/json']['data']>
type ReadOrgRolePermissionsData = NonNullable<operations['readOrgRolePermissions']['responses']['200']['content']['application/json']['data']>[number]

export function createAuthOrganizationRoles(client: ConjoinClient) {
  return {
    createOrgRole: (organizationId: string, data: CreateOrgRoleBody) =>
      client.fetch<CreateOrgRoleData>(`auth/organization/role/${organizationId}/create`, { method: 'POST', body: data }),

    readOrgRole: (organizationId: string, roleId: string) =>
      client.fetch<ReadOrgRoleData>(`auth/organization/role/${organizationId}/${roleId}`),

    listOrgRoles: (organizationId: string, query?: ListOrgRolesQuery) =>
      client.fetchList<ListOrgRolesData>(`auth/organization/role/${organizationId}`, { query: query as Record<string, unknown> }),

    updateOrgRole: (organizationId: string, roleId: string, data: UpdateOrgRoleBody) =>
      client.fetch<UpdateOrgRoleData>(`auth/organization/role/${organizationId}/${roleId}/update`, { method: 'PATCH', body: data }),

    archiveOrgRole: (organizationId: string, roleId: string) =>
      client.fetch<ArchiveOrgRoleData>(`auth/organization/role/${organizationId}/${roleId}/archive`, { method: 'PATCH' }),

    restoreOrgRole: (organizationId: string, roleId: string) =>
      client.fetch<RestoreOrgRoleData>(`auth/organization/role/${organizationId}/${roleId}/restore`, { method: 'PATCH' }),

    deleteOrgRole: (organizationId: string, roleId: string) =>
      client.fetch<DeleteOrgRoleData>(`auth/organization/role/${organizationId}/${roleId}/delete`, { method: 'DELETE' }),

    readOrgRolePermissions: (organizationId: string, roleId: string) =>
      client.fetchList<ReadOrgRolePermissionsData>(`auth/organization/role/${organizationId}/${roleId}/permissions`),
  }
}
