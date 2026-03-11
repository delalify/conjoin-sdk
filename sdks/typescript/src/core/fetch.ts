import {
  ConjoinAuthenticationError,
  ConjoinError,
  ConjoinNetworkError,
  ConjoinRateLimitError,
  ConjoinTimeoutError,
  ConjoinValidationError,
} from './errors'
import { serializeQuery } from './query-serializer'
import type { ConjoinListResponse, RequestOptions, ResolvedConfig } from './types'
import { SDK_VERSION } from './version'

function buildUrl(config: ResolvedConfig, path: string, query?: Record<string, unknown>): string {
  let url = `${config.baseUrl}/v1/${path}`
  if (query) {
    const qs = serializeQuery(query)
    if (qs) url += `?${qs}`
  }
  return url
}

function buildHeaders(config: ResolvedConfig, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
    'X-Conjoin-SDK-Version': SDK_VERSION,
    ...extra,
  }
  return headers
}

async function handleErrorResponse(response: Response, requestId?: string): Promise<never> {
  let body: Record<string, unknown> = {}
  try {
    body = (await response.json()) as Record<string, unknown>
  } catch {
    /* empty */
  }

  const message = typeof body.message === 'string' ? body.message : response.statusText

  if (response.status === 401) {
    throw new ConjoinAuthenticationError(message, requestId)
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after')
    throw new ConjoinRateLimitError(message, retryAfter ? Number(retryAfter) : undefined, requestId)
  }

  if (response.status === 400 || response.status === 422) {
    const errors = Array.isArray(body.errors) ? (body.errors as Array<{ message: string; path: string }>) : []
    throw new ConjoinValidationError(message, response.status, errors, requestId)
  }

  throw new ConjoinError(message, response.status, 'api_error', requestId)
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function conjoinFetch<T>(config: ResolvedConfig, path: string, options: RequestOptions = {}): Promise<T> {
  const response = await conjoinFetchRaw(config, path, options)
  const requestId = response.headers.get('x-request-id') ?? undefined

  if (!response.ok) {
    await handleErrorResponse(response, requestId)
  }

  const json = (await response.json()) as { data: T }
  return json.data
}

export async function conjoinFetchList<T>(
  config: ResolvedConfig,
  path: string,
  options: RequestOptions = {},
): Promise<ConjoinListResponse<T>> {
  const response = await conjoinFetchRaw(config, path, options)
  const requestId = response.headers.get('x-request-id') ?? undefined

  if (!response.ok) {
    await handleErrorResponse(response, requestId)
  }

  const json = (await response.json()) as ConjoinListResponse<T>
  return json
}

export async function conjoinFetchRaw(
  config: ResolvedConfig,
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const url = buildUrl(config, path, options.query)
  const headers = buildHeaders(config, options.headers)

  const maxRetries = config.retry.maxRetries
  const backoffMs = config.retry.backoffMs
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutSignal = AbortSignal.timeout(config.timeout)
      const signals = options.signal ? AbortSignal.any([timeoutSignal, options.signal]) : timeoutSignal

      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: signals,
      })

      if (!response.ok && isRetryable(response.status) && attempt < maxRetries) {
        const retryAfter = response.headers.get('retry-after')
        const delay = retryAfter ? Number(retryAfter) * 1000 : backoffMs * 2 ** attempt
        await sleep(delay)
        continue
      }

      return response
    } catch (error) {
      lastError = error

      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ConjoinTimeoutError(`Request timed out after ${config.timeout}ms`)
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ConjoinTimeoutError('Request was aborted')
      }

      if (attempt < maxRetries) {
        await sleep(backoffMs * 2 ** attempt)
      }
    }
  }

  throw new ConjoinNetworkError(lastError instanceof Error ? lastError.message : 'Network request failed')
}
