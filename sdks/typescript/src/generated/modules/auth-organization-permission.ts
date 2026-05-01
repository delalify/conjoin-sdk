import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateOrgPermissionBody = operations['createOrgPermission']['requestBody']['content']['application/json']
type CreateOrgPermissionData = NonNullable<operations['createOrgPermission']['responses']['201']['content']['application/json']['data']>
type ReadOrgPermissionData = NonNullable<operations['readOrgPermission']['responses']['200']['content']['application/json']['data']>
type ListOrgPermissionsData = NonNullable<operations['listOrgPermissions']['responses']['200']['content']['application/json']['data']>[number]
type ListOrgPermissionsQuery = NonNullable<operations['listOrgPermissions']['parameters']['query']>
type UpdateOrgPermissionBody = operations['updateOrgPermission']['requestBody']['content']['application/json']
type UpdateOrgPermissionData = NonNullable<operations['updateOrgPermission']['responses']['200']['content']['application/json']['data']>
type ArchiveOrgPermissionData = NonNullable<operations['archiveOrgPermission']['responses']['200']['content']['application/json']['data']>
type RestoreOrgPermissionData = NonNullable<operations['restoreOrgPermission']['responses']['200']['content']['application/json']['data']>
type DeleteOrgPermissionData = NonNullable<operations['deleteOrgPermission']['responses']['200']['content']['application/json']['data']>

export function createAuthOrganizationPermissions(client: ConjoinClient) {
  return {
    createOrgPermission: (organizationId: string, data: CreateOrgPermissionBody) =>
      client.fetch<CreateOrgPermissionData>(`auth/organization/permission/${organizationId}/create`, { method: 'POST', body: data }),

    readOrgPermission: (organizationId: string, permissionId: string) =>
      client.fetch<ReadOrgPermissionData>(`auth/organization/permission/${organizationId}/${permissionId}`),

    listOrgPermissions: (organizationId: string, query?: ListOrgPermissionsQuery) =>
      client.fetchList<ListOrgPermissionsData>(`auth/organization/permission/${organizationId}`, { query: query as Record<string, unknown> }),

    updateOrgPermission: (organizationId: string, permissionId: string, data: UpdateOrgPermissionBody) =>
      client.fetch<UpdateOrgPermissionData>(`auth/organization/permission/${organizationId}/${permissionId}/update`, { method: 'PATCH', body: data }),

    archiveOrgPermission: (organizationId: string, permissionId: string) =>
      client.fetch<ArchiveOrgPermissionData>(`auth/organization/permission/${organizationId}/${permissionId}/archive`, { method: 'PATCH' }),

    restoreOrgPermission: (organizationId: string, permissionId: string) =>
      client.fetch<RestoreOrgPermissionData>(`auth/organization/permission/${organizationId}/${permissionId}/restore`, { method: 'PATCH' }),

    deleteOrgPermission: (organizationId: string, permissionId: string) =>
      client.fetch<DeleteOrgPermissionData>(`auth/organization/permission/${organizationId}/${permissionId}/delete`, { method: 'DELETE' }),
  }
}
