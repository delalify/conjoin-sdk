import type { RequestHandler } from 'express'
import { verifyToken } from '../server/tokens'
import './types'
import type { ConjoinExpressOptions } from './types'

const DEFAULT_COOKIE_NAME = '__conjoin_auth_at'
const MIDDLEWARE_SENTINEL = '__conjoin_middleware_applied'

export function conjoinMiddleware(options: ConjoinExpressOptions): RequestHandler {
  const cookieName = options.cookieName ?? DEFAULT_COOKIE_NAME

  return async (req, _res, next) => {
    Object.defineProperty(req, MIDDLEWARE_SENTINEL, {
      value: true,
      enumerable: false,
    })

    const authHeader = req.headers.authorization
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    const cookieToken = req.cookies?.[cookieName] as string | undefined

    const token = bearerToken ?? cookieToken

    if (!token) {
      req.auth = null
      return next()
    }

    try {
      req.auth = await verifyToken(token, {
        jwksUrl: options.jwksUrl,
        audience: options.audience,
        issuer: options.issuer,
      })
    } catch {
      req.auth = null
    }

    next()
  }
}
