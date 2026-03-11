import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConjoinAuthenticationError,
  ConjoinError,
  ConjoinNetworkError,
  ConjoinRateLimitError,
  ConjoinValidationError,
} from '../errors'
import { conjoinFetch, conjoinFetchList, conjoinFetchRaw } from '../fetch'
import type { ResolvedConfig } from '../types'

const config: ResolvedConfig = Object.freeze({
  apiKey: 'ck_test_123',
  baseUrl: 'https://api.conjoin.cloud',
  timeout: 30_000,
  retry: Object.freeze({ maxRetries: 0, backoffMs: 100 }),
})

const configWithRetry: ResolvedConfig = Object.freeze({
  ...config,
  retry: Object.freeze({ maxRetries: 2, backoffMs: 10 }),
})

function mockResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

describe('conjoinFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends GET request with auth headers', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(mockResponse({ data: { id: '1' } }))

    await conjoinFetch(config, 'billing/customers')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.conjoin.cloud/v1/billing/customers')
    expect(init?.method).toBe('GET')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer ck_test_123')
  })

  it('unwraps response envelope and returns data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ data: { id: '1', name: 'Test' } }))

    const result = await conjoinFetch<{ id: string; name: string }>(config, 'billing/customers/cust_1')
    expect(result).toEqual({ id: '1', name: 'Test' })
  })

  it('sends POST request with body', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(mockResponse({ data: { id: '2' } }))

    await conjoinFetch(config, 'billing/customers', {
      method: 'POST',
      body: { name: 'New Customer' },
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"name":"New Customer"}')
  })

  it('appends query params to URL', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(mockResponse({ data: [] }))

    await conjoinFetch(config, 'billing/customers', {
      query: { limit: 10, status: 'active' },
    })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.conjoin.cloud/v1/billing/customers?limit=10&status=active')
  })

  it('throws ConjoinAuthenticationError on 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ message: 'Invalid API key' }, { status: 401 }))

    await expect(conjoinFetch(config, 'billing/customers')).rejects.toThrow(ConjoinAuthenticationError)
  })

  it('throws ConjoinValidationError on 422', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({ message: 'Validation failed', errors: [{ message: 'required', path: 'name' }] }, { status: 422 }),
    )

    try {
      await conjoinFetch(config, 'billing/customers')
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ConjoinValidationError)
      const validationErr = err as ConjoinValidationError
      expect(validationErr.errors).toHaveLength(1)
      expect(validationErr.errors[0].path).toBe('name')
    }
  })

  it('throws ConjoinRateLimitError on 429', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Too many requests' }), {
        status: 429,
        headers: { 'retry-after': '30' },
      }),
    )

    try {
      await conjoinFetch(config, 'billing/customers')
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ConjoinRateLimitError)
      expect((err as ConjoinRateLimitError).retryAfter).toBe(30)
    }
  })

  it('throws ConjoinError on 500', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ message: 'Internal server error' }, { status: 500 }))

    await expect(conjoinFetch(config, 'billing/customers')).rejects.toThrow(ConjoinError)
  })

  it('throws ConjoinNetworkError on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('fetch failed'))

    await expect(conjoinFetch(config, 'billing/customers')).rejects.toThrow(ConjoinNetworkError)
  })
})

describe('conjoinFetchList', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns full list response with cursor', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({
        success: true,
        data: [{ id: '1' }, { id: '2' }],
        cursor: { next: 'cursor_abc' },
      }),
    )

    const result = await conjoinFetchList(config, 'billing/customers')
    expect(result.data).toHaveLength(2)
    expect(result.cursor?.next).toBe('cursor_abc')
  })
})

describe('conjoinFetchRaw', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns raw Response object', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ data: 'raw' }))

    const response = await conjoinFetchRaw(config, 'ai/completions')
    expect(response).toBeInstanceOf(Response)
    expect(response.ok).toBe(true)
  })
})

describe('retry behavior', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retries on 500 up to maxRetries', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(mockResponse({ message: 'error' }, { status: 500 }))
      .mockResolvedValueOnce(mockResponse({ message: 'error' }, { status: 500 }))
      .mockResolvedValueOnce(mockResponse({ data: { id: '1' } }))

    const result = await conjoinFetch<{ id: string }>(configWithRetry, 'billing/customers')
    expect(result).toEqual({ id: '1' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting retries', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(mockResponse({ message: 'error' }, { status: 500 }))
      .mockResolvedValueOnce(mockResponse({ message: 'error' }, { status: 500 }))
      .mockResolvedValueOnce(mockResponse({ message: 'error' }, { status: 500 }))

    await expect(conjoinFetch(configWithRetry, 'billing/customers')).rejects.toThrow(ConjoinError)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('retries on network errors', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(mockResponse({ data: { id: '1' } }))

    const result = await conjoinFetch<{ id: string }>(configWithRetry, 'billing/customers')
    expect(result).toEqual({ id: '1' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not retry 401 errors', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(mockResponse({ message: 'Unauthorized' }, { status: 401 }))

    await expect(conjoinFetch(configWithRetry, 'billing/customers')).rejects.toThrow(ConjoinAuthenticationError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
