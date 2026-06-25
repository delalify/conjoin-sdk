import type { NextRequest } from 'next/server'
import { verifyToken } from '../server/tokens'
import { getJwksUrl, resolveConfig } from './config'
import { toProxyAuthObject } from './identity'
import type { NextAdapterConfig, ProxyAuthObject } from './types'

const COOKIE_SESSION_TOKEN = '__conjoin_auth_sess'

export type ConjoinProxyHandler = (
  auth: ProxyAuthObject | null,
  req: NextRequest,
) => Response | undefined | Promise<Response | undefined>

async function resolveProxyAuth(req: NextRequest, jwksUrl: string): Promise<ProxyAuthObject | null> {
  const token = req.cookies.get(COOKIE_SESSION_TOKEN)?.value
  if (!token) return null

  try {
    const verified = await verifyToken(token, { jwksUrl })
    return toProxyAuthObject(verified)
  } catch {
    return null
  }
}

export function conjoinProxy(handler?: ConjoinProxyHandler, overrides?: Partial<NextAdapterConfig>) {
  const jwksUrl = getJwksUrl(resolveConfig(overrides))

  return async (req: NextRequest): Promise<Response | undefined> => {
    if (!handler) return undefined

    const authObj = await resolveProxyAuth(req, jwksUrl)
    return handler(authObj, req)
  }
}

export function createRouteMatcher(patterns: string[]): (req: NextRequest) => boolean {
  const regexes = patterns.map(pattern => {
    const segments: string[] = []
    let remaining = pattern

    while (remaining.length > 0) {
      const wildcardIndex = remaining.indexOf('(.*)')
      if (wildcardIndex === -1) {
        segments.push(remaining.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        break
      }

      const before = remaining.slice(0, wildcardIndex)
      segments.push(before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      segments.push('(.*)')
      remaining = remaining.slice(wildcardIndex + 4)
    }

    return new RegExp(`^${segments.join('')}$`)
  })

  return (req: NextRequest) => {
    const pathname = new URL(req.url).pathname
    return regexes.some(re => re.test(pathname))
  }
}
