import { expect } from 'vitest'
import { createAuthApps, createAuthCertificates, createAuthClients } from '../../../src/auth'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  APP_ID,
  authAppFixture,
  authCertificateFixture,
  authClientFixture,
  CLIENT_ID,
  describeAuthSdkContractCases,
  REQUEST_ID,
} from './auth-test-utils'

const createAppBody = {
  description: 'Contract auth app',
  name: 'Contract Auth',
  slug: 'contract-auth',
  support_email: 'support@example.com',
}
const updateAppBody = { name: 'Renamed Contract Auth' }
const settingsBody = {}
const customAttributesSchemaBody = {
  custom_attributes_schema: [
    {
      name: 'tier',
      type: 'string' as const,
    },
  ],
}
const createClientBody = {
  metadata: {
    source: 'contract',
  },
  reference_id: 'client_ref_123',
}

describeAuthSdkContractCases('Auth app SDK contract integration', [
  {
    name: 'creates an auth app',
    method: 'POST',
    path: '/v1/auth/app/create',
    expectedBody: createAppBody,
    response: conjoinSuccess(authAppFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => createAuthApps(context.client).create(createAppBody),
    assertResult: result => expect(result).toEqual(authAppFixture()),
  },
  {
    name: 'reads an auth app',
    method: 'GET',
    path: '/v1/auth/app/{app_id}',
    expectedPath: `/v1/auth/app/${APP_ID}`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess(authAppFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthApps(context.client).read(APP_ID),
    assertResult: result => expect(result).toEqual(authAppFixture()),
  },
  {
    name: 'lists auth apps',
    method: 'GET',
    path: '/v1/auth/app/',
    expectedQuery: {
      limit: '1',
      'query[slug]': 'contract-auth',
      'sort[date_created]': 'desc',
    },
    expectedRawBody: '',
    response: conjoinList([authAppFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthApps(context.client).list({
        limit: 1,
        query: { slug: 'contract-auth' },
        sort: { date_created: 'desc' },
      }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authAppFixture()], status: 200 }),
  },
  {
    name: 'updates an auth app',
    method: 'PATCH',
    path: '/v1/auth/app/{app_id}/update',
    expectedBody: updateAppBody,
    expectedPath: `/v1/auth/app/${APP_ID}/update`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess(authAppFixture({ name: 'Renamed Contract Auth' }), { requestId: REQUEST_ID }),
    run: context => createAuthApps(context.client).update(APP_ID, updateAppBody),
    assertResult: result => expect(result).toEqual(authAppFixture({ name: 'Renamed Contract Auth' })),
  },
  {
    name: 'updates auth app settings',
    method: 'PATCH',
    path: '/v1/auth/app/{app_id}/settings/update',
    expectedBody: settingsBody,
    expectedPath: `/v1/auth/app/${APP_ID}/settings/update`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess(authAppFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthApps(context.client).updateSettings(APP_ID, settingsBody),
    assertResult: result => expect(result).toEqual(authAppFixture()),
  },
  {
    name: 'updates auth app custom attributes',
    method: 'PUT',
    path: '/v1/auth/app/{app_id}/settings/custom-attributes-schema',
    expectedBody: customAttributesSchemaBody,
    expectedPath: `/v1/auth/app/${APP_ID}/settings/custom-attributes-schema`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess(
      authAppFixture({ custom_attributes_schema: customAttributesSchemaBody.custom_attributes_schema }),
      {
        requestId: REQUEST_ID,
      },
    ),
    run: context => createAuthApps(context.client).updateCustomAttributes(APP_ID, customAttributesSchemaBody),
    assertResult: result =>
      expect(result).toEqual(
        authAppFixture({ custom_attributes_schema: customAttributesSchemaBody.custom_attributes_schema }),
      ),
  },
])

describeAuthSdkContractCases('Auth client SDK contract integration', [
  {
    name: 'creates an auth client',
    method: 'POST',
    path: '/v1/auth/client/{app_id}/client/create',
    expectedBody: createClientBody,
    expectedPath: `/v1/auth/client/${APP_ID}/client/create`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess(authClientFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => createAuthClients(context.client).create(APP_ID, createClientBody),
    assertResult: result => expect(result).toEqual(authClientFixture()),
  },
  {
    name: 'reads an auth client',
    method: 'GET',
    path: '/v1/auth/client/{app_id}/client/{client_id}',
    expectedPath: `/v1/auth/client/${APP_ID}/client/${CLIENT_ID}`,
    expectedPathParams: { app_id: APP_ID, client_id: CLIENT_ID },
    response: conjoinSuccess(authClientFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthClients(context.client).read(APP_ID, CLIENT_ID),
    assertResult: result => expect(result).toEqual(authClientFixture()),
  },
  {
    name: 'lists auth clients',
    method: 'GET',
    path: '/v1/auth/client/{app_id}/client',
    expectedPath: `/v1/auth/client/${APP_ID}/client`,
    expectedPathParams: { app_id: APP_ID },
    expectedQuery: { limit: '1', 'query[reference_id]': 'client_ref_123' },
    expectedRawBody: '',
    response: conjoinList([authClientFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthClients(context.client).list(APP_ID, { limit: 1, query: { reference_id: 'client_ref_123' } }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authClientFixture()], status: 200 }),
  },
])

describeAuthSdkContractCases('Auth certificate SDK contract integration', [
  {
    name: 'lists auth certificates',
    method: 'GET',
    path: '/v1/auth/certificate/{app_id}/certificate/list',
    expectedPath: `/v1/auth/certificate/${APP_ID}/certificate/list`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinList([authCertificateFixture()], { requestId: REQUEST_ID }),
    run: context => createAuthCertificates(context.client).list(APP_ID),
    assertResult: result => expect(result).toEqual({ success: true, data: [authCertificateFixture()], status: 200 }),
  },
  {
    name: 'reads the active auth certificate',
    method: 'GET',
    path: '/v1/auth/certificate/{app_id}/certificate/active',
    expectedPath: `/v1/auth/certificate/${APP_ID}/certificate/active`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess(authCertificateFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthCertificates(context.client).readActive(APP_ID),
    assertResult: result => expect(result).toEqual(authCertificateFixture()),
  },
  {
    name: 'rotates an auth certificate',
    method: 'POST',
    path: '/v1/auth/certificate/{app_id}/certificate/rotate',
    expectedPath: `/v1/auth/certificate/${APP_ID}/certificate/rotate`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess(authCertificateFixture({ status: 'pending' }), { requestId: REQUEST_ID }),
    run: context => createAuthCertificates(context.client).rotate(APP_ID),
    assertResult: result => expect(result).toEqual(authCertificateFixture({ status: 'pending' })),
  },
  {
    name: 'syncs auth certificate metadata',
    method: 'POST',
    path: '/v1/auth/certificate/{app_id}/certificate/metadata/sync',
    expectedPath: `/v1/auth/certificate/${APP_ID}/certificate/metadata/sync`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess(
      {
        certificates_added: [authCertificateFixture()],
        certificates_removed: [],
        certificates_updated: 1,
        errors: [],
        success: true,
        updated_at: '2026-05-16T01:00:00.000Z',
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createAuthCertificates(context.client).syncMetadata(APP_ID),
    assertResult: result =>
      expect(result).toEqual({
        certificates_added: [authCertificateFixture()],
        certificates_removed: [],
        certificates_updated: 1,
        errors: [],
        success: true,
        updated_at: '2026-05-16T01:00:00.000Z',
      }),
  },
])
