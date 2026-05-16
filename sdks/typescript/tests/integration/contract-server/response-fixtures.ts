import { CONJOIN_REQUEST_ID_HEADER } from '../../../src/core/request-tracing'

export type ContractResponse = {
  status: number
  headers?: Record<string, string>
  body?: unknown
}

export type ConjoinContractResponseOptions = {
  status?: number
  message?: string
  requestId?: string
  headers?: Record<string, string>
}

export type ConjoinContractListOptions = ConjoinContractResponseOptions & {
  cursor?: {
    prev?: string
    next?: string
  }
}

export type ConjoinContractErrorOptions = ConjoinContractResponseOptions & {
  code?: string
  errors?: Array<{
    message: string
    path: string
  }>
}

const jsonHeaders = (options?: ConjoinContractResponseOptions): Record<string, string> => ({
  'content-type': 'application/json',
  ...(options?.requestId ? { [CONJOIN_REQUEST_ID_HEADER]: options.requestId } : {}),
  ...options?.headers,
})

export const conjoinSuccess = <T>(data: T, options?: ConjoinContractResponseOptions): ContractResponse => ({
  status: options?.status ?? 200,
  headers: jsonHeaders(options),
  body: {
    success: true,
    data,
    ...(options?.message ? { message: options.message } : {}),
    status: options?.status ?? 200,
  },
})

export const conjoinList = <T>(data: T[], options?: ConjoinContractListOptions): ContractResponse => ({
  status: options?.status ?? 200,
  headers: jsonHeaders(options),
  body: {
    success: true,
    data,
    ...(options?.cursor ? { cursor: options.cursor } : {}),
    ...(options?.message ? { message: options.message } : {}),
    status: options?.status ?? 200,
  },
})

export const conjoinError = (message: string, options?: ConjoinContractErrorOptions): ContractResponse => ({
  status: options?.status ?? 500,
  headers: jsonHeaders(options),
  body: {
    success: false,
    message,
    ...(options?.code ? { code: options.code } : {}),
    ...(options?.errors ? { errors: options.errors } : {}),
    status: options?.status ?? 500,
  },
})
