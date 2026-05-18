import { expect } from 'vitest'
import { createConjoinClient } from '../../../src/core/client'
import { CONJOIN_REQUEST_ID_HEADER } from '../../../src/core/request-tracing'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../../src/core/version'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { startConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { conjoinSuccess } from '../contract-server/response-fixtures'
import { describeSdkContractCases } from '../sdk-contract/run-sdk-contract-cases'

const PROJECT_ID = 'project_123'
const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'
const projectFixture = {
  cloud_account_id: 'account_123',
  date_created: '2026-05-16T00:00:00.000Z',
  entity_id: 'entity_123',
  organization_id: 'organization_123',
  project_id: PROJECT_ID,
  tags: ['contract'],
}

type CoreClientContractTestContext = {
  client: ReturnType<typeof createConjoinClient>
  server: ConjoinContractServer
}

type CoreClientProjectResult = {
  data: unknown
  metadata: {
    requestId?: string
    status: number
  }
}

const startCoreClientContractTest = async (): Promise<CoreClientContractTestContext> => {
  const server = await startConjoinContractServer()
  const client = createConjoinClient({
    apiKey: 'ck_test_contract',
    baseUrl: server.baseUrl,
  })

  return {
    client,
    server,
  }
}

describeSdkContractCases({
  suiteName: 'createConjoinClient contract integration',
  startContext: startCoreClientContractTest,
  defaultExpectedHeaders: {
    authorization: 'Bearer ck_test_contract',
    'content-type': 'application/json',
    'x-conjoin-api-version': DEFAULT_API_VERSION,
    'x-conjoin-sdk-version': SDK_VERSION,
  },
  cases: [
    {
      name: 'sends core request headers and unwraps response metadata through HTTP',
      method: 'GET',
      path: '/v1/cloud/project/public/single/{project_id}',
      expectedPath: `/v1/cloud/project/public/single/${PROJECT_ID}`,
      expectedPathParams: {
        project_id: PROJECT_ID,
      },
      expectedRawBody: '',
      response: conjoinSuccess(projectFixture, {
        requestId: REQUEST_ID,
      }),
      run: context =>
        context.client.fetchWithResponse<{
          project_id: string
          tags: string[]
        }>(`cloud/project/public/single/${PROJECT_ID}`),
      assertResult: result => {
        const response = result as CoreClientProjectResult

        expect(response.data).toEqual(projectFixture)
        expect(response.metadata.status).toBe(200)
        expect(response.metadata.requestId).toBe(REQUEST_ID)
      },
      assertRequest: request => {
        expect(request.headers[CONJOIN_REQUEST_ID_HEADER.toLowerCase()]).toBeUndefined()
      },
    },
  ],
})
