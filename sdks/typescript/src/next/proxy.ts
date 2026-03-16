import type { NextRequest } from 'next/server'
import type { AuthObject } from './types'

const COOKIE_CLIENT_STATE = '__conjoin_auth_cl'

type ClientState = {
  accountId: string
  sessionId: string
  orgId: string | null
  orgRole: string | null
}

function parseClientState(req: NextRequest): AuthObject | null {
  const cookie = req.cookies.get(COOKIE_CLIENT_STATE)?.value
  if (!cookie) return null

  try {
    const parsed: unknown = JSON.parse(cookie)
    if (typeof parsed !== 'object' || parsed === null) return null

    const raw = parsed as Record<string, unknown>
    if (typeof raw.accountId !== 'string' || typeof raw.sessionId !== 'string') return null

    const state: ClientState = {
      accountId: raw.accountId,
      sessionId: raw.sessionId,
      orgId: typeof raw.orgId === 'string' ? raw.orgId : null,
      orgRole: typeof raw.orgRole === 'string' ? raw.orgRole : null,
    }

    return {
      accountId: state.accountId,
      sessionId: state.sessionId,
      organizationId: state.orgId,
      organizationRole: state.orgRole,
      getToken: () => {
        throw new Error(
          'getToken() is not available in proxy. Use auth() in a Server Component or Route Handler instead.',
        )
      },
    }
  } catch {
    return null
  }
}

export function conjoinProxy(handler?: (auth: AuthObject | null, req: NextRequest) => Response | undefined) {
  return (req: NextRequest) => {
    if (!handler) return

    const authObj = parseClientState(req)
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
