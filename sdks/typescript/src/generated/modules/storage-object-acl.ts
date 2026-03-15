import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type GrantObjectAclBody = operations['grantStorageObjectAcl']['requestBody']['content']['application/json']
type GrantObjectAclData = NonNullable<
  operations['grantStorageObjectAcl']['responses']['200']['content']['application/json']['data']
>
type RevokeObjectAclBody = operations['revokeStorageObjectAcl']['requestBody']['content']['application/json']
type RevokeObjectAclData = NonNullable<
  operations['revokeStorageObjectAcl']['responses']['200']['content']['application/json']['data']
>
type SetObjectPublicBody = operations['setStorageObjectPublic']['requestBody']['content']['application/json']
type SetObjectPublicData = NonNullable<
  operations['setStorageObjectPublic']['responses']['200']['content']['application/json']['data']
>

export function createStorageObjectACLs(client: ConjoinClient) {
  return {
    grantObjectAcl: (containerNameOrId: string, objectNameOrId: string, data: GrantObjectAclBody) =>
      client.fetch<GrantObjectAclData>(`storage/storage-object-acl/grant/${containerNameOrId}/${objectNameOrId}`, {
        method: 'POST',
        body: data,
      }),

    revokeObjectAcl: (containerNameOrId: string, objectNameOrId: string, data: RevokeObjectAclBody) =>
      client.fetch<RevokeObjectAclData>(`storage/storage-object-acl/revoke/${containerNameOrId}/${objectNameOrId}`, {
        method: 'POST',
        body: data,
      }),

    setObjectPublic: (containerNameOrId: string, objectNameOrId: string, data: SetObjectPublicBody) =>
      client.fetch<SetObjectPublicData>(`storage/storage-object-acl/public/${containerNameOrId}/${objectNameOrId}`, {
        method: 'PATCH',
        body: data,
      }),
  }
}
