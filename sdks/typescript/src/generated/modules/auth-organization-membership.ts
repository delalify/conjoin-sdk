import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateMembershipBody = operations['createMembership']['requestBody']['content']['application/json']
type CreateMembershipData = NonNullable<operations['createMembership']['responses']['201']['content']['application/json']['data']>
type ListMembershipsData = NonNullable<operations['listMemberships']['responses']['200']['content']['application/json']['data']>[number]
type ListMembershipsQuery = NonNullable<operations['listMemberships']['parameters']['query']>
type UpdateMembershipBody = operations['updateMembership']['requestBody']['content']['application/json']
type UpdateMembershipData = NonNullable<operations['updateMembership']['responses']['200']['content']['application/json']['data']>
type DeleteMembershipData = NonNullable<operations['deleteMembership']['responses']['200']['content']['application/json']['data']>

export function createAuthOrganizationMemberships(client: ConjoinClient) {
  return {
    createMembership: (appId: string, organizationId: string, data: CreateMembershipBody) =>
      client.fetch<CreateMembershipData>(`auth/organization/membership/${appId}/organization/${organizationId}/membership/create`, { method: 'POST', body: data }),

    listMemberships: (appId: string, organizationId: string, query?: ListMembershipsQuery) =>
      client.fetchList<ListMembershipsData>(`auth/organization/membership/${appId}/organization/${organizationId}/membership/list`, { query: query as Record<string, unknown> }),

    updateMembership: (appId: string, organizationId: string, membershipId: string, data: UpdateMembershipBody) =>
      client.fetch<UpdateMembershipData>(`auth/organization/membership/${appId}/organization/${organizationId}/membership/${membershipId}/update`, { method: 'PATCH', body: data }),

    deleteMembership: (appId: string, organizationId: string, membershipId: string) =>
      client.fetch<DeleteMembershipData>(`auth/organization/membership/${appId}/organization/${organizationId}/membership/${membershipId}/delete`, { method: 'DELETE' }),
  }
}
