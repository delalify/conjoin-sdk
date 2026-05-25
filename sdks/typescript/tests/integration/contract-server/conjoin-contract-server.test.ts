import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_API_VERSION } from '../../../src/core/version'
import type { ConjoinContractServer } from './conjoin-contract-server'
import { startConjoinContractServer } from './conjoin-contract-server'
import { conjoinList, conjoinSuccess } from './response-fixtures'

const CREATE_PROJECT_PATH = '/v1/cloud/project/{domain_id}/new'
const ACCOUNT_SESSIONS_PATH = '/v1/auth/session/sessions/account'
const MESSAGING_PHONE_NUMBERS_PATH = '/v1/messaging/phone-numbers/'

describe('Conjoin contract server', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('matches OpenAPI path templates and records request details', async () => {
    server = await startConjoinContractServer()
    server.register({
      method: 'POST',
      path: CREATE_PROJECT_PATH,
      handler: () =>
        conjoinSuccess(
          {
            cloud_account_id: 'account_123',
            entity_id: 'entity_123',
            project_id: 'project_123',
            organization_id: 'organization_123',
            tags: ['contract'],
            date_created: '2026-05-16T00:00:00.000Z',
          },
          {
            status: 201,
          },
        ),
    })

    const response = await fetch(`${server.baseUrl}/v1/cloud/project/domain_123/new?tag=a&tag=b`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-conjoin-api-version': DEFAULT_API_VERSION,
      },
      body: JSON.stringify({
        name: 'Demo project',
      }),
    })

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      data: {
        cloud_account_id: 'account_123',
        entity_id: 'entity_123',
        project_id: 'project_123',
        organization_id: 'organization_123',
        tags: ['contract'],
        date_created: '2026-05-16T00:00:00.000Z',
      },
    })

    const request = server.recorder.last()

    expect(request).toMatchObject({
      method: 'POST',
      path: '/v1/cloud/project/domain_123/new',
      pathTemplate: CREATE_PROJECT_PATH,
      pathParams: {
        domain_id: 'domain_123',
      },
      query: {
        tag: ['a', 'b'],
      },
      body: {
        name: 'Demo project',
      },
    })
    expect(request?.headers['x-conjoin-api-version']).toBe(DEFAULT_API_VERSION)
  })

  it('rejects route registration outside the OpenAPI contract', async () => {
    server = await startConjoinContractServer()

    expect(() =>
      server?.register({
        method: 'GET',
        path: '/v1/not/a/real/conjoin/path',
        handler: () => conjoinSuccess({}),
      }),
    ).toThrow('Route is not declared in OpenAPI')
  })

  it('returns not stubbed for declared routes without fixtures', async () => {
    server = await startConjoinContractServer()

    const response = await fetch(`${server.baseUrl}/v1/cloud/project/domain_123/new`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Demo project',
      }),
    })

    expect(response.status).toBe(501)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_route_not_stubbed',
    })
  })

  it('rejects missing required request bodies before handlers run', async () => {
    let wasHandlerCalled = false
    server = await startConjoinContractServer()
    server.register({
      method: 'POST',
      path: CREATE_PROJECT_PATH,
      handler: () => {
        wasHandlerCalled = true

        return conjoinSuccess({}, { status: 201 })
      },
    })

    const response = await fetch(`${server.baseUrl}/v1/cloud/project/domain_123/new`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_request_invalid',
      errors: [
        {
          path: 'body',
          message: 'is required',
        },
      ],
    })
    expect(wasHandlerCalled).toBe(false)
  })

  it('rejects request bodies that do not match OpenAPI schemas before handlers run', async () => {
    let wasHandlerCalled = false
    server = await startConjoinContractServer()
    server.register({
      method: 'POST',
      path: CREATE_PROJECT_PATH,
      handler: () => {
        wasHandlerCalled = true

        return conjoinSuccess({}, { status: 201 })
      },
    })

    const response = await fetch(`${server.baseUrl}/v1/cloud/project/domain_123/new`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'No',
      }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_request_invalid',
      errors: [
        {
          path: 'body/name',
          message: 'must NOT have fewer than 3 characters',
        },
      ],
    })
    expect(wasHandlerCalled).toBe(false)
  })

  it('rejects declared header parameters that do not match OpenAPI schemas before handlers run', async () => {
    let wasHandlerCalled = false
    server = await startConjoinContractServer()
    server.register({
      method: 'POST',
      path: CREATE_PROJECT_PATH,
      handler: () => {
        wasHandlerCalled = true

        return conjoinSuccess({}, { status: 201 })
      },
    })

    const response = await fetch(`${server.baseUrl}/v1/cloud/project/domain_123/new`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'conjoin-request-id': 'not-valid',
      },
      body: JSON.stringify({
        name: 'Demo project',
      }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_request_invalid',
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: 'header.Conjoin-Request-Id',
        }),
      ]),
    })
    expect(wasHandlerCalled).toBe(false)
  })

  it('rejects missing required query parameters before handlers run', async () => {
    let wasHandlerCalled = false
    server = await startConjoinContractServer()
    server.register({
      method: 'GET',
      path: ACCOUNT_SESSIONS_PATH,
      handler: () => {
        wasHandlerCalled = true

        return conjoinList([])
      },
    })

    const response = await fetch(`${server.baseUrl}${ACCOUNT_SESSIONS_PATH}`)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_request_invalid',
      errors: [
        {
          path: 'query.account_id',
          message: 'is required',
        },
      ],
    })
    expect(wasHandlerCalled).toBe(false)
  })

  it('validates bracketed object query parameters before handlers run', async () => {
    let wasHandlerCalled = false
    server = await startConjoinContractServer()
    server.register({
      method: 'GET',
      path: MESSAGING_PHONE_NUMBERS_PATH,
      handler: () => {
        wasHandlerCalled = true

        return conjoinList([])
      },
    })

    const response = await fetch(`${server.baseUrl}${MESSAGING_PHONE_NUMBERS_PATH}?sort%5Bdate_created%5D=sideways`)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_request_invalid',
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: 'query.sort/date_created',
        }),
      ]),
    })
    expect(wasHandlerCalled).toBe(false)
  })

  it('rejects fixture statuses not declared by OpenAPI', async () => {
    server = await startConjoinContractServer()
    server.register({
      method: 'POST',
      path: CREATE_PROJECT_PATH,
      handler: () =>
        conjoinSuccess(
          {
            project_id: 'project_123',
          },
          {
            status: 202,
          },
        ),
    })

    const response = await fetch(`${server.baseUrl}/v1/cloud/project/domain_123/new`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Demo project',
      }),
    })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_server_error',
    })
  })

  it('rejects fixture response bodies that do not match OpenAPI schemas', async () => {
    server = await startConjoinContractServer()
    server.register({
      method: 'POST',
      path: CREATE_PROJECT_PATH,
      handler: () =>
        conjoinSuccess(
          {
            project_id: 'project_123',
          },
          {
            status: 201,
          },
        ),
    })

    const response = await fetch(`${server.baseUrl}/v1/cloud/project/domain_123/new`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Demo project',
      }),
    })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_server_error',
      message: expect.stringContaining('Response body does not match OpenAPI schema'),
    })
  })
})
