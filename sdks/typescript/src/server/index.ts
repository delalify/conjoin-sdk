import { createHmac, timingSafeEqual } from 'node:crypto'
import { createRemoteJWKSet, type JWTPayload, jwtVerify } from 'jose'
import { createConjoinClient } from '../core/client'
import type { ConjoinClient } from '../core/types'

type ServerOptions = {
  apiKey: string
  baseUrl?: string
}

export function createConjoinServer(options: ServerOptions): ConjoinClient {
  return createConjoinClient({
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
  })
}

type VerifyTokenOptions = {
  jwksUrl: string
  audience?: string
  issuer?: string
}

type VerifiedToken = {
  payload: JWTPayload
  accountId: string
  sessionId: string
  organizationId: string | null
  organizationRole: string | null
}

const jwksSets = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function getJwksSet(url: string) {
  let jwks = jwksSets.get(url)
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(url))
    jwksSets.set(url, jwks)
  }
  return jwks
}

export async function verifyToken(token: string, options: VerifyTokenOptions): Promise<VerifiedToken> {
  const jwks = getJwksSet(options.jwksUrl)

  const { payload } = await jwtVerify(token, jwks, {
    audience: options.audience,
    issuer: options.issuer,
  })

  const claims = payload as JWTPayload & { sid?: string; org_id?: string; org_role?: string }

  return {
    payload,
    accountId: payload.sub ?? '',
    sessionId: claims.sid ?? '',
    organizationId: claims.org_id ?? null,
    organizationRole: claims.org_role ?? null,
  }
}

export function verifyWebhook(payload: string | Buffer, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  const expected = hmac.digest('hex')

  if (signature.length !== expected.length) return false

  const sigBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  if (sigBuffer.length !== expectedBuffer.length) return false

  return timingSafeEqual(sigBuffer, expectedBuffer)
}

type BrandingOptions = {
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

export type { VerifiedToken, VerifyTokenOptions, ServerOptions, BrandingOptions }
