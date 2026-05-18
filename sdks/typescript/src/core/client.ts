import {
  conjoinFetch,
  conjoinFetchList,
  conjoinFetchListWithResponse,
  conjoinFetchRaw,
  conjoinFetchWithResponse,
} from './fetch'
import { resolveConjoinRequestId } from './request-tracing'
import type { ConjoinClient, ConjoinConfig, RequestOptions, ResolvedConfig } from './types'
import { DEFAULT_API_VERSION } from './version'

const DEFAULT_BASE_URL = 'https://api.conjoin.cloud'
const DEFAULT_TIMEOUT = 30_000
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_BACKOFF_MS = 500

function resolveConfig(config: ConjoinConfig): ResolvedConfig {
  if (!config.apiKey && !config.publishableKey) {
    throw new Error('Either apiKey or publishableKey must be provided')
  }

  return Object.freeze({
    apiKey: config.apiKey,
    publishableKey: config.publishableKey,
    baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
    apiVersion: config.apiVersion ?? DEFAULT_API_VERSION,
    timeout: config.timeout ?? DEFAULT_TIMEOUT,
    conjoinRequestId: config.conjoinRequestId,
    retry: Object.freeze({
      maxRetries: config.retry?.maxRetries ?? DEFAULT_MAX_RETRIES,
      backoffMs: config.retry?.backoffMs ?? DEFAULT_BACKOFF_MS,
    }),
  })
}

export function createConjoinClient(config: ConjoinConfig): ConjoinClient {
  const resolved = resolveConfig(config)
  const createScopedClient = (requestId: string): ConjoinClient =>
    createConjoinClient({
      ...config,
      conjoinRequestId: requestId,
    })

  return {
    config: resolved,
    fetch: <T>(path: string, options?: RequestOptions) => conjoinFetch<T>(resolved, path, options),
    fetchWithResponse: <T>(path: string, options?: RequestOptions) =>
      conjoinFetchWithResponse<T>(resolved, path, options),
    fetchList: <T>(path: string, options?: RequestOptions) => conjoinFetchList<T>(resolved, path, options),
    fetchListWithResponse: <T>(path: string, options?: RequestOptions) =>
      conjoinFetchListWithResponse<T>(resolved, path, options),
    fetchRaw: (path: string, options?: RequestOptions) => conjoinFetchRaw(resolved, path, options),
    withRequestTrace: async (callback, options) => {
      const requestId = resolveConjoinRequestId(options?.requestId ?? resolved.conjoinRequestId)
      const scopedClient = createScopedClient(requestId)

      return callback(scopedClient, requestId)
    },
  }
}
