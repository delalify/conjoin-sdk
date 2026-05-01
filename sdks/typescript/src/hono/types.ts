import type { VerifiedToken } from '../server/tokens'

export type ConjoinEnv = {
  Variables: {
    auth: VerifiedToken | null
  }
}

export type ConjoinHonoOptions = {
  secretKey?: string
  jwksUrl: string
  audience?: string
  issuer?: string
  cookieName?: string
}
