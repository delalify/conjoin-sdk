import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ScimGetServiceProviderConfigResponse =
  operations['scimGetServiceProviderConfig']['responses']['200']['content']['application/json']
type ScimGetSchemasResponse = operations['scimGetSchemas']['responses']['200']['content']['application/json']
type ScimGetResourceTypesResponse =
  operations['scimGetResourceTypes']['responses']['200']['content']['application/json']
type ScimListUsersResponse = operations['scimListUsers']['responses']['200']['content']['application/json']
type ScimCreateUserBody = operations['scimCreateUser']['requestBody']['content']['application/json']
type ScimCreateUserResponse = operations['scimCreateUser']['responses']['201']['content']['application/json']
type ScimGetUserResponse = operations['scimGetUser']['responses']['200']['content']['application/json']
type ScimReplaceUserBody = operations['scimReplaceUser']['requestBody']['content']['application/json']
type ScimReplaceUserResponse = operations['scimReplaceUser']['responses']['200']['content']['application/json']
type ScimPatchUserResponse = operations['scimPatchUser']['responses']['200']['content']['application/json']
type ScimDeactivateUserResponse = operations['scimDeactivateUser']['responses']['204']['content']['application/json']
type ScimListGroupsResponse = operations['scimListGroups']['responses']['200']['content']['application/json']
type ScimCreateGroupBody = operations['scimCreateGroup']['requestBody']['content']['application/json']
type ScimCreateGroupResponse = operations['scimCreateGroup']['responses']['201']['content']['application/json']
type ScimGetGroupResponse = operations['scimGetGroup']['responses']['200']['content']['application/json']
type ScimReplaceGroupBody = operations['scimReplaceGroup']['requestBody']['content']['application/json']
type ScimReplaceGroupResponse = operations['scimReplaceGroup']['responses']['200']['content']['application/json']
type ScimPatchGroupMembersResponse =
  operations['scimPatchGroupMembers']['responses']['200']['content']['application/json']
type ScimDeleteGroupResponse = operations['scimDeleteGroup']['responses']['204']['content']['application/json']
type ScimBulkOperationsResponse = operations['scimBulkOperations']['responses']['200']['content']['application/json']

export function createAuthSCIMs(client: ConjoinClient) {
  return {
    scimGetServiceProviderConfig: () =>
      client.fetch<ScimGetServiceProviderConfigResponse>('auth/scim/v2/ServiceProviderConfig'),

    scimGetSchemas: () => client.fetch<ScimGetSchemasResponse>('auth/scim/v2/Schemas'),

    scimGetResourceTypes: () => client.fetch<ScimGetResourceTypesResponse>('auth/scim/v2/ResourceTypes'),

    scimListUsers: (projectId: string, appId: string) =>
      client.fetch<ScimListUsersResponse>(`auth/scim/v2/${projectId}/${appId}/Users`),

    scimCreateUser: (projectId: string, appId: string, data: ScimCreateUserBody) =>
      client.fetch<ScimCreateUserResponse>(`auth/scim/v2/${projectId}/${appId}/Users`, { method: 'POST', body: data }),

    scimGetUser: (projectId: string, appId: string, id: string) =>
      client.fetch<ScimGetUserResponse>(`auth/scim/v2/${projectId}/${appId}/Users/${id}`),

    scimReplaceUser: (projectId: string, appId: string, id: string, data: ScimReplaceUserBody) =>
      client.fetch<ScimReplaceUserResponse>(`auth/scim/v2/${projectId}/${appId}/Users/${id}`, {
        method: 'PUT',
        body: data,
      }),

    scimPatchUser: (projectId: string, appId: string, id: string) =>
      client.fetch<ScimPatchUserResponse>(`auth/scim/v2/${projectId}/${appId}/Users/${id}`, { method: 'PATCH' }),

    scimDeactivateUser: (projectId: string, appId: string, id: string) =>
      client.fetch<ScimDeactivateUserResponse>(`auth/scim/v2/${projectId}/${appId}/Users/${id}`, { method: 'DELETE' }),

    scimListGroups: (projectId: string, appId: string) =>
      client.fetch<ScimListGroupsResponse>(`auth/scim/v2/${projectId}/${appId}/Groups`),

    scimCreateGroup: (projectId: string, appId: string, data: ScimCreateGroupBody) =>
      client.fetch<ScimCreateGroupResponse>(`auth/scim/v2/${projectId}/${appId}/Groups`, {
        method: 'POST',
        body: data,
      }),

    scimGetGroup: (projectId: string, appId: string, id: string) =>
      client.fetch<ScimGetGroupResponse>(`auth/scim/v2/${projectId}/${appId}/Groups/${id}`),

    scimReplaceGroup: (projectId: string, appId: string, id: string, data: ScimReplaceGroupBody) =>
      client.fetch<ScimReplaceGroupResponse>(`auth/scim/v2/${projectId}/${appId}/Groups/${id}`, {
        method: 'PUT',
        body: data,
      }),

    scimPatchGroupMembers: (projectId: string, appId: string, id: string) =>
      client.fetch<ScimPatchGroupMembersResponse>(`auth/scim/v2/${projectId}/${appId}/Groups/${id}`, {
        method: 'PATCH',
      }),

    scimDeleteGroup: (projectId: string, appId: string, id: string) =>
      client.fetch<ScimDeleteGroupResponse>(`auth/scim/v2/${projectId}/${appId}/Groups/${id}`, { method: 'DELETE' }),

    scimBulkOperations: (projectId: string, appId: string) =>
      client.fetch<ScimBulkOperationsResponse>(`auth/scim/v2/${projectId}/${appId}/Bulk`, { method: 'POST' }),
  }
}
