import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createConjoinClient } from '../client'
import { CONJOIN_REQUEST_ID_HEADER, isValidConjoinRequestId } from '../request-tracing'
import { DEFAULT_API_VERSION } from '../version'

const VALID_REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'

function mockResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

describe('createConjoinClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('applies default config values', () => {
    const client = createConjoinClient({ apiKey: 'ck_test_123' })
    expect(client.config.apiKey).toBe('ck_test_123')
    expect(client.config.baseUrl).toBe('https://api.conjoin.cloud')
    expect(client.config.apiVersion).toBe(DEFAULT_API_VERSION)
    expect(client.config.timeout).toBe(30_000)
    expect(client.config.retry.maxRetries).toBe(3)
    expect(client.config.retry.backoffMs).toBe(500)
  })

  it('accepts custom config values', () => {
    const client = createConjoinClient({
      apiKey: 'ck_live_456',
      baseUrl: 'https://custom.api.conjoin.cloud',
      apiVersion: '2026-06-15',
      timeout: 10_000,
      retry: { maxRetries: 5, backoffMs: 1000 },
    })
    expect(client.config.baseUrl).toBe('https://custom.api.conjoin.cloud')
    expect(client.config.apiVersion).toBe('2026-06-15')
    expect(client.config.timeout).toBe(10_000)
    expect(client.config.retry.maxRetries).toBe(5)
    expect(client.config.retry.backoffMs).toBe(1000)
  })

  it('freezes the config object', () => {
    const client = createConjoinClient({ apiKey: 'ck_test_123' })
    expect(Object.isFrozen(client.config)).toBe(true)
    expect(Object.isFrozen(client.config.retry)).toBe(true)
  })

  it('exposes fetch methods', () => {
    const client = createConjoinClient({ apiKey: 'ck_test_123' })
    expect(typeof client.fetch).toBe('function')
    expect(typeof client.fetchWithResponse).toBe('function')
    expect(typeof client.fetchList).toBe('function')
    expect(typeof client.fetchListWithResponse).toBe('function')
    expect(typeof client.fetchRaw).toBe('function')
    expect(typeof client.withRequestTrace).toBe('function')
  })

  it('creates a scoped client with one shared Conjoin request ID', async () => {
    const client = createConjoinClient({ apiKey: 'ck_test_123' })

    const result = await client.withRequestTrace((scopedClient, requestId) => {
      expect(isValidConjoinRequestId(requestId)).toBe(true)
      expect(scopedClient.config.conjoinRequestId).toBe(requestId)

      return requestId
    })

    expect(isValidConjoinRequestId(result)).toBe(true)
  })

  it('accepts an explicit request ID for scoped calls', async () => {
    const client = createConjoinClient({ apiKey: 'ck_test_123' })

    const result = await client.withRequestTrace((_scopedClient, requestId) => requestId, {
      requestId: VALID_REQUEST_ID,
    })

    expect(result).toBe(VALID_REQUEST_ID)
  })

  it('sends the scoped Conjoin request ID on requests inside withRequestTrace', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(mockResponse({ data: { id: 'cust_123' } }))
    const client = createConjoinClient({ apiKey: 'ck_test_123' })

    const requestId = await client.withRequestTrace(async (scopedClient, scopedRequestId) => {
      await scopedClient.fetch('billing/customers/cust_123')

      expect(fetchMock).toHaveBeenCalledOnce()
      const [, init] = fetchMock.mock.calls[0]
      const headers = init?.headers as Record<string, string>

      expect(headers[CONJOIN_REQUEST_ID_HEADER]).toBe(scopedRequestId)

      return scopedRequestId
    })

    expect(isValidConjoinRequestId(requestId)).toBe(true)
  })

  it('ignores invalid response request IDs through fetchWithResponse metadata', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse(
        { data: { id: 'cust_123' } },
        {
          headers: {
            [CONJOIN_REQUEST_ID_HEADER]: 'not-valid',
          },
        },
      ),
    )
    const client = createConjoinClient({ apiKey: 'ck_test_123' })

    const result = await client.fetchWithResponse<{ id: string }>('billing/customers/cust_123')

    expect(result.data).toEqual({ id: 'cust_123' })
    expect(result.metadata.requestId).toBeUndefined()
    expect(result.metadata.status).toBe(200)
  })

  it('exposes valid response request IDs through fetchListWithResponse metadata', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse(
        {
          success: true,
          data: [{ id: 'cust_123' }],
          cursor: { next: 'cursor_123' },
        },
        {
          headers: {
            [CONJOIN_REQUEST_ID_HEADER]: VALID_REQUEST_ID,
          },
        },
      ),
    )
    const client = createConjoinClient({ apiKey: 'ck_test_123' })

    const result = await client.fetchListWithResponse<{ id: string }>('billing/customers')

    expect(result.data.data).toEqual([{ id: 'cust_123' }])
    expect(result.data.cursor?.next).toBe('cursor_123')
    expect(result.metadata.requestId).toBe(VALID_REQUEST_ID)
  })
})
