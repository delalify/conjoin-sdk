import type { ConjoinClient } from '../../core/types'
import type { ConjoinSdkConfig } from './types'

let cachedConfig: ConjoinSdkConfig | null = null
let inflightPromise: Promise<ConjoinSdkConfig> | null = null

export async function fetchSdkConfig(client: ConjoinClient): Promise<ConjoinSdkConfig> {
  if (cachedConfig) return cachedConfig

  if (inflightPromise) return inflightPromise

  inflightPromise = client
    .fetch<ConjoinSdkConfig>('cloud/sdk-config')
    .then(config => {
      cachedConfig = config
      return config
    })
    .finally(() => {
      inflightPromise = null
    })

  return inflightPromise
}

export function getCachedSdkConfig(): ConjoinSdkConfig | null {
  return cachedConfig
}

export function clearSdkConfigCache(): void {
  cachedConfig = null
  inflightPromise = null
}
