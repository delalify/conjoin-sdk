import type { Context, MiddlewareHandler } from 'hono'
import type { VerifiedToken } from '../server/tokens'
import type { ConjoinEnv } from './types'

export function getAuth(c: Context<ConjoinEnv>): VerifiedToken | null {
  return c.get('auth') ?? null
}

export function requireAuth(options?: {
  onUnauthenticated?: (c: Context<ConjoinEnv>) => Response
}): MiddlewareHandler<ConjoinEnv> {
  return async (c, next) => {
    const authResult = getAuth(c)

    if (!authResult) {
      if (options?.onUnauthenticated) {
        return options.onUnauthenticated(c) as never
      }

      return c.json({ error: 'Unauthorized' }, 401)
    }

    await next()
  }
}
