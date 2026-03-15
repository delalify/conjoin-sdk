import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateInvitationBody = operations['createInvitation']['requestBody']['content']['application/json']
type CreateInvitationData = NonNullable<operations['createInvitation']['responses']['201']['content']['application/json']['data']>
type ListInvitationsData = NonNullable<operations['listInvitations']['responses']['200']['content']['application/json']['data']>[number]
type ListInvitationsQuery = NonNullable<operations['listInvitations']['parameters']['query']>
type RevokeInvitationData = NonNullable<operations['revokeInvitation']['responses']['200']['content']['application/json']['data']>
type ResendInvitationBody = operations['resendInvitation']['requestBody']['content']['application/json']
type ResendInvitationData = NonNullable<operations['resendInvitation']['responses']['200']['content']['application/json']['data']>

export function createAuthOrganizationInvitations(client: ConjoinClient) {
  return {
    createInvitation: (appId: string, organizationId: string, data: CreateInvitationBody) =>
      client.fetch<CreateInvitationData>(`auth/organization/invitation/${appId}/organization/${organizationId}/invitation/create`, { method: 'POST', body: data }),

    listInvitations: (appId: string, organizationId: string, query?: ListInvitationsQuery) =>
      client.fetchList<ListInvitationsData>(`auth/organization/invitation/${appId}/organization/${organizationId}/invitation/list`, { query: query as Record<string, unknown> }),

    revokeInvitation: (appId: string, organizationId: string, invitationId: string) =>
      client.fetch<RevokeInvitationData>(`auth/organization/invitation/${appId}/organization/${organizationId}/invitation/${invitationId}/revoke`, { method: 'POST' }),

    resendInvitation: (appId: string, organizationId: string, invitationId: string, data: ResendInvitationBody) =>
      client.fetch<ResendInvitationData>(`auth/organization/invitation/${appId}/organization/${organizationId}/invitation/${invitationId}/resend`, { method: 'POST', body: data }),
  }
}
