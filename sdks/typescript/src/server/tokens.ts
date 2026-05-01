import { createRemoteJWKSet, type JWTPayload, jwtVerify } from 'jose'

export type VerifyTokenOptions = {
  jwksUrl: string
  audience?: string
  issuer?: string
}

export type VerifiedToken = {
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

  const claims = payload as JWTPayload & {
    sid?: string
    org_id?: string
    org_role?: string
  }

  return {
    payload,
    accountId: payload.sub ?? '',
    sessionId: claims.sid ?? '',
    organizationId: claims.org_id ?? null,
    organizationRole: claims.org_role ?? null,
  }
}
