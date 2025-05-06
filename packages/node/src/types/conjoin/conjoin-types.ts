export type ConjoinRequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: HeadersInit
  body?: Record<string, unknown>
  query?: Record<string, unknown>
  returnFullResponse?: boolean
}

type ApiResponseType = 'INFO' | 'SUCCESS' | 'REDIRECT' | 'CLIENT_ERROR' | 'SERVER_ERROR'

export type ConjoinResponseType<TData = unknown> = {
  readonly response: {
    type: ApiResponseType
    code: number
    message: string
  }
  readonly data: TData
  readonly query?: {
    previous_page?:
      | {
          readonly last_in_sort?: string
          readonly sorted_by?: string
          readonly sort_order?: 'asc' | 'desc' | 1 | -1
          readonly limit?: number
          readonly offset?: number
          readonly cursor?: string
        }
      | undefined
    next_page?:
      | {
          readonly last_in_sort?: string
          readonly sorted_by?: string
          readonly sort_order?: 'asc' | 'desc' | 1 | -1
          readonly limit?: number
          readonly offset?: number
          readonly cursor?: string
        }
      | undefined
    total_count?: number
  }
}

export type ConjoinCloudOptions = {
  projectId: string
}

export interface ConjoinBillingOptions extends ConjoinCloudOptions {
  entityId: string
}
