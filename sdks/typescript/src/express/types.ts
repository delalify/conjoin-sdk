import type { VerifiedToken } from '../server/tokens'

declare global {
  namespace Express {
    interface Request {
      auth: VerifiedToken | null
    }
  }
}

export type ConjoinExpressOptions = {
  secretKey?: string
  jwksUrl: string
  audience?: string
  issuer?: string
  cookieName?: string
}
