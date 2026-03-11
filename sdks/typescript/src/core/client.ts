import { conjoinFetch, conjoinFetchList, conjoinFetchRaw } from './fetch'
import type { ConjoinClient, ConjoinConfig, RequestOptions, ResolvedConfig } from './types'
import { DEFAULT_API_VERSION } from './version'

const DEFAULT_BASE_URL = 'https://api.conjoin.cloud'
const DEFAULT_TIMEOUT = 30_000
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_BACKOFF_MS = 500

function resolveConfig(config: ConjoinConfig): ResolvedConfig {
  return Object.freeze({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
    apiVersion: config.apiVersion ?? DEFAULT_API_VERSION,
    timeout: config.timeout ?? DEFAULT_TIMEOUT,
    retry: Object.freeze({
      maxRetries: config.retry?.maxRetries ?? DEFAULT_MAX_RETRIES,
      backoffMs: config.retry?.backoffMs ?? DEFAULT_BACKOFF_MS,
    }),
  })
}

export function createConjoinClient(config: ConjoinConfig): ConjoinClient {
  const resolved = resolveConfig(config)

  return {
    config: resolved,
    fetch: <T>(path: string, options?: RequestOptions) => conjoinFetch<T>(resolved, path, options),
    fetchList: <T>(path: string, options?: RequestOptions) => conjoinFetchList<T>(resolved, path, options),
    fetchRaw: (path: string, options?: RequestOptions) => conjoinFetchRaw(resolved, path, options),
  }
}
