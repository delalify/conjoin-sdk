import { afterEach, describe, expect, it } from 'vitest'
import { createCloudAccounts, createCloudAPIKeys } from '../../../src/cloud'
import { expectContractRequest, expectHeader, expectJsonBody, expectQuery } from '../contract-server/assertions'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  ACCOUNT_ID,
  API_KEY,
  API_KEY_ID,
  apiKeyFixture,
  cloudAccountFixture,
  PROJECT_ID,
  startCloudContractTest,
} from './cloud-test-utils'

describe('Cloud account SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends account requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'GET',
      path: '/v1/cloud/cloud-account/single',
      handler: () => conjoinSuccess(cloudAccountFixture()),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/cloud-account/single/{project_id}',
      handler: () => conjoinSuccess(cloudAccountFixture()),
    })
    server.register({
      method: 'PUT',
      path: '/v1/cloud/cloud-account/update/{cloud_account_id}',
      handler: () => conjoinSuccess(cloudAccountFixture({ date_updated: '2026-05-16T01:00:00.000Z' })),
    })
    server.register({
      method: 'POST',
      path: '/v1/cloud/cloud-account/initialise',
      handler: () => conjoinSuccess(cloudAccountFixture({ reference_id: 'owner@example.com' })),
    })
    server.register({
      method: 'POST',
      path: '/v1/cloud/cloud-account/refresh',
      handler: () => conjoinSuccess(cloudAccountFixture({ date_updated: '2026-05-16T01:00:00.000Z' })),
    })

    const accounts = createCloudAccounts(context.client)
    const updateBody = { has_accepted_terms: true }
    const initialiseBody = {
      has_accepted_terms: true,
      user_email: 'owner@example.com',
    }

    await expect(accounts.read()).resolves.toEqual(cloudAccountFixture())
    await expect(accounts.readByProject(PROJECT_ID)).resolves.toEqual(cloudAccountFixture())
    await expect(accounts.update(ACCOUNT_ID, updateBody)).resolves.toEqual(
      cloudAccountFixture({ date_updated: '2026-05-16T01:00:00.000Z' }),
    )
    await expect(accounts.initialise(initialiseBody)).resolves.toEqual(
      cloudAccountFixture({ reference_id: 'owner@example.com' }),
    )
    await expect(accounts.refresh()).resolves.toEqual(cloudAccountFixture({ date_updated: '2026-05-16T01:00:00.000Z' }))

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'GET /v1/cloud/cloud-account/single',
      `GET /v1/cloud/cloud-account/single/${PROJECT_ID}`,
      `PUT /v1/cloud/cloud-account/update/${ACCOUNT_ID}`,
      'POST /v1/cloud/cloud-account/initialise',
      'POST /v1/cloud/cloud-account/refresh',
    ])
    expectJsonBody(expectContractRequest(requests[2]), updateBody)
    expectJsonBody(expectContractRequest(requests[3]), initialiseBody)
    expectHeader(expectContractRequest(requests[0]), 'authorization', `Bearer ${API_KEY}`)
  })
})

describe('Cloud API key SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends API key requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'POST',
      path: '/v1/cloud/api-key/new',
      handler: () => conjoinSuccess(apiKeyFixture({ description: 'Created from contract test' })),
    })
    server.register({
      method: 'POST',
      path: '/v1/cloud/api-key/regenerate/{api_key_id}',
      handler: () => conjoinSuccess(apiKeyFixture({ date_updated: '2026-05-16T01:00:00.000Z' })),
    })
    server.register({
      method: 'PATCH',
      path: '/v1/cloud/api-key/update-info/{api_key_id}',
      handler: () => conjoinSuccess(apiKeyFixture({ name: 'Renamed API key' })),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/api-key/',
      handler: () => conjoinList([apiKeyFixture()]),
    })
    server.register({
      method: 'DELETE',
      path: '/v1/cloud/api-key/{api_key_id}',
      handler: () => conjoinSuccess(apiKeyFixture({ date_expired: '2026-05-16T01:00:00.000Z', has_expired: true })),
    })

    const apiKeys = createCloudAPIKeys(context.client)
    const createBody = { name: 'Primary API key', test_mode: true }
    const regenerateBody = { name: 'Regenerated API key', test_mode: true }
    const updateBody = { name: 'Renamed API key' }

    await expect(apiKeys.createApiKey(createBody)).resolves.toEqual(
      apiKeyFixture({ description: 'Created from contract test' }),
    )
    await expect(apiKeys.regenerateApiKey(API_KEY_ID, regenerateBody)).resolves.toEqual(
      apiKeyFixture({ date_updated: '2026-05-16T01:00:00.000Z' }),
    )
    await expect(apiKeys.updateApiKey(API_KEY_ID, updateBody)).resolves.toEqual(
      apiKeyFixture({ name: 'Renamed API key' }),
    )
    await expect(
      apiKeys.readApiKeys({
        cursor: { next: 'cursor_next_123' },
        limit: 1,
        name: 'Primary API key',
        sort: { date_created: 'desc' },
      }),
    ).resolves.toMatchObject({ data: [apiKeyFixture()] })
    await expect(apiKeys.deleteApiKey(API_KEY_ID)).resolves.toEqual(
      apiKeyFixture({ date_expired: '2026-05-16T01:00:00.000Z', has_expired: true }),
    )

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'POST /v1/cloud/api-key/new',
      `POST /v1/cloud/api-key/regenerate/${API_KEY_ID}`,
      `PATCH /v1/cloud/api-key/update-info/${API_KEY_ID}`,
      'GET /v1/cloud/api-key/',
      `DELETE /v1/cloud/api-key/${API_KEY_ID}`,
    ])
    expectJsonBody(expectContractRequest(requests[0]), createBody)
    expectJsonBody(expectContractRequest(requests[1]), regenerateBody)
    expectJsonBody(expectContractRequest(requests[2]), updateBody)
    expectQuery(expectContractRequest(requests[3]), {
      'cursor[next]': 'cursor_next_123',
      limit: '1',
      name: 'Primary API key',
      'sort[date_created]': 'desc',
    })
  })
})
