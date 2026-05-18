export type ConjoinConfig = {
  apiKey?: string
  publishableKey?: string
  baseUrl?: string
  apiVersion?: string
  timeout?: number
  conjoinRequestId?: string
  retry?: {
    maxRetries?: number
    backoffMs?: number
  }
}

export type ResolvedConfig = {
  readonly apiKey?: string
  readonly publishableKey?: string
  readonly baseUrl: string
  readonly apiVersion: string
  readonly timeout: number
  readonly conjoinRequestId?: string
  readonly retry: {
    readonly maxRetries: number
    readonly backoffMs: number
  }
}

export type ConjoinRequestTraceScopeOptions = {
  requestId?: string
}

export type ConjoinResponseMetadata = {
  requestId?: string
  status: number
  headers: Headers
}

export type ConjoinFetchResult<T> = {
  data: T
  metadata: ConjoinResponseMetadata
}

export type ConjoinFetchListResult<T> = {
  data: ConjoinListResponse<T>
  metadata: ConjoinResponseMetadata
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, unknown>
  headers?: Record<string, string>
  auth?: { type: 'default' } | { type: 'none' } | { type: 'bearer'; token: string }
  conjoinRequestId?: string
  signal?: AbortSignal
}

export type PaginationParams = {
  limit?: number
  cursor?: string
}

export type Cursor = {
  prev?: string
  next?: string
}

export type ConjoinResponse<T> = {
  success: true
  data: T
  status?: number
  message?: string
  cursor?: Cursor
}

export type ConjoinListResponse<T> = {
  success: true
  data: T[]
  status?: number
  message?: string
  cursor?: Cursor
}

export type ConjoinClient = {
  config: ResolvedConfig
  fetch: <T>(path: string, options?: RequestOptions) => Promise<T>
  fetchWithResponse: <T>(path: string, options?: RequestOptions) => Promise<ConjoinFetchResult<T>>
  fetchList: <T>(path: string, options?: RequestOptions) => Promise<ConjoinListResponse<T>>
  fetchListWithResponse: <T>(path: string, options?: RequestOptions) => Promise<ConjoinFetchListResult<T>>
  fetchRaw: (path: string, options?: RequestOptions) => Promise<Response>
  withRequestTrace: <T>(
    callback: (client: ConjoinClient, requestId: string) => T | Promise<T>,
    options?: ConjoinRequestTraceScopeOptions,
  ) => Promise<T>
}
