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

  const keyPattern = /^pk_(test|live)_(.+)$/
  const match = config.publishableKey.match(keyPattern)
  if (!match) {
    throw new Error(
      `Invalid publishable key format "${config.publishableKey}". Expected "pk_test_<domain>" or "pk_live_<domain>".`,
    )
  }

  const domain = match[2]
  return `https://${domain}/.well-known/jwks.json`
}
