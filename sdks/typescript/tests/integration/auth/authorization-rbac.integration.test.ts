import { expect } from 'vitest'
import {
  createAuthAuthorizations,
  createAuthOrganizationPermissions,
  createAuthOrganizationRolePermissions,
  createAuthOrganizationRoles,
} from '../../../src/auth'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  ACCOUNT_ID,
  APP_ID,
  authPermissionFixture,
  authRoleFixture,
  authRolePermissionFixture,
  describeAuthSdkContractCases,
  ORGANIZATION_ID,
  PERMISSION_ID,
  REQUEST_ID,
  ROLE_ID,
} from './auth-test-utils'

const authorizeBody = { account_id: ACCOUNT_ID, permission_key: 'project.read' }
const checkRoleBody = { account_id: ACCOUNT_ID, role_key: 'admin' }
const removeRolePermissionBody = { permission_keys: ['project.read'] }
const createPermissionBody = { key: 'project.read', name: 'Read projects' }
const updatePermissionBody = { name: 'Read all projects' }
const createRoleBody = { key: 'admin', name: 'Admin' }
const updateRoleBody = { name: 'Owner' }
const assignRolePermissionBody = { permission_keys: ['project.read'], role_id: ROLE_ID }

describeAuthSdkContractCases('Auth authorization SDK contract integration', [
  {
    name: 'authorizes an action',
    method: 'POST',
    path: '/v1/auth/authorization/{app_id}/organization/{organization_id}/authorize',
    expectedBody: authorizeBody,
    expectedPath: `/v1/auth/authorization/${APP_ID}/organization/${ORGANIZATION_ID}/authorize`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess({ authorized: true }, { requestId: REQUEST_ID }),
    run: context => createAuthAuthorizations(context.client).authorizeAction(APP_ID, ORGANIZATION_ID, authorizeBody),
    assertResult: result => expect(result).toEqual({ authorized: true }),
  },
  {
    name: 'checks an account role',
    method: 'POST',
    path: '/v1/auth/authorization/{app_id}/organization/{organization_id}/has-role',
    expectedBody: checkRoleBody,
    expectedPath: `/v1/auth/authorization/${APP_ID}/organization/${ORGANIZATION_ID}/has-role`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess({ has_role: true }, { requestId: REQUEST_ID }),
    run: context => createAuthAuthorizations(context.client).checkRole(APP_ID, ORGANIZATION_ID, checkRoleBody),
    assertResult: result => expect(result).toEqual({ has_role: true }),
  },
  {
    name: 'reads effective permissions',
    method: 'GET',
    path: '/v1/auth/authorization/{app_id}/organization/{organization_id}/account/{account_id}/effective-permissions',
    expectedPath: `/v1/auth/authorization/${APP_ID}/organization/${ORGANIZATION_ID}/account/${ACCOUNT_ID}/effective-permissions`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID, organization_id: ORGANIZATION_ID },
    response: conjoinSuccess({ permissions: ['project.read'] }, { requestId: REQUEST_ID }),
    run: context =>
      createAuthAuthorizations(context.client).readEffectivePermissions(APP_ID, ORGANIZATION_ID, ACCOUNT_ID),
    assertResult: result => expect(result).toEqual({ permissions: ['project.read'] }),
  },
  {
    name: 'removes a role permission through authorization',
    method: 'POST',
    path: '/v1/auth/authorization/{app_id}/organization/{organization_id}/role/{role_id}/permission/remove',
    expectedBody: removeRolePermissionBody,
    expectedPath: `/v1/auth/authorization/${APP_ID}/organization/${ORGANIZATION_ID}/role/${ROLE_ID}/permission/remove`,
    expectedPathParams: { app_id: APP_ID, organization_id: ORGANIZATION_ID, role_id: ROLE_ID },
    response: conjoinSuccess({ permissions: [] }, { requestId: REQUEST_ID }),
    run: context =>
      createAuthAuthorizations(context.client).removeRolePermission(
        APP_ID,
        ORGANIZATION_ID,
        ROLE_ID,
        removeRolePermissionBody,
      ),
    assertResult: result => expect(result).toEqual({ permissions: [] }),
  },
])

describeAuthSdkContractCases('Auth organization permission SDK contract integration', [
  {
    name: 'creates an organization permission',
    method: 'POST',
    path: '/v1/auth/organization/permission/{organization_id}/create',
    expectedBody: createPermissionBody,
    expectedPath: `/v1/auth/organization/permission/${ORGANIZATION_ID}/create`,
    expectedPathParams: { organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authPermissionFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context =>
      createAuthOrganizationPermissions(context.client).createOrgPermission(ORGANIZATION_ID, createPermissionBody),
    assertResult: result => expect(result).toEqual(authPermissionFixture()),
  },
  {
    name: 'reads an organization permission',
    method: 'GET',
    path: '/v1/auth/organization/permission/{organization_id}/{permission_id}',
    expectedPath: `/v1/auth/organization/permission/${ORGANIZATION_ID}/${PERMISSION_ID}`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, permission_id: PERMISSION_ID },
    response: conjoinSuccess(authPermissionFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthOrganizationPermissions(context.client).readOrgPermission(ORGANIZATION_ID, PERMISSION_ID),
    assertResult: result => expect(result).toEqual(authPermissionFixture()),
  },
  {
    name: 'lists organization permissions',
    method: 'GET',
    path: '/v1/auth/organization/permission/{organization_id}',
    expectedPath: `/v1/auth/organization/permission/${ORGANIZATION_ID}`,
    expectedPathParams: { organization_id: ORGANIZATION_ID },
    expectedQuery: { limit: '1', 'query[key]': 'project.read' },
    expectedRawBody: '',
    response: conjoinList([authPermissionFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationPermissions(context.client).listOrgPermissions(ORGANIZATION_ID, {
        limit: 1,
        query: { key: 'project.read' },
      }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authPermissionFixture()], status: 200 }),
  },
  {
    name: 'updates an organization permission',
    method: 'PATCH',
    path: '/v1/auth/organization/permission/{organization_id}/{permission_id}/update',
    expectedBody: updatePermissionBody,
    expectedPath: `/v1/auth/organization/permission/${ORGANIZATION_ID}/${PERMISSION_ID}/update`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, permission_id: PERMISSION_ID },
    response: conjoinSuccess(authPermissionFixture({ name: 'Read all projects' }), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationPermissions(context.client).updateOrgPermission(
        ORGANIZATION_ID,
        PERMISSION_ID,
        updatePermissionBody,
      ),
    assertResult: result => expect(result).toEqual(authPermissionFixture({ name: 'Read all projects' })),
  },
  {
    name: 'archives an organization permission',
    method: 'PATCH',
    path: '/v1/auth/organization/permission/{organization_id}/{permission_id}/archive',
    expectedPath: `/v1/auth/organization/permission/${ORGANIZATION_ID}/${PERMISSION_ID}/archive`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, permission_id: PERMISSION_ID },
    response: conjoinSuccess(authPermissionFixture({ date_deleted: '2026-05-16T01:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context =>
      createAuthOrganizationPermissions(context.client).archiveOrgPermission(ORGANIZATION_ID, PERMISSION_ID),
    assertResult: result => expect(result).toEqual(authPermissionFixture({ date_deleted: '2026-05-16T01:00:00.000Z' })),
  },
  {
    name: 'restores an organization permission',
    method: 'PATCH',
    path: '/v1/auth/organization/permission/{organization_id}/{permission_id}/restore',
    expectedPath: `/v1/auth/organization/permission/${ORGANIZATION_ID}/${PERMISSION_ID}/restore`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, permission_id: PERMISSION_ID },
    response: conjoinSuccess(authPermissionFixture({ date_deleted: null }), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationPermissions(context.client).restoreOrgPermission(ORGANIZATION_ID, PERMISSION_ID),
    assertResult: result => expect(result).toEqual(authPermissionFixture({ date_deleted: null })),
  },
  {
    name: 'deletes an organization permission',
    method: 'DELETE',
    path: '/v1/auth/organization/permission/{organization_id}/{permission_id}/delete',
    expectedPath: `/v1/auth/organization/permission/${ORGANIZATION_ID}/${PERMISSION_ID}/delete`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, permission_id: PERMISSION_ID },
    response: conjoinSuccess(authPermissionFixture({ date_deleted: '2026-05-16T01:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context =>
      createAuthOrganizationPermissions(context.client).deleteOrgPermission(ORGANIZATION_ID, PERMISSION_ID),
    assertResult: result => expect(result).toEqual(authPermissionFixture({ date_deleted: '2026-05-16T01:00:00.000Z' })),
  },
])

describeAuthSdkContractCases('Auth organization role and role-permission SDK contract integration', [
  {
    name: 'creates an organization role',
    method: 'POST',
    path: '/v1/auth/organization/role/{organization_id}/create',
    expectedBody: createRoleBody,
    expectedPath: `/v1/auth/organization/role/${ORGANIZATION_ID}/create`,
    expectedPathParams: { organization_id: ORGANIZATION_ID },
    response: conjoinSuccess(authRoleFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => createAuthOrganizationRoles(context.client).createOrgRole(ORGANIZATION_ID, createRoleBody),
    assertResult: result => expect(result).toEqual(authRoleFixture()),
  },
  {
    name: 'reads an organization role',
    method: 'GET',
    path: '/v1/auth/organization/role/{organization_id}/{role_id}',
    expectedPath: `/v1/auth/organization/role/${ORGANIZATION_ID}/${ROLE_ID}`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, role_id: ROLE_ID },
    response: conjoinSuccess(authRoleFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthOrganizationRoles(context.client).readOrgRole(ORGANIZATION_ID, ROLE_ID),
    assertResult: result => expect(result).toEqual(authRoleFixture()),
  },
  {
    name: 'lists organization roles',
    method: 'GET',
    path: '/v1/auth/organization/role/{organization_id}',
    expectedPath: `/v1/auth/organization/role/${ORGANIZATION_ID}`,
    expectedPathParams: { organization_id: ORGANIZATION_ID },
    expectedQuery: { limit: '1', 'query[key]': 'admin' },
    expectedRawBody: '',
    response: conjoinList([authRoleFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationRoles(context.client).listOrgRoles(ORGANIZATION_ID, { limit: 1, query: { key: 'admin' } }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authRoleFixture()], status: 200 }),
  },
  {
    name: 'updates an organization role',
    method: 'PATCH',
    path: '/v1/auth/organization/role/{organization_id}/{role_id}/update',
    expectedBody: updateRoleBody,
    expectedPath: `/v1/auth/organization/role/${ORGANIZATION_ID}/${ROLE_ID}/update`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, role_id: ROLE_ID },
    response: conjoinSuccess(authRoleFixture({ name: 'Owner' }), { requestId: REQUEST_ID }),
    run: context => createAuthOrganizationRoles(context.client).updateOrgRole(ORGANIZATION_ID, ROLE_ID, updateRoleBody),
    assertResult: result => expect(result).toEqual(authRoleFixture({ name: 'Owner' })),
  },
  {
    name: 'archives an organization role',
    method: 'PATCH',
    path: '/v1/auth/organization/role/{organization_id}/{role_id}/archive',
    expectedPath: `/v1/auth/organization/role/${ORGANIZATION_ID}/${ROLE_ID}/archive`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, role_id: ROLE_ID },
    response: conjoinSuccess(authRoleFixture({ date_deleted: '2026-05-16T01:00:00.000Z' }), { requestId: REQUEST_ID }),
    run: context => createAuthOrganizationRoles(context.client).archiveOrgRole(ORGANIZATION_ID, ROLE_ID),
    assertResult: result => expect(result).toEqual(authRoleFixture({ date_deleted: '2026-05-16T01:00:00.000Z' })),
  },
  {
    name: 'restores an organization role',
    method: 'PATCH',
    path: '/v1/auth/organization/role/{organization_id}/{role_id}/restore',
    expectedPath: `/v1/auth/organization/role/${ORGANIZATION_ID}/${ROLE_ID}/restore`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, role_id: ROLE_ID },
    response: conjoinSuccess(authRoleFixture({ date_deleted: null }), { requestId: REQUEST_ID }),
    run: context => createAuthOrganizationRoles(context.client).restoreOrgRole(ORGANIZATION_ID, ROLE_ID),
    assertResult: result => expect(result).toEqual(authRoleFixture({ date_deleted: null })),
  },
  {
    name: 'deletes an organization role',
    method: 'DELETE',
    path: '/v1/auth/organization/role/{organization_id}/{role_id}/delete',
    expectedPath: `/v1/auth/organization/role/${ORGANIZATION_ID}/${ROLE_ID}/delete`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, role_id: ROLE_ID },
    response: conjoinSuccess(authRoleFixture({ date_deleted: '2026-05-16T01:00:00.000Z' }), { requestId: REQUEST_ID }),
    run: context => createAuthOrganizationRoles(context.client).deleteOrgRole(ORGANIZATION_ID, ROLE_ID),
    assertResult: result => expect(result).toEqual(authRoleFixture({ date_deleted: '2026-05-16T01:00:00.000Z' })),
  },
  {
    name: 'reads organization role permissions',
    method: 'GET',
    path: '/v1/auth/organization/role/{organization_id}/{role_id}/permissions',
    expectedPath: `/v1/auth/organization/role/${ORGANIZATION_ID}/${ROLE_ID}/permissions`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, role_id: ROLE_ID },
    response: conjoinList(['project.read'], { requestId: REQUEST_ID }),
    run: context => createAuthOrganizationRoles(context.client).readOrgRolePermissions(ORGANIZATION_ID, ROLE_ID),
    assertResult: result => expect(result).toEqual({ success: true, data: ['project.read'], status: 200 }),
  },
  {
    name: 'assigns an organization role permission',
    method: 'POST',
    path: '/v1/auth/organization/role/permission/{organization_id}/{role_id}/assign',
    expectedBody: assignRolePermissionBody,
    expectedPath: `/v1/auth/organization/role/permission/${ORGANIZATION_ID}/${ROLE_ID}/assign`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, role_id: ROLE_ID },
    response: conjoinSuccess(authRolePermissionFixture(), { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationRolePermissions(context.client).assignOrgRolePermission(
        ORGANIZATION_ID,
        ROLE_ID,
        assignRolePermissionBody,
      ),
    assertResult: result => expect(result).toEqual(authRolePermissionFixture()),
  },
  {
    name: 'lists organization role permissions',
    method: 'GET',
    path: '/v1/auth/organization/role/permission/{organization_id}/{role_id}',
    expectedPath: `/v1/auth/organization/role/permission/${ORGANIZATION_ID}/${ROLE_ID}`,
    expectedPathParams: { organization_id: ORGANIZATION_ID, role_id: ROLE_ID },
    expectedQuery: { limit: '1', 'query[permission_id]': PERMISSION_ID },
    expectedRawBody: '',
    response: conjoinList([authRolePermissionFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthOrganizationRolePermissions(context.client).listOrgRolePermissions(ORGANIZATION_ID, ROLE_ID, {
        limit: 1,
        query: { permission_id: PERMISSION_ID },
      }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authRolePermissionFixture()], status: 200 }),
  },
])
