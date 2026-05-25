import { expect } from 'vitest'
import { createAuthSCIMs } from '../../../src/auth'
import type { ContractResponse } from '../contract-server/response-fixtures'
import { APP_ID, describeAuthSdkContractCases, PROJECT_ID } from './auth-test-utils'

const SCIM_USER_ID = 'scim_user_123'
const SCIM_GROUP_ID = 'scim_group_123'
const SCIM_TOKEN = 'scim_token_contract'
const publicScimHeaders = {
  authorization: undefined,
}
const tenantScimHeaders = {
  authorization: `Bearer ${SCIM_TOKEN}`,
}
const scimUserBody = {
  active: true,
  emails: [{ primary: true, type: 'work', value: 'owner@example.com' }],
  externalId: 'external_user_123',
  userName: 'owner@example.com',
}
const scimGroupBody = {
  displayName: 'Operators',
  externalId: 'external_group_123',
  members: [{ type: 'User', value: SCIM_USER_ID }],
}
const serviceProviderConfigFixture = {
  bulk: { maxOperations: 1000, maxPayloadSize: 1_048_576, supported: true },
  documentationUri: 'https://docs.example.com/scim',
  patch: { supported: true },
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
}
const resourceListFixture = {
  Resources: [],
  schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
  totalResults: 0,
}
const userFixture = {
  active: true,
  emails: [{ primary: true, type: 'work', value: 'owner@example.com' }],
  externalId: 'external_user_123',
  id: SCIM_USER_ID,
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
  userName: 'owner@example.com',
}
const groupFixture = {
  displayName: 'Operators',
  externalId: 'external_group_123',
  id: SCIM_GROUP_ID,
  members: [{ type: 'User', value: SCIM_USER_ID }],
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
}
const bulkFixture = {
  Operations: [],
  schemas: ['urn:ietf:params:scim:api:messages:2.0:BulkResponse'],
}

const scimResponse = (body: Record<string, unknown>, status = 200): ContractResponse => ({
  status,
  headers: { 'content-type': 'application/json' },
  body: {
    ...body,
    data: body,
  },
})

describeAuthSdkContractCases('Auth SCIM SDK contract integration', [
  {
    name: 'gets SCIM service provider config',
    method: 'GET',
    path: '/v1/auth/scim/v2/ServiceProviderConfig',
    expectedHeaders: publicScimHeaders,
    response: scimResponse(serviceProviderConfigFixture),
    run: context => createAuthSCIMs(context.client).scimGetServiceProviderConfig(),
    assertResult: result => expect(result).toEqual(serviceProviderConfigFixture),
  },
  {
    name: 'gets SCIM schemas',
    method: 'GET',
    path: '/v1/auth/scim/v2/Schemas',
    expectedHeaders: publicScimHeaders,
    response: scimResponse(resourceListFixture),
    run: context => createAuthSCIMs(context.client).scimGetSchemas(),
    assertResult: result => expect(result).toEqual(resourceListFixture),
  },
  {
    name: 'gets SCIM resource types',
    method: 'GET',
    path: '/v1/auth/scim/v2/ResourceTypes',
    expectedHeaders: publicScimHeaders,
    response: scimResponse(resourceListFixture),
    run: context => createAuthSCIMs(context.client).scimGetResourceTypes(),
    assertResult: result => expect(result).toEqual(resourceListFixture),
  },
  {
    name: 'lists SCIM users',
    method: 'GET',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Users',
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Users`,
    expectedPathParams: { app_id: APP_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(resourceListFixture),
    run: context => createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimListUsers(PROJECT_ID, APP_ID),
    assertResult: result => expect(result).toEqual(resourceListFixture),
  },
  {
    name: 'creates a SCIM user',
    method: 'POST',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Users',
    expectedBody: scimUserBody,
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Users`,
    expectedPathParams: { app_id: APP_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(userFixture, 201),
    run: context =>
      createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimCreateUser(PROJECT_ID, APP_ID, scimUserBody),
    assertResult: result => expect(result).toEqual(userFixture),
  },
  {
    name: 'gets a SCIM user',
    method: 'GET',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Users/{id}',
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Users/${SCIM_USER_ID}`,
    expectedPathParams: { app_id: APP_ID, id: SCIM_USER_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(userFixture),
    run: context =>
      createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimGetUser(PROJECT_ID, APP_ID, SCIM_USER_ID),
    assertResult: result => expect(result).toEqual(userFixture),
  },
  {
    name: 'replaces a SCIM user',
    method: 'PUT',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Users/{id}',
    expectedBody: scimUserBody,
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Users/${SCIM_USER_ID}`,
    expectedPathParams: { app_id: APP_ID, id: SCIM_USER_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(userFixture),
    run: context =>
      createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimReplaceUser(
        PROJECT_ID,
        APP_ID,
        SCIM_USER_ID,
        scimUserBody,
      ),
    assertResult: result => expect(result).toEqual(userFixture),
  },
  {
    name: 'patches a SCIM user',
    method: 'PATCH',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Users/{id}',
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Users/${SCIM_USER_ID}`,
    expectedPathParams: { app_id: APP_ID, id: SCIM_USER_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(userFixture),
    run: context =>
      createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimPatchUser(PROJECT_ID, APP_ID, SCIM_USER_ID),
    assertResult: result => expect(result).toEqual(userFixture),
  },
  {
    name: 'deactivates a SCIM user',
    method: 'DELETE',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Users/{id}',
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Users/${SCIM_USER_ID}`,
    expectedPathParams: { app_id: APP_ID, id: SCIM_USER_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse({}, 204),
    run: async context => {
      await expect(
        createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimDeactivateUser(PROJECT_ID, APP_ID, SCIM_USER_ID),
      ).rejects.toThrow(SyntaxError)
    },
    assertResult: result => expect(result).toBeUndefined(),
  },
  {
    name: 'lists SCIM groups',
    method: 'GET',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Groups',
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Groups`,
    expectedPathParams: { app_id: APP_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(resourceListFixture),
    run: context => createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimListGroups(PROJECT_ID, APP_ID),
    assertResult: result => expect(result).toEqual(resourceListFixture),
  },
  {
    name: 'creates a SCIM group',
    method: 'POST',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Groups',
    expectedBody: scimGroupBody,
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Groups`,
    expectedPathParams: { app_id: APP_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(groupFixture, 201),
    run: context =>
      createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimCreateGroup(PROJECT_ID, APP_ID, scimGroupBody),
    assertResult: result => expect(result).toEqual(groupFixture),
  },
  {
    name: 'gets a SCIM group',
    method: 'GET',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Groups/{id}',
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Groups/${SCIM_GROUP_ID}`,
    expectedPathParams: { app_id: APP_ID, id: SCIM_GROUP_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(groupFixture),
    run: context =>
      createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimGetGroup(PROJECT_ID, APP_ID, SCIM_GROUP_ID),
    assertResult: result => expect(result).toEqual(groupFixture),
  },
  {
    name: 'replaces a SCIM group',
    method: 'PUT',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Groups/{id}',
    expectedBody: scimGroupBody,
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Groups/${SCIM_GROUP_ID}`,
    expectedPathParams: { app_id: APP_ID, id: SCIM_GROUP_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(groupFixture),
    run: context =>
      createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimReplaceGroup(
        PROJECT_ID,
        APP_ID,
        SCIM_GROUP_ID,
        scimGroupBody,
      ),
    assertResult: result => expect(result).toEqual(groupFixture),
  },
  {
    name: 'patches SCIM group members',
    method: 'PATCH',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Groups/{id}',
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Groups/${SCIM_GROUP_ID}`,
    expectedPathParams: { app_id: APP_ID, id: SCIM_GROUP_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(groupFixture),
    run: context =>
      createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimPatchGroupMembers(
        PROJECT_ID,
        APP_ID,
        SCIM_GROUP_ID,
      ),
    assertResult: result => expect(result).toEqual(groupFixture),
  },
  {
    name: 'deletes a SCIM group',
    method: 'DELETE',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Groups/{id}',
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Groups/${SCIM_GROUP_ID}`,
    expectedPathParams: { app_id: APP_ID, id: SCIM_GROUP_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse({}, 204),
    run: async context => {
      await expect(
        createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimDeleteGroup(PROJECT_ID, APP_ID, SCIM_GROUP_ID),
      ).rejects.toThrow(SyntaxError)
    },
    assertResult: result => expect(result).toBeUndefined(),
  },
  {
    name: 'runs SCIM bulk operations',
    method: 'POST',
    path: '/v1/auth/scim/v2/{project_id}/{app_id}/Bulk',
    expectedPath: `/v1/auth/scim/v2/${PROJECT_ID}/${APP_ID}/Bulk`,
    expectedPathParams: { app_id: APP_ID, project_id: PROJECT_ID },
    expectedHeaders: tenantScimHeaders,
    response: scimResponse(bulkFixture),
    run: context => createAuthSCIMs(context.client, { scimToken: SCIM_TOKEN }).scimBulkOperations(PROJECT_ID, APP_ID),
    assertResult: result => expect(result).toEqual(bulkFixture),
  },
])
