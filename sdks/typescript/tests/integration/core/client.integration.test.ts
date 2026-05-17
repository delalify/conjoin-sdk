import { afterEach, describe, expect, it } from 'vitest'
import { createConjoinClient } from '../../../src/core/client'
import { CONJOIN_REQUEST_ID_HEADER } from '../../../src/core/request-tracing'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../../src/core/version'
import { expectContractRequest, expectHeader } from '../contract-server/assertions'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { startConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { conjoinSuccess } from '../contract-server/response-fixtures'

const READ_PROJECT_PATH = '/v1/cloud/project/public/single/{project_id}'
const PROJECT_ID = 'project_123'
const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'

describe('createConjoinClient contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends core request headers and unwraps response metadata through HTTP', async () => {
    server = await startConjoinContractServer()
    server.register({
      method: 'GET',
      path: READ_PROJECT_PATH,
      handler: () =>
        conjoinSuccess(
          {
            cloud_account_id: 'account_123',
            entity_id: 'entity_123',
            project_id: PROJECT_ID,
            organization_id: 'organization_123',
            tags: ['contract'],
            date_created: '2026-05-16T00:00:00.000Z',
          },
          {
            requestId: REQUEST_ID,
          },
        ),
    })

    const client = createConjoinClient({
      apiKey: 'ck_test_contract',
      baseUrl: server.baseUrl,
    })

    const result = await client.fetchWithResponse<{
      project_id: string
      tags: string[]
    }>(`cloud/project/public/single/${PROJECT_ID}`)

    expect(result.data).toEqual({
      cloud_account_id: 'account_123',
      entity_id: 'entity_123',
      project_id: PROJECT_ID,
      organization_id: 'organization_123',
      tags: ['contract'],
      date_created: '2026-05-16T00:00:00.000Z',
    })
    expect(result.metadata.status).toBe(200)
    expect(result.metadata.requestId).toBe(REQUEST_ID)

    const request = expectContractRequest(server.recorder.last())

    expect(request).toMatchObject({
      method: 'GET',
      path: `/v1/cloud/project/public/single/${PROJECT_ID}`,
      pathTemplate: READ_PROJECT_PATH,
      pathParams: {
        project_id: PROJECT_ID,
      },
      query: {},
      body: undefined,
      rawBody: '',
    })
    expectHeader(request, 'authorization', 'Bearer ck_test_contract')
    expectHeader(request, 'content-type', 'application/json')
    expectHeader(request, 'x-conjoin-api-version', DEFAULT_API_VERSION)
    expectHeader(request, 'x-conjoin-sdk-version', SDK_VERSION)
    expect(request.headers[CONJOIN_REQUEST_ID_HEADER.toLowerCase()]).toBeUndefined()
  })
})
