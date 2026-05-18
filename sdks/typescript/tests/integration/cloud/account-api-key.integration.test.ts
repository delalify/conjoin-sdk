import { expect } from 'vitest'
import { createCloudAccounts, createCloudAPIKeys } from '../../../src/cloud'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  ACCOUNT_ID,
  API_KEY_ID,
  apiKeyFixture,
  cloudAccountFixture,
  describeCloudSdkContractCases,
  PROJECT_ID,
} from './cloud-test-utils'

const ACCOUNT_UPDATED_AT = '2026-05-16T01:00:00.000Z'
const API_KEY_EXPIRED_AT = '2026-05-16T01:00:00.000Z'
const API_KEY_UPDATED_AT = '2026-05-16T01:00:00.000Z'
const initialiseBody = {
  has_accepted_terms: true,
  user_email: 'owner@example.com',
}
const updateAccountBody = { has_accepted_terms: true }
const createApiKeyBody = { name: 'Primary API key', test_mode: true }
const regenerateApiKeyBody = { name: 'Regenerated API key', test_mode: true }
const updateApiKeyBody = { name: 'Renamed API key' }

describeCloudSdkContractCases('Cloud account SDK contract integration', [
  {
    name: 'reads the current cloud account',
    method: 'GET',
    path: '/v1/cloud/cloud-account/single',
    response: conjoinSuccess(cloudAccountFixture()),
    run: context => createCloudAccounts(context.client).read(),
    assertResult: result => expect(result).toEqual(cloudAccountFixture()),
  },
  {
    name: 'reads a cloud account by project',
    method: 'GET',
    path: '/v1/cloud/cloud-account/single/{project_id}',
    expectedPath: `/v1/cloud/cloud-account/single/${PROJECT_ID}`,
    expectedPathParams: {
      project_id: PROJECT_ID,
    },
    response: conjoinSuccess(cloudAccountFixture()),
    run: context => createCloudAccounts(context.client).readByProject(PROJECT_ID),
    assertResult: result => expect(result).toEqual(cloudAccountFixture()),
  },
  {
    name: 'updates a cloud account',
    method: 'PUT',
    path: '/v1/cloud/cloud-account/update/{cloud_account_id}',
    expectedBody: updateAccountBody,
    expectedPath: `/v1/cloud/cloud-account/update/${ACCOUNT_ID}`,
    expectedPathParams: {
      cloud_account_id: ACCOUNT_ID,
    },
    response: conjoinSuccess(cloudAccountFixture({ date_updated: ACCOUNT_UPDATED_AT })),
    run: context => createCloudAccounts(context.client).update(ACCOUNT_ID, updateAccountBody),
    assertResult: result => expect(result).toEqual(cloudAccountFixture({ date_updated: ACCOUNT_UPDATED_AT })),
  },
  {
    name: 'initialises a cloud account',
    method: 'POST',
    path: '/v1/cloud/cloud-account/initialise',
    expectedBody: initialiseBody,
    response: conjoinSuccess(cloudAccountFixture({ reference_id: 'owner@example.com' })),
    run: context => createCloudAccounts(context.client).initialise(initialiseBody),
    assertResult: result => expect(result).toEqual(cloudAccountFixture({ reference_id: 'owner@example.com' })),
  },
  {
    name: 'refreshes a cloud account',
    method: 'POST',
    path: '/v1/cloud/cloud-account/refresh',
    response: conjoinSuccess(cloudAccountFixture({ date_updated: ACCOUNT_UPDATED_AT })),
    run: context => createCloudAccounts(context.client).refresh(),
    assertResult: result => expect(result).toEqual(cloudAccountFixture({ date_updated: ACCOUNT_UPDATED_AT })),
  },
])

describeCloudSdkContractCases('Cloud API key SDK contract integration', [
  {
    name: 'creates an API key',
    method: 'POST',
    path: '/v1/cloud/api-key/new',
    expectedBody: createApiKeyBody,
    response: conjoinSuccess(apiKeyFixture({ description: 'Created from contract test' })),
    run: context => createCloudAPIKeys(context.client).createApiKey(createApiKeyBody),
    assertResult: result => expect(result).toEqual(apiKeyFixture({ description: 'Created from contract test' })),
  },
  {
    name: 'regenerates an API key',
    method: 'POST',
    path: '/v1/cloud/api-key/regenerate/{api_key_id}',
    expectedBody: regenerateApiKeyBody,
    expectedPath: `/v1/cloud/api-key/regenerate/${API_KEY_ID}`,
    expectedPathParams: {
      api_key_id: API_KEY_ID,
    },
    response: conjoinSuccess(apiKeyFixture({ date_updated: API_KEY_UPDATED_AT })),
    run: context => createCloudAPIKeys(context.client).regenerateApiKey(API_KEY_ID, regenerateApiKeyBody),
    assertResult: result => expect(result).toEqual(apiKeyFixture({ date_updated: API_KEY_UPDATED_AT })),
  },
  {
    name: 'updates an API key',
    method: 'PATCH',
    path: '/v1/cloud/api-key/update-info/{api_key_id}',
    expectedBody: updateApiKeyBody,
    expectedPath: `/v1/cloud/api-key/update-info/${API_KEY_ID}`,
    expectedPathParams: {
      api_key_id: API_KEY_ID,
    },
    response: conjoinSuccess(apiKeyFixture({ name: 'Renamed API key' })),
    run: context => createCloudAPIKeys(context.client).updateApiKey(API_KEY_ID, updateApiKeyBody),
    assertResult: result => expect(result).toEqual(apiKeyFixture({ name: 'Renamed API key' })),
  },
  {
    name: 'lists API keys',
    method: 'GET',
    path: '/v1/cloud/api-key/',
    expectedQuery: {
      'cursor[next]': 'cursor_next_123',
      limit: '1',
      name: 'Primary API key',
      'sort[date_created]': 'desc',
    },
    response: conjoinList([apiKeyFixture()]),
    run: context =>
      createCloudAPIKeys(context.client).readApiKeys({
        cursor: { next: 'cursor_next_123' },
        limit: 1,
        name: 'Primary API key',
        sort: { date_created: 'desc' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [apiKeyFixture()] }),
  },
  {
    name: 'deletes an API key',
    method: 'DELETE',
    path: '/v1/cloud/api-key/{api_key_id}',
    expectedPath: `/v1/cloud/api-key/${API_KEY_ID}`,
    expectedPathParams: {
      api_key_id: API_KEY_ID,
    },
    response: conjoinSuccess(apiKeyFixture({ date_expired: API_KEY_EXPIRED_AT, has_expired: true })),
    run: context => createCloudAPIKeys(context.client).deleteApiKey(API_KEY_ID),
    assertResult: result =>
      expect(result).toEqual(apiKeyFixture({ date_expired: API_KEY_EXPIRED_AT, has_expired: true })),
  },
])
