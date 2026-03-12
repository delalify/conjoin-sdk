import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type AuthorizeActionBody = operations['authorizeAction']['requestBody']['content']['application/json']
type AuthorizeActionData = NonNullable<
  operations['authorizeAction']['responses']['200']['content']['application/json']['data']
>
type CheckRoleBody = operations['checkRole']['requestBody']['content']['application/json']
type CheckRoleData = NonNullable<operations['checkRole']['responses']['200']['content']['application/json']['data']>
type ReadEffectivePermissionsData = NonNullable<
  operations['readEffectivePermissions']['responses']['200']['content']['application/json']['data']
>
type RemoveRolePermissionBody = operations['removeRolePermission']['requestBody']['content']['application/json']
type RemoveRolePermissionData = NonNullable<
  operations['removeRolePermission']['responses']['200']['content']['application/json']['data']
>

export function createAuthAuthorizations(client: ConjoinClient) {
  return {
    authorizeAction: (appId: string, organizationId: string, data: AuthorizeActionBody) =>
      client.fetch<AuthorizeActionData>(`auth/authorization/${appId}/organization/${organizationId}/authorize`, {
        method: 'POST',
        body: data,
      }),

    checkRole: (appId: string, organizationId: string, data: CheckRoleBody) =>
      client.fetch<CheckRoleData>(`auth/authorization/${appId}/organization/${organizationId}/has-role`, {
        method: 'POST',
        body: data,
      }),

    readEffectivePermissions: (appId: string, organizationId: string, accountId: string) =>
      client.fetch<ReadEffectivePermissionsData>(
        `auth/authorization/${appId}/organization/${organizationId}/account/${accountId}/effective-permissions`,
      ),

    removeRolePermission: (appId: string, organizationId: string, roleId: string, data: RemoveRolePermissionBody) =>
      client.fetch<RemoveRolePermissionData>(
        `auth/authorization/${appId}/organization/${organizationId}/role/${roleId}/permission/remove`,
        { method: 'POST', body: data },
      ),
  }
}
