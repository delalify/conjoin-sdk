export type ConjoinConfig = {
  apiKey: string
  baseUrl?: string
  apiVersion?: string
  timeout?: number
  retry?: {
    maxRetries?: number
    backoffMs?: number
  }
}

export type ResolvedConfig = {
  readonly apiKey: string
  readonly baseUrl: string
  readonly apiVersion: string
  readonly timeout: number
  readonly retry: {
    readonly maxRetries: number
    readonly backoffMs: number
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, unknown>
  headers?: Record<string, string>
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
  fetchList: <T>(path: string, options?: RequestOptions) => Promise<ConjoinListResponse<T>>
  fetchRaw: (path: string, options?: RequestOptions) => Promise<Response>
}
