import {
  ConjoinAuthenticationError,
  ConjoinError,
  ConjoinNetworkError,
  ConjoinRateLimitError,
  ConjoinTimeoutError,
  ConjoinValidationError,
} from './errors'
import { serializeQuery } from './query-serializer'
import { CONJOIN_REQUEST_ID_HEADER, getConjoinRequestIdFromHeaders, isValidConjoinRequestId } from './request-tracing'
import type {
  ConjoinFetchListResult,
  ConjoinFetchResult,
  ConjoinListResponse,
  RequestOptions,
  ResolvedConfig,
} from './types'
import { SDK_VERSION } from './version'

function buildUrl(config: ResolvedConfig, path: string, query?: Record<string, unknown>): string {
  let url = `${config.baseUrl}/v1/${path}`
  if (query) {
    const qs = serializeQuery(query)
    if (qs) url += `?${qs}`
  }
  return url
}

function withoutManagedHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => {
      const normalizedName = name.toLowerCase()
      return normalizedName !== 'authorization' && normalizedName !== CONJOIN_REQUEST_ID_HEADER.toLowerCase()
    }),
  )
}

function withoutContentTypeHeader(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).filter(([name]) => name.toLowerCase() !== 'content-type'))
}

function resolveAuthorizationHeader(config: ResolvedConfig, auth: RequestOptions['auth']): string | undefined {
  if (auth?.type === 'none') {
    return undefined
  }

  if (auth?.type === 'bearer') {
    if (auth.token.trim().length === 0) {
      throw new ConjoinAuthenticationError('Bearer token must not be empty')
    }

    return `Bearer ${auth.token}`
  }

  const authKey = config.apiKey ?? config.publishableKey
  return authKey ? `Bearer ${authKey}` : undefined
}

function buildHeaders(
  config: ResolvedConfig,
  extra?: Record<string, string>,
  conjoinRequestId?: string,
  auth?: RequestOptions['auth'],
  contentType: RequestOptions['contentType'] = 'application/json',
): Record<string, string> {
  const authorization = resolveAuthorizationHeader(config, auth)
  const extraHeaders =
    contentType === 'multipart/form-data'
      ? withoutContentTypeHeader(withoutManagedHeaders(extra))
      : withoutManagedHeaders(extra)
  const requestId = [conjoinRequestId, getConjoinRequestIdFromHeaders(extra), config.conjoinRequestId].find(
    isValidConjoinRequestId,
  )
  const headers: Record<string, string> = {
    ...(authorization ? { Authorization: authorization } : {}),
    ...(contentType === 'application/json' ? { 'Content-Type': 'application/json' } : {}),
    'X-Conjoin-SDK-Version': SDK_VERSION,
    'X-Conjoin-API-Version': config.apiVersion,
    ...extraHeaders,
    ...(requestId ? { [CONJOIN_REQUEST_ID_HEADER]: requestId } : {}),
  }
  return headers
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

function isBlobBody(body: unknown): body is Blob {
  return typeof Blob !== 'undefined' && body instanceof Blob
}

function appendFormDataValue(formData: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null) {
    return
  }

  if (isBlobBody(value)) {
    formData.append(key, value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendFormDataValue(formData, key, item)
    }
    return
  }

  if (typeof value === 'object') {
    formData.append(key, JSON.stringify(value))
    return
  }

  formData.append(key, String(value))
}

function buildFormData(body: unknown): FormData {
  if (isFormDataBody(body)) {
    return body
  }

  if (!body || typeof body !== 'object' || Array.isArray(body) || isBlobBody(body)) {
    throw new TypeError('multipart/form-data request body must be a FormData instance or object')
  }

  const formData = new FormData()
  for (const [key, value] of Object.entries(body)) {
    appendFormDataValue(formData, key, value)
  }
  return formData
}

function buildRequestBody(body: unknown, contentType: RequestOptions['contentType']): BodyInit | undefined {
  if (body === undefined) {
    return undefined
  }

  if (contentType === 'multipart/form-data') {
    return buildFormData(body)
  }

  return JSON.stringify(body)
}

function readResponseRequestId(response: Response): string | undefined {
  return getConjoinRequestIdFromHeaders(response.headers)
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
  const result = await conjoinFetchWithResponse<T>(config, path, options)

  return result.data
}

export async function conjoinFetchWithResponse<T>(
  config: ResolvedConfig,
  path: string,
  options: RequestOptions = {},
): Promise<ConjoinFetchResult<T>> {
  const response = await conjoinFetchRaw(config, path, options)
  const requestId = readResponseRequestId(response)

  if (!response.ok) {
    await handleErrorResponse(response, requestId)
  }

  const json = (await response.json()) as { data: T }

  return {
    data: json.data,
    metadata: {
      requestId,
      status: response.status,
      headers: response.headers,
    },
  }
}

export async function conjoinFetchList<T>(
  config: ResolvedConfig,
  path: string,
  options: RequestOptions = {},
): Promise<ConjoinListResponse<T>> {
  const result = await conjoinFetchListWithResponse<T>(config, path, options)

  return result.data
}

export async function conjoinFetchListWithResponse<T>(
  config: ResolvedConfig,
  path: string,
  options: RequestOptions = {},
): Promise<ConjoinFetchListResult<T>> {
  const response = await conjoinFetchRaw(config, path, options)
  const requestId = readResponseRequestId(response)

  if (!response.ok) {
    await handleErrorResponse(response, requestId)
  }

  const json = (await response.json()) as ConjoinListResponse<T>

  return {
    data: json,
    metadata: {
      requestId,
      status: response.status,
      headers: response.headers,
    },
  }
}

export async function conjoinFetchRaw(
  config: ResolvedConfig,
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const url = buildUrl(config, path, options.query)
  const contentType = options.contentType ?? 'application/json'
  const headers = buildHeaders(config, options.headers, options.conjoinRequestId, options.auth, contentType)
  const body = buildRequestBody(options.body, contentType)

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
        body,
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
