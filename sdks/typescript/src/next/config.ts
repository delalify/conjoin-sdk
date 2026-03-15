import type { NextAdapterConfig } from './types'

export function resolveConfig(overrides?: Partial<NextAdapterConfig>): NextAdapterConfig {
  return {
    secretKey: overrides?.secretKey ?? process.env.CONJOIN_SECRET_KEY,
    publishableKey: overrides?.publishableKey ?? process.env.CONJOIN_PUBLISHABLE_KEY,
    jwksUrl: overrides?.jwksUrl,
    authDomain: overrides?.authDomain,
  }
}

export function getJwksUrl(config: NextAdapterConfig): string {
  if (config.jwksUrl) return config.jwksUrl

  if (config.authDomain) {
    return `https://${config.authDomain}/.well-known/jwks.json`
  }

  if (!config.publishableKey) {
    throw new Error('Conjoin Next.js adapter requires a publishableKey, authDomain, or jwksUrl to verify tokens')
  }

  const parts = config.publishableKey.split('_')
  const domain = parts[parts.length - 1]
  return `https://${domain}/.well-known/jwks.json`
}
