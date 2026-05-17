import { afterEach, describe, expect, it } from 'vitest'
import { createCloudProjects } from '../../../src/cloud'
import { createConjoinClient } from '../../../src/core/client'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../../src/core/version'
import { expectContractRequest, expectHeader, expectJsonBody, expectQuery } from '../contract-server/assertions'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { startConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'

const API_KEY = 'ck_test_cloud_project_contract'
const CREATE_PROJECT_PATH = '/v1/cloud/project/{domain_id}/new'
const READ_PROJECT_PATH = '/v1/cloud/project/public/single/{project_id}'
const LIST_PROJECTS_PATH = '/v1/cloud/project/many/{domain_id}'
const DOMAIN_ID = 'domain_123'
const PROJECT_ID = 'project_123'
const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'

const projectFixture = (overrides: Record<string, unknown> = {}) => ({
  cloud_account_id: 'account_123',
  entity_id: 'entity_123',
  project_id: PROJECT_ID,
  organization_id: 'organization_123',
  tags: ['contract'],
  date_created: '2026-05-16T00:00:00.000Z',
  ...overrides,
})

describe('Cloud project SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('creates a cloud project through the generated SDK method', async () => {
    server = await startConjoinContractServer()
    server.register({
      method: 'POST',
      path: CREATE_PROJECT_PATH,
      handler: () =>
        conjoinSuccess(projectFixture({ name: 'Demo project' }), {
          requestId: REQUEST_ID,
          status: 201,
        }),
    })

    const projects = createCloudProjects(
      createConjoinClient({
        apiKey: API_KEY,
        baseUrl: server.baseUrl,
      }),
    )
    const createBody = {
      custom_id: 'project_custom_123',
      name: 'Demo project',
      tags: ['contract', 'cloud'],
    }

    const result = await projects.create(DOMAIN_ID, createBody)

    expect(result).toEqual(projectFixture({ name: 'Demo project' }))

    const request = expectContractRequest(server.recorder.last())

    expect(request).toMatchObject({
      method: 'POST',
      path: `/v1/cloud/project/${DOMAIN_ID}/new`,
      pathTemplate: CREATE_PROJECT_PATH,
      pathParams: {
        domain_id: DOMAIN_ID,
      },
      query: {},
    })
    expectHeader(request, 'authorization', `Bearer ${API_KEY}`)
    expectHeader(request, 'content-type', 'application/json')
    expectHeader(request, 'x-conjoin-api-version', DEFAULT_API_VERSION)
    expectHeader(request, 'x-conjoin-sdk-version', SDK_VERSION)
    expectJsonBody(request, createBody)
  })

  it('reads a cloud project through the generated SDK method', async () => {
    server = await startConjoinContractServer()
    server.register({
      method: 'GET',
      path: READ_PROJECT_PATH,
      handler: () => conjoinSuccess(projectFixture(), { requestId: REQUEST_ID }),
    })

    const projects = createCloudProjects(
      createConjoinClient({
        apiKey: API_KEY,
        baseUrl: server.baseUrl,
      }),
    )

    const result = await projects.read(PROJECT_ID)

    expect(result).toEqual(projectFixture())

    const request = expectContractRequest(server.recorder.last())

    expect(request).toMatchObject({
      method: 'GET',
      path: `/v1/cloud/project/public/single/${PROJECT_ID}`,
      pathTemplate: READ_PROJECT_PATH,
      pathParams: {
        project_id: PROJECT_ID,
      },
      body: undefined,
      rawBody: '',
    })
    expectQuery(request, {})
    expectHeader(request, 'authorization', `Bearer ${API_KEY}`)
  })

  it('lists cloud projects through the generated SDK method with query parameters', async () => {
    server = await startConjoinContractServer()
    server.register({
      method: 'GET',
      path: LIST_PROJECTS_PATH,
      handler: () =>
        conjoinList([projectFixture(), projectFixture({ project_id: 'project_456' })], {
          cursor: {
            next: 'cursor_next_123',
            prev: 'cursor_prev_123',
          },
          requestId: REQUEST_ID,
        }),
    })

    const projects = createCloudProjects(
      createConjoinClient({
        apiKey: API_KEY,
        baseUrl: server.baseUrl,
      }),
    )

    const result = await projects.list(DOMAIN_ID, {
      cursor: {
        next: 'cursor_next_123',
      },
      limit: 2,
      query: {
        name: 'Demo project',
      },
      sort: {
        date_created: 'desc',
      },
    })

    expect(result).toEqual({
      success: true,
      data: [projectFixture(), projectFixture({ project_id: 'project_456' })],
      cursor: {
        next: 'cursor_next_123',
        prev: 'cursor_prev_123',
      },
      status: 200,
    })

    const request = expectContractRequest(server.recorder.last())

    expect(request).toMatchObject({
      method: 'GET',
      path: `/v1/cloud/project/many/${DOMAIN_ID}`,
      pathTemplate: LIST_PROJECTS_PATH,
      pathParams: {
        domain_id: DOMAIN_ID,
      },
      body: undefined,
      rawBody: '',
    })
    expectQuery(request, {
      'cursor[next]': 'cursor_next_123',
      limit: '2',
      'query[name]': 'Demo project',
      'sort[date_created]': 'desc',
    })
    expectHeader(request, 'authorization', `Bearer ${API_KEY}`)
  })
})
