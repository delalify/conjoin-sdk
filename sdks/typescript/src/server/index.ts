import { createConjoinClient } from '../core/client'
import type { ConjoinClient } from '../core/types'

export type ServerOptions = {
  apiKey: string
  baseUrl?: string
}

export function createConjoinServer(options: ServerOptions): ConjoinClient {
  return createConjoinClient({
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
  })
}

export type BrandingOptions = {
  baseUrl?: string
}

type SdkConfigResponse = {
  branding: Record<string, unknown> | null
}

export async function fetchConjoinBranding(
  publishableKey: string,
  options?: BrandingOptions,
): Promise<Record<string, unknown> | null> {
  const client = createConjoinClient({
    publishableKey,
    baseUrl: options?.baseUrl,
  })

  const config = await client.fetch<SdkConfigResponse>('cloud/sdk-config')
  return config.branding
}

export type {
  VerifiedToken,
  VerifyTokenOptions,
} from './tokens'
export { verifyToken } from './tokens'
export { verifyWebhook } from './webhooks'
