import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createConjoinClient } from '../../core/client'
import { createAuthSCIMs } from '../index'

function mockResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

describe('createAuthSCIMs', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls public metadata endpoints without authorization', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(mockResponse({ data: { schemas: [] } }))
    const client = createConjoinClient({ apiKey: 'ck_test_123' })

    await createAuthSCIMs(client).scimGetServiceProviderConfig()

    const [, init] = fetchMock.mock.calls[0]
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('uses the SCIM bearer token for tenant operations', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(mockResponse({ data: { Resources: [] } }))
    const client = createConjoinClient({ apiKey: 'ck_test_123' })

    await createAuthSCIMs(client, { scimToken: 'scim_token_123' }).scimListUsers('project_123', 'app_123')

    const [, init] = fetchMock.mock.calls[0]
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer scim_token_123')
  })

  it('rejects tenant operations without a SCIM token before sending', async () => {
    const fetchMock = vi.mocked(fetch)
    const client = createConjoinClient({ apiKey: 'ck_test_123' })

    expect(() => createAuthSCIMs(client).scimListUsers('project_123', 'app_123')).toThrow(
      'SCIM token is required for tenant SCIM operations',
    )

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
