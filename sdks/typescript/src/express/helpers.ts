import type { Request, RequestHandler, Response } from 'express'
import type { VerifiedToken } from '../server/tokens'
import './types'

const MIDDLEWARE_SENTINEL = '__conjoin_middleware_applied'

export function getAuth(req: Request): VerifiedToken | null {
  if (!Object.hasOwn(req, MIDDLEWARE_SENTINEL)) {
    throw new Error(
      'conjoinMiddleware() must be applied before calling getAuth(). Add it to your Express app with app.use(conjoinMiddleware({ ... })).',
    )
  }

  return req.auth ?? null
}

export function requireAuth(options?: { onUnauthenticated?: (req: Request, res: Response) => void }): RequestHandler {
  return (req, res, next) => {
    const authResult = getAuth(req)

    if (!authResult) {
      if (options?.onUnauthenticated) {
        options.onUnauthenticated(req, res)
        return
      }

      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    next()
  }
}
