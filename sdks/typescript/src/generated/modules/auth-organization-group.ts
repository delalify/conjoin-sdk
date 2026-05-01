import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateGroupBody = operations['createGroup']['requestBody']['content']['application/json']
type CreateGroupData = NonNullable<operations['createGroup']['responses']['201']['content']['application/json']['data']>
type ListGroupsData = NonNullable<operations['listGroups']['responses']['200']['content']['application/json']['data']>[number]
type ListGroupsQuery = NonNullable<operations['listGroups']['parameters']['query']>
type UpdateGroupBody = operations['updateGroup']['requestBody']['content']['application/json']
type UpdateGroupData = NonNullable<operations['updateGroup']['responses']['200']['content']['application/json']['data']>
type DeleteGroupData = NonNullable<operations['deleteGroup']['responses']['200']['content']['application/json']['data']>
type AddGroupMemberBody = operations['addGroupMember']['requestBody']['content']['application/json']
type AddGroupMemberData = NonNullable<operations['addGroupMember']['responses']['200']['content']['application/json']['data']>
type RemoveGroupMemberBody = operations['removeGroupMember']['requestBody']['content']['application/json']
type RemoveGroupMemberData = NonNullable<operations['removeGroupMember']['responses']['200']['content']['application/json']['data']>
type ListGroupMembersData = NonNullable<operations['listGroupMembers']['responses']['200']['content']['application/json']['data']>[number]
type ListGroupMembersQuery = NonNullable<operations['listGroupMembers']['parameters']['query']>
type BulkSyncGroupMembersBody = operations['bulkSyncGroupMembers']['requestBody']['content']['application/json']
type BulkSyncGroupMembersData = NonNullable<operations['bulkSyncGroupMembers']['responses']['200']['content']['application/json']['data']>

export function createAuthOrganizationGroups(client: ConjoinClient) {
  return {
    createGroup: (appId: string, organizationId: string, data: CreateGroupBody) =>
      client.fetch<CreateGroupData>(`auth/organization/group/${appId}/organization/${organizationId}/group/create`, { method: 'POST', body: data }),

    listGroups: (appId: string, organizationId: string, query?: ListGroupsQuery) =>
      client.fetchList<ListGroupsData>(`auth/organization/group/${appId}/organization/${organizationId}/group/list`, { query: query as Record<string, unknown> }),

    updateGroup: (appId: string, organizationId: string, groupId: string, data: UpdateGroupBody) =>
      client.fetch<UpdateGroupData>(`auth/organization/group/${appId}/organization/${organizationId}/group/${groupId}/update`, { method: 'PATCH', body: data }),

    deleteGroup: (appId: string, organizationId: string, groupId: string) =>
      client.fetch<DeleteGroupData>(`auth/organization/group/${appId}/organization/${organizationId}/group/${groupId}/delete`, { method: 'DELETE' }),

    addGroupMember: (appId: string, organizationId: string, groupId: string, data: AddGroupMemberBody) =>
      client.fetch<AddGroupMemberData>(`auth/organization/group/${appId}/organization/${organizationId}/group/${groupId}/member/add`, { method: 'POST', body: data }),

    removeGroupMember: (appId: string, organizationId: string, groupId: string, data: RemoveGroupMemberBody) =>
      client.fetch<RemoveGroupMemberData>(`auth/organization/group/${appId}/organization/${organizationId}/group/${groupId}/member/remove`, { method: 'POST', body: data }),

    listGroupMembers: (appId: string, organizationId: string, groupId: string, query?: ListGroupMembersQuery) =>
      client.fetchList<ListGroupMembersData>(`auth/organization/group/${appId}/organization/${organizationId}/group/${groupId}/member/list`, { query: query as Record<string, unknown> }),

    bulkSyncGroupMembers: (appId: string, organizationId: string, groupId: string, data: BulkSyncGroupMembersBody) =>
      client.fetch<BulkSyncGroupMembersData>(`auth/organization/group/${appId}/organization/${organizationId}/group/${groupId}/member/bulk-sync`, { method: 'POST', body: data }),
  }
}
