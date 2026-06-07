import { createRemoteJWKSet, type JWTPayload, jwtVerify } from 'jose'

export const SESSION_TOKEN_AUDIENCE = 'conjoin-auth-session'

export type VerifyTokenOptions = {
  jwksUrl: string
  audience?: string
  issuer?: string
}

export type VerifiedToken = {
  payload: JWTPayload
  accountId: string
  sessionId: string
  clientId: string
  appId: string
  liveMode: boolean
  organizationId: string | null
  organizationRoles: string[]
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

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readOrganizationId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function readOrganizationRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((role): role is string => typeof role === 'string')
}

export async function verifyToken(token: string, options: VerifyTokenOptions): Promise<VerifiedToken> {
  const jwks = getJwksSet(options.jwksUrl)

  const { payload } = await jwtVerify(token, jwks, {
    audience: options.audience ?? SESSION_TOKEN_AUDIENCE,
    issuer: options.issuer,
  })

  const claims = payload as JWTPayload & {
    session_id?: unknown
    client_id?: unknown
    app_id?: unknown
    live_mode?: unknown
    organization_id?: unknown
    organization_roles?: unknown
  }

  return {
    payload,
    accountId: readString(payload.sub),
    sessionId: readString(claims.session_id),
    clientId: readString(claims.client_id),
    appId: readString(claims.app_id),
    liveMode: claims.live_mode === true,
    organizationId: readOrganizationId(claims.organization_id),
    organizationRoles: readOrganizationRoles(claims.organization_roles),
  }
}
