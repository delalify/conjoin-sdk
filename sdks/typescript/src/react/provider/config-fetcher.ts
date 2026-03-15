import type { ConjoinClient } from '../../core/types'
import type { ConjoinSdkConfig } from './types'

let cachedConfig: ConjoinSdkConfig | null = null

export async function fetchSdkConfig(client: ConjoinClient): Promise<ConjoinSdkConfig> {
  if (cachedConfig) return cachedConfig

  const config = await client.fetch<ConjoinSdkConfig>('cloud/sdk-config')
  cachedConfig = config
  return config
}

export function getCachedSdkConfig(): ConjoinSdkConfig | null {
  return cachedConfig
}

export function clearSdkConfigCache(): void {
  cachedConfig = null
}
