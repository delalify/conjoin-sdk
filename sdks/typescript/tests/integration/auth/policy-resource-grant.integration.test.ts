import { expect } from 'vitest'
import { createAuthPolicies, createAuthResourceGrants, createAuthRoleAssignmentLogs } from '../../../src/auth'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  ACCOUNT_ID,
  APP_ID,
  authPolicyFixture,
  authResourceGrantFixture,
  authRoleAssignmentLogFixture,
  describeAuthSdkContractCases,
  ORGANIZATION_ID,
  POLICY_ID,
  REQUEST_ID,
} from './auth-test-utils'

const createPolicyBody = {
  conditions: [{ type: 'time_based' as const }],
  effect: 'allow' as const,
  name: 'Allow project reads',
  permission_keys: ['project.read'],
}
const updatePolicyBody = { is_enabled: false, name: 'Paused project reads' }
const resourceGrantBody = {
  permission_keys: ['project.read'],
  resource_id: 'resource_123',
  resource_type: 'project',
}
const resourceRevokeBody = {
  permission_keys: ['project.read'],
  resource_id: 'resource_123',
  resource_type: 'project',
}
const resourceCheckBody = {
  permission_key: 'project.read',
  resource_id: 'resource_123',
  resource_type: 'project',
}

describeAuthSdkContractCases('Auth policy SDK contract integration', [
  {
    name: 'creates an auth policy',
    method: 'POST',
    path: '/v1/auth/organization/policy/{app_id}/organization/{organization_id}/policy/create',
    expectedBody: createPolicyBody,
    expectedPath: `/v1/auth/organization/policy/${APP_ID}/organization/${ORGANIZATION_ID}/policy/create`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authPolicyFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => createAuthPolicies(context.client).create(APP_ID, ORGANIZATION_ID, createPolicyBody),
    assertResult: result => expect(result).toEqual(authPolicyFixture()),
  },
  {
    name: 'reads an auth policy',
    method: 'GET',
    path: '/v1/auth/organization/policy/{app_id}/organization/{organization_id}/policy/{policy_id}',
    expectedPath: `/v1/auth/organization/policy/${APP_ID}/organization/${ORGANIZATION_ID}/policy/${POLICY_ID}`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID, policy_id: POLICY_ID },
    response: conjoinSuccess(authPolicyFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthPolicies(context.client).read(APP_ID, ORGANIZATION_ID, POLICY_ID),
    assertResult: result => expect(result).toEqual(authPolicyFixture()),
  },
  {
    name: 'lists auth policies',
    method: 'GET',
    path: '/v1/auth/organization/policy/{app_id}/organization/{organization_id}/policy',
    expectedPath: `/v1/auth/organization/policy/${APP_ID}/organization/${ORGANIZATION_ID}/policy`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    expectedQuery: { limit: '1', 'query[effect]': 'allow' },
    expectedRawBody: '',
    response: conjoinList([authPolicyFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthPolicies(context.client).list(APP_ID, ORGANIZATION_ID, { limit: 1, query: { effect: 'allow' } }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authPolicyFixture()], status: 200 }),
  },
  {
    name: 'updates an auth policy',
    method: 'PATCH',
    path: '/v1/auth/organization/policy/{app_id}/organization/{organization_id}/policy/{policy_id}/update',
    expectedBody: updatePolicyBody,
    expectedPath: `/v1/auth/organization/policy/${APP_ID}/organization/${ORGANIZATION_ID}/policy/${POLICY_ID}/update`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID, policy_id: POLICY_ID },
    response: conjoinSuccess(authPolicyFixture({ is_enabled: false, name: 'Paused project reads' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createAuthPolicies(context.client).update(APP_ID, ORGANIZATION_ID, POLICY_ID, updatePolicyBody),
    assertResult: result =>
      expect(result).toEqual(authPolicyFixture({ is_enabled: false, name: 'Paused project reads' })),
  },
  {
    name: 'deletes an auth policy',
    method: 'POST',
    path: '/v1/auth/organization/policy/{app_id}/organization/{organization_id}/policy/{policy_id}/delete',
    expectedPath: `/v1/auth/organization/policy/${APP_ID}/organization/${ORGANIZATION_ID}/policy/${POLICY_ID}/delete`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID, policy_id: POLICY_ID },
    response: conjoinSuccess(authPolicyFixture({ date_deleted: '2026-05-16T01:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createAuthPolicies(context.client).delete(APP_ID, ORGANIZATION_ID, POLICY_ID),
    assertResult: result => expect(result).toEqual(authPolicyFixture({ date_deleted: '2026-05-16T01:00:00.000Z' })),
  },
])

describeAuthSdkContractCases('Auth resource grant and role assignment log SDK contract integration', [
  {
    name: 'grants a resource permission',
    method: 'POST',
    path: '/v1/auth/organization/resource-grant/{app_id}/organization/{organization_id}/account/{account_id}/resource-grants/grant',
    expectedBody: resourceGrantBody,
    expectedPath: `/v1/auth/organization/resource-grant/${APP_ID}/organization/${ORGANIZATION_ID}/account/${ACCOUNT_ID}/resource-grants/grant`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authResourceGrantFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context =>
      createAuthResourceGrants(context.client).grantResourcePermission(
        APP_ID,
        ORGANIZATION_ID,
        ACCOUNT_ID,
        resourceGrantBody,
      ),
    assertResult: result => expect(result).toEqual(authResourceGrantFixture()),
  },
  {
    name: 'revokes a resource permission',
    method: 'POST',
    path: '/v1/auth/organization/resource-grant/{app_id}/organization/{organization_id}/account/{account_id}/resource-grants/revoke',
    expectedBody: resourceRevokeBody,
    expectedPath: `/v1/auth/organization/resource-grant/${APP_ID}/organization/${ORGANIZATION_ID}/account/${ACCOUNT_ID}/resource-grants/revoke`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authResourceGrantFixture({ date_deleted: '2026-05-16T01:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context =>
      createAuthResourceGrants(context.client).revokeResourcePermission(
        APP_ID,
        ORGANIZATION_ID,
        ACCOUNT_ID,
        resourceRevokeBody,
      ),
    assertResult: result =>
      expect(result).toEqual(authResourceGrantFixture({ date_deleted: '2026-05-16T01:00:00.000Z' })),
  },
  {
    name: 'checks a resource permission',
    method: 'POST',
    path: '/v1/auth/organization/resource-grant/{app_id}/organization/{organization_id}/account/{account_id}/resource-grants/check',
    expectedBody: resourceCheckBody,
    expectedPath: `/v1/auth/organization/resource-grant/${APP_ID}/organization/${ORGANIZATION_ID}/account/${ACCOUNT_ID}/resource-grants/check`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess({ has_permission: true }, { requestId: REQUEST_ID }),
    run: context =>
      createAuthResourceGrants(context.client).checkResourcePermission(
        APP_ID,
        ORGANIZATION_ID,
        ACCOUNT_ID,
        resourceCheckBody,
      ),
    assertResult: result => expect(result).toEqual({ has_permission: true }),
  },
  {
    name: 'lists resource grants',
    method: 'GET',
    path: '/v1/auth/organization/resource-grant/{app_id}/organization/{organization_id}/resource-grants',
    expectedPath: `/v1/auth/organization/resource-grant/${APP_ID}/organization/${ORGANIZATION_ID}/resource-grants`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    expectedQuery: { limit: '1' },
    expectedRawBody: '',
    response: conjoinList([authResourceGrantFixture()], { requestId: REQUEST_ID }),
    run: context => createAuthResourceGrants(context.client).list(APP_ID, ORGANIZATION_ID, { limit: 1 }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authResourceGrantFixture()], status: 200 }),
  },
  {
    name: 'lists role assignment logs',
    method: 'GET',
    path: '/v1/auth/organization/role-assignment-log/{app_id}/organization/{organization_id}/role-assignment-logs',
    expectedPath: `/v1/auth/organization/role-assignment-log/${APP_ID}/organization/${ORGANIZATION_ID}/role-assignment-logs`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    expectedQuery: { limit: '1' },
    expectedRawBody: '',
    response: conjoinList([authRoleAssignmentLogFixture()], { requestId: REQUEST_ID }),
    run: context => createAuthRoleAssignmentLogs(context.client).list(APP_ID, ORGANIZATION_ID, { limit: 1 }),
    assertResult: result =>
      expect(result).toEqual({ success: true, data: [authRoleAssignmentLogFixture()], status: 200 }),
  },
])
