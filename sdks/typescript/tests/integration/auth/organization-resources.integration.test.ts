import { expect } from 'vitest'
import {
  createAuthOrganizationGroups,
  createAuthOrganizationInvitations,
  createAuthOrganizationMemberships,
  createAuthOrganizations,
} from '../../../src/auth'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  ACCOUNT_ID,
  APP_ID,
  authGroupFixture,
  authGroupMemberFixture,
  authInvitationFixture,
  authMembershipFixture,
  authOrganizationFixture,
  describeAuthSdkContractCases,
  GROUP_ID,
  INVITATION_ID,
  MEMBERSHIP_ID,
  ORGANIZATION_ID,
  REQUEST_ID,
} from './auth-test-utils'

const createOrganizationBody = { name: 'Contract Organization', slug: 'contract-organization' }
const updateOrganizationBody = { name: 'Renamed Organization' }
const organizationSettingsBody = { membership: { limit: 100 } }
const deleteOrganizationBody = { force: false, permanent: false }
const createGroupBody = { name: 'Operators', roles: ['admin'], slug: 'operators' }
const updateGroupBody = { name: 'Support Operators' }
const groupMemberBody = { account_id: ACCOUNT_ID }
const bulkSyncGroupMembersBody = { add: [ACCOUNT_ID], remove: ['auth_account_456'] }
const createInvitationBody = { email: 'invitee@example.com', roles: ['admin'] }
const resendInvitationBody = { expires_in_seconds: 3600, redirect_uri: 'https://example.com/invitation' }
const createMembershipBody = { account_id: ACCOUNT_ID, roles: ['admin'], status: 'active' as const }
const updateMembershipBody = { roles: ['member'], status: 'active' as const }

describeAuthSdkContractCases('Auth organization SDK contract integration', [
  {
    name: 'creates an auth organization',
    method: 'POST',
    path: '/v1/auth/organization/create',
    expectedBody: createOrganizationBody,
    response: conjoinSuccess(authOrganizationFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => createAuthOrganizations(context.client).create(createOrganizationBody),
    assertResult: result => expect(result).toEqual(authOrganizationFixture()),
  },
  {
    name: 'reads an auth organization',
    method: 'GET',
    path: '/v1/auth/organization/{organization_id}',
    expectedPath: `/v1/auth/organization/${ORGANIZATION_ID}`,
    expectedPathParams: { organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authOrganizationFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthOrganizations(context.client).read(ORGANIZATION_ID),
    assertResult: result => expect(result).toEqual(authOrganizationFixture()),
  },
  {
    name: 'lists auth organizations',
    method: 'GET',
    path: '/v1/auth/organization/',
    expectedQuery: { limit: '1', 'query[slug]': 'contract-organization' },
    expectedRawBody: '',
    response: conjoinList([authOrganizationFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizations(context.client).list({ limit: 1, query: { slug: 'contract-organization' } }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authOrganizationFixture()], status: 200 }),
  },
  {
    name: 'updates an auth organization',
    method: 'PATCH',
    path: '/v1/auth/organization/{organization_id}/update',
    expectedBody: updateOrganizationBody,
    expectedPath: `/v1/auth/organization/${ORGANIZATION_ID}/update`,
    expectedPathParams: { organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authOrganizationFixture({ name: 'Renamed Organization' }), { requestId: REQUEST_ID }),
    run: context => createAuthOrganizations(context.client).update(ORGANIZATION_ID, updateOrganizationBody),
    assertResult: result => expect(result).toEqual(authOrganizationFixture({ name: 'Renamed Organization' })),
  },
  {
    name: 'updates auth organization settings',
    method: 'PATCH',
    path: '/v1/auth/organization/{organization_id}/settings/update',
    expectedBody: organizationSettingsBody,
    expectedPath: `/v1/auth/organization/${ORGANIZATION_ID}/settings/update`,
    expectedPathParams: { organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authOrganizationFixture({ settings: organizationSettingsBody }), {
      requestId: REQUEST_ID,
    }),
    run: context => createAuthOrganizations(context.client).updateSettings(ORGANIZATION_ID, organizationSettingsBody),
    assertResult: result => expect(result).toEqual(authOrganizationFixture({ settings: organizationSettingsBody })),
  },
  {
    name: 'deletes an auth organization',
    method: 'DELETE',
    path: '/v1/auth/organization/{organization_id}/delete',
    expectedBody: deleteOrganizationBody,
    expectedPath: `/v1/auth/organization/${ORGANIZATION_ID}/delete`,
    expectedPathParams: { organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authOrganizationFixture({ date_deleted: '2026-05-16T01:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createAuthOrganizations(context.client).delete(ORGANIZATION_ID, deleteOrganizationBody),
    assertResult: result =>
      expect(result).toEqual(authOrganizationFixture({ date_deleted: '2026-05-16T01:00:00.000Z' })),
  },
])

describeAuthSdkContractCases('Auth organization group SDK contract integration', [
  {
    name: 'creates an organization group',
    method: 'POST',
    path: '/v1/auth/organization/group/{app_id}/organization/{organization_id}/group/create',
    expectedBody: createGroupBody,
    expectedPath: `/v1/auth/organization/group/${APP_ID}/organization/${ORGANIZATION_ID}/group/create`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authGroupFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => createAuthOrganizationGroups(context.client).createGroup(APP_ID, ORGANIZATION_ID, createGroupBody),
    assertResult: result => expect(result).toEqual(authGroupFixture()),
  },
  {
    name: 'lists organization groups',
    method: 'GET',
    path: '/v1/auth/organization/group/{app_id}/organization/{organization_id}/group/list',
    expectedPath: `/v1/auth/organization/group/${APP_ID}/organization/${ORGANIZATION_ID}/group/list`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    expectedQuery: { limit: '1', 'query[slug]': 'operators' },
    expectedRawBody: '',
    response: conjoinList([authGroupFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationGroups(context.client).listGroups(APP_ID, ORGANIZATION_ID, {
        limit: 1,
        query: { slug: 'operators' },
      }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authGroupFixture()], status: 200 }),
  },
  {
    name: 'updates an organization group',
    method: 'PATCH',
    path: '/v1/auth/organization/group/{app_id}/organization/{organization_id}/group/{group_id}/update',
    expectedBody: updateGroupBody,
    expectedPath: `/v1/auth/organization/group/${APP_ID}/organization/${ORGANIZATION_ID}/group/${GROUP_ID}/update`,
    expectedPathParams: { app_id: APP_ID, group_id: GROUP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authGroupFixture({ name: 'Support Operators' }), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationGroups(context.client).updateGroup(APP_ID, ORGANIZATION_ID, GROUP_ID, updateGroupBody),
    assertResult: result => expect(result).toEqual(authGroupFixture({ name: 'Support Operators' })),
  },
  {
    name: 'deletes an organization group',
    method: 'DELETE',
    path: '/v1/auth/organization/group/{app_id}/organization/{organization_id}/group/{group_id}/delete',
    expectedPath: `/v1/auth/organization/group/${APP_ID}/organization/${ORGANIZATION_ID}/group/${GROUP_ID}/delete`,
    expectedPathParams: { app_id: APP_ID, group_id: GROUP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authGroupFixture({ date_deleted: '2026-05-16T01:00:00.000Z' }), { requestId: REQUEST_ID }),
    run: context => createAuthOrganizationGroups(context.client).deleteGroup(APP_ID, ORGANIZATION_ID, GROUP_ID),
    assertResult: result => expect(result).toEqual(authGroupFixture({ date_deleted: '2026-05-16T01:00:00.000Z' })),
  },
  {
    name: 'adds an organization group member',
    method: 'POST',
    path: '/v1/auth/organization/group/{app_id}/organization/{organization_id}/group/{group_id}/member/add',
    expectedBody: groupMemberBody,
    expectedPath: `/v1/auth/organization/group/${APP_ID}/organization/${ORGANIZATION_ID}/group/${GROUP_ID}/member/add`,
    expectedPathParams: { app_id: APP_ID, group_id: GROUP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authGroupMemberFixture(), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationGroups(context.client).addGroupMember(APP_ID, ORGANIZATION_ID, GROUP_ID, groupMemberBody),
    assertResult: result => expect(result).toEqual(authGroupMemberFixture()),
  },
  {
    name: 'removes an organization group member',
    method: 'POST',
    path: '/v1/auth/organization/group/{app_id}/organization/{organization_id}/group/{group_id}/member/remove',
    expectedBody: groupMemberBody,
    expectedPath: `/v1/auth/organization/group/${APP_ID}/organization/${ORGANIZATION_ID}/group/${GROUP_ID}/member/remove`,
    expectedPathParams: { app_id: APP_ID, group_id: GROUP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authGroupMemberFixture({ status: 'removed' }), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationGroups(context.client).removeGroupMember(
        APP_ID,
        ORGANIZATION_ID,
        GROUP_ID,
        groupMemberBody,
      ),
    assertResult: result => expect(result).toEqual(authGroupMemberFixture({ status: 'removed' })),
  },
  {
    name: 'lists organization group members',
    method: 'GET',
    path: '/v1/auth/organization/group/{app_id}/organization/{organization_id}/group/{group_id}/member/list',
    expectedPath: `/v1/auth/organization/group/${APP_ID}/organization/${ORGANIZATION_ID}/group/${GROUP_ID}/member/list`,
    expectedPathParams: { app_id: APP_ID, group_id: GROUP_ID, organization_id: ORGANIZATION_ID },
    expectedQuery: { limit: '1' },
    expectedRawBody: '',
    response: conjoinList([authGroupMemberFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationGroups(context.client).listGroupMembers(APP_ID, ORGANIZATION_ID, GROUP_ID, { limit: 1 }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authGroupMemberFixture()], status: 200 }),
  },
  {
    name: 'bulk syncs organization group members',
    method: 'POST',
    path: '/v1/auth/organization/group/{app_id}/organization/{organization_id}/group/{group_id}/member/bulk-sync',
    expectedBody: bulkSyncGroupMembersBody,
    expectedPath: `/v1/auth/organization/group/${APP_ID}/organization/${ORGANIZATION_ID}/group/${GROUP_ID}/member/bulk-sync`,
    expectedPathParams: { app_id: APP_ID, group_id: GROUP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authGroupFixture({ total_members: 1 }), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationGroups(context.client).bulkSyncGroupMembers(
        APP_ID,
        ORGANIZATION_ID,
        GROUP_ID,
        bulkSyncGroupMembersBody,
      ),
    assertResult: result => expect(result).toEqual(authGroupFixture({ total_members: 1 })),
  },
])

describeAuthSdkContractCases('Auth organization invitation and membership SDK contract integration', [
  {
    name: 'creates an organization invitation',
    method: 'POST',
    path: '/v1/auth/organization/invitation/{app_id}/organization/{organization_id}/invitation/create',
    expectedBody: createInvitationBody,
    expectedPath: `/v1/auth/organization/invitation/${APP_ID}/organization/${ORGANIZATION_ID}/invitation/create`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authInvitationFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context =>
      createAuthOrganizationInvitations(context.client).createInvitation(APP_ID, ORGANIZATION_ID, createInvitationBody),
    assertResult: result => expect(result).toEqual(authInvitationFixture()),
  },
  {
    name: 'lists organization invitations',
    method: 'GET',
    path: '/v1/auth/organization/invitation/{app_id}/organization/{organization_id}/invitation/list',
    expectedPath: `/v1/auth/organization/invitation/${APP_ID}/organization/${ORGANIZATION_ID}/invitation/list`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    expectedQuery: { limit: '1', 'query[status]': 'pending' },
    expectedRawBody: '',
    response: conjoinList([authInvitationFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationInvitations(context.client).listInvitations(APP_ID, ORGANIZATION_ID, {
        limit: 1,
        query: { status: 'pending' },
      }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authInvitationFixture()], status: 200 }),
  },
  {
    name: 'revokes an organization invitation',
    method: 'POST',
    path: '/v1/auth/organization/invitation/{app_id}/organization/{organization_id}/invitation/{invitation_id}/revoke',
    expectedPath: `/v1/auth/organization/invitation/${APP_ID}/organization/${ORGANIZATION_ID}/invitation/${INVITATION_ID}/revoke`,
    expectedPathParams: { app_id: APP_ID, invitation_id: INVITATION_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authInvitationFixture({ status: 'revoked' }), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationInvitations(context.client).revokeInvitation(APP_ID, ORGANIZATION_ID, INVITATION_ID),
    assertResult: result => expect(result).toEqual(authInvitationFixture({ status: 'revoked' })),
  },
  {
    name: 'resends an organization invitation',
    method: 'POST',
    path: '/v1/auth/organization/invitation/{app_id}/organization/{organization_id}/invitation/{invitation_id}/resend',
    expectedBody: resendInvitationBody,
    expectedPath: `/v1/auth/organization/invitation/${APP_ID}/organization/${ORGANIZATION_ID}/invitation/${INVITATION_ID}/resend`,
    expectedPathParams: { app_id: APP_ID, invitation_id: INVITATION_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authInvitationFixture(), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationInvitations(context.client).resendInvitation(
        APP_ID,
        ORGANIZATION_ID,
        INVITATION_ID,
        resendInvitationBody,
      ),
    assertResult: result => expect(result).toEqual(authInvitationFixture()),
  },
  {
    name: 'creates an organization membership',
    method: 'POST',
    path: '/v1/auth/organization/membership/{app_id}/organization/{organization_id}/membership/create',
    expectedBody: createMembershipBody,
    expectedPath: `/v1/auth/organization/membership/${APP_ID}/organization/${ORGANIZATION_ID}/membership/create`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authMembershipFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context =>
      createAuthOrganizationMemberships(context.client).createMembership(APP_ID, ORGANIZATION_ID, createMembershipBody),
    assertResult: result => expect(result).toEqual(authMembershipFixture()),
  },
  {
    name: 'lists organization memberships',
    method: 'GET',
    path: '/v1/auth/organization/membership/{app_id}/organization/{organization_id}/membership/list',
    expectedPath: `/v1/auth/organization/membership/${APP_ID}/organization/${ORGANIZATION_ID}/membership/list`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    expectedQuery: { limit: '1', 'query[status]': 'active' },
    expectedRawBody: '',
    response: conjoinList([authMembershipFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationMemberships(context.client).listMemberships(APP_ID, ORGANIZATION_ID, {
        limit: 1,
        query: { status: 'active' },
      }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authMembershipFixture()], status: 200 }),
  },
  {
    name: 'updates an organization membership',
    method: 'PATCH',
    path: '/v1/auth/organization/membership/{app_id}/organization/{organization_id}/membership/{membership_id}/update',
    expectedBody: updateMembershipBody,
    expectedPath: `/v1/auth/organization/membership/${APP_ID}/organization/${ORGANIZATION_ID}/membership/${MEMBERSHIP_ID}/update`,
    expectedPathParams: { app_id: APP_ID, membership_id: MEMBERSHIP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authMembershipFixture({ roles: ['member'] }), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationMemberships(context.client).updateMembership(
        APP_ID,
        ORGANIZATION_ID,
        MEMBERSHIP_ID,
        updateMembershipBody,
      ),
    assertResult: result => expect(result).toEqual(authMembershipFixture({ roles: ['member'] })),
  },
  {
    name: 'deletes an organization membership',
    method: 'DELETE',
    path: '/v1/auth/organization/membership/{app_id}/organization/{organization_id}/membership/{membership_id}/delete',
    expectedPath: `/v1/auth/organization/membership/${APP_ID}/organization/${ORGANIZATION_ID}/membership/${MEMBERSHIP_ID}/delete`,
    expectedPathParams: { app_id: APP_ID, membership_id: MEMBERSHIP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authMembershipFixture({ status: 'suspended' }), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationMemberships(context.client).deleteMembership(APP_ID, ORGANIZATION_ID, MEMBERSHIP_ID),
    assertResult: result => expect(result).toEqual(authMembershipFixture({ status: 'suspended' })),
  },
])
