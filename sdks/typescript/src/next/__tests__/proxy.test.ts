import type { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { conjoinProxy, createRouteMatcher } from '../proxy'

function createMockRequest(options: { url?: string; cookies?: Record<string, string> } = {}): NextRequest {
  const url = options.url ?? 'https://myapp.com/dashboard'
  const cookieMap = options.cookies ?? {}

  return {
    url,
    cookies: {
      get: (name: string) => {
        const value = cookieMap[name]
        return value ? { name, value } : undefined
      },
    },
  } as unknown as NextRequest
}

describe('conjoinProxy', () => {
  it('calls handler with parsed auth object when cookie is present', () => {
    const clientState = JSON.stringify({
      accountId: 'acc_123',
      sessionId: 'ses_456',
      orgId: 'org_789',
      orgRole: 'admin',
    })

    const req = createMockRequest({ cookies: { __conjoin_auth_cl: clientState } })
    let receivedAuth: unknown

    const proxy = conjoinProxy((auth, _req) => {
      receivedAuth = auth
      return undefined
    })

    proxy(req)

    expect(receivedAuth).toEqual({
      accountId: 'acc_123',
      sessionId: 'ses_456',
      organizationId: 'org_789',
      organizationRole: 'admin',
      getToken: expect.any(Function),
    })
  })

  it('passes null auth when no cookie is present', () => {
    const req = createMockRequest()
    let receivedAuth: unknown = 'not-set'

    const proxy = conjoinProxy(auth => {
      receivedAuth = auth
      return undefined
    })

    proxy(req)

    expect(receivedAuth).toBeNull()
  })

  it('returns undefined when no handler is provided', () => {
    const req = createMockRequest()
    const proxy = conjoinProxy()
    const result = proxy(req)
    expect(result).toBeUndefined()
  })

  it('returns handler response value', () => {
    const req = createMockRequest()
    const mockResponse = new Response('forbidden', { status: 403 })

    const proxy = conjoinProxy(() => mockResponse)
    const result = proxy(req)

    expect(result).toBe(mockResponse)
  })

  it('throws when getToken is called in proxy context', () => {
    const clientState = JSON.stringify({
      accountId: 'acc_123',
      sessionId: 'ses_456',
      orgId: null,
      orgRole: null,
    })

    const req = createMockRequest({ cookies: { __conjoin_auth_cl: clientState } })

    const proxy = conjoinProxy(auth => {
      expect(() => auth?.getToken()).toThrow('getToken() is not available in proxy')
      return undefined
    })

    proxy(req)
  })

  it('returns null auth on invalid JSON cookie', () => {
    const req = createMockRequest({ cookies: { __conjoin_auth_cl: 'not-json' } })
    let receivedAuth: unknown = 'not-set'

    const proxy = conjoinProxy(auth => {
      receivedAuth = auth
      return undefined
    })

    proxy(req)

    expect(receivedAuth).toBeNull()
  })

  it('returns null auth when cookie has wrong shape', () => {
    const req = createMockRequest({ cookies: { __conjoin_auth_cl: JSON.stringify({ foo: 'bar' }) } })
    let receivedAuth: unknown = 'not-set'

    const proxy = conjoinProxy(auth => {
      receivedAuth = auth
      return undefined
    })

    proxy(req)

    expect(receivedAuth).toBeNull()
  })

  it('returns null auth when accountId is not a string', () => {
    const req = createMockRequest({
      cookies: { __conjoin_auth_cl: JSON.stringify({ accountId: 123, sessionId: 'ses_1' }) },
    })
    let receivedAuth: unknown = 'not-set'

    const proxy = conjoinProxy(auth => {
      receivedAuth = auth
      return undefined
    })

    proxy(req)

    expect(receivedAuth).toBeNull()
  })

  it('handles null org fields gracefully', () => {
    const clientState = JSON.stringify({
      accountId: 'acc_123',
      sessionId: 'ses_456',
      orgId: null,
      orgRole: null,
    })

    const req = createMockRequest({ cookies: { __conjoin_auth_cl: clientState } })
    let receivedAuth: unknown

    const proxy = conjoinProxy(auth => {
      receivedAuth = auth
      return undefined
    })

    proxy(req)

    const authObj = receivedAuth as { organizationId: unknown; organizationRole: unknown }
    expect(authObj.organizationId).toBeNull()
    expect(authObj.organizationRole).toBeNull()
  })

  it('treats non-string orgId as null', () => {
    const clientState = JSON.stringify({
      accountId: 'acc_123',
      sessionId: 'ses_456',
      orgId: 42,
      orgRole: true,
    })

    const req = createMockRequest({ cookies: { __conjoin_auth_cl: clientState } })
    let receivedAuth: unknown

    const proxy = conjoinProxy(auth => {
      receivedAuth = auth
      return undefined
    })

    proxy(req)

    const authObj = receivedAuth as { organizationId: unknown; organizationRole: unknown }
    expect(authObj.organizationId).toBeNull()
    expect(authObj.organizationRole).toBeNull()
  })

  it('passes the request object to handler', () => {
    const req = createMockRequest({ url: 'https://myapp.com/protected' })
    let receivedReq: unknown

    const proxy = conjoinProxy((_auth, r) => {
      receivedReq = r
      return undefined
    })

    proxy(req)

    expect(receivedReq).toBe(req)
  })
})

describe('createRouteMatcher', () => {
  it('matches exact paths', () => {
    const matcher = createRouteMatcher(['/dashboard'])
    expect(matcher(createMockRequest({ url: 'https://myapp.com/dashboard' }))).toBe(true)
    expect(matcher(createMockRequest({ url: 'https://myapp.com/about' }))).toBe(false)
  })

  it('matches wildcard patterns', () => {
    const matcher = createRouteMatcher(['/dashboard(.*)'])
    expect(matcher(createMockRequest({ url: 'https://myapp.com/dashboard' }))).toBe(true)
    expect(matcher(createMockRequest({ url: 'https://myapp.com/dashboard/settings' }))).toBe(true)
    expect(matcher(createMockRequest({ url: 'https://myapp.com/dashboard/users/123' }))).toBe(true)
    expect(matcher(createMockRequest({ url: 'https://myapp.com/about' }))).toBe(false)
  })

  it('matches multiple patterns', () => {
    const matcher = createRouteMatcher(['/dashboard(.*)', '/api/protected(.*)'])
    expect(matcher(createMockRequest({ url: 'https://myapp.com/dashboard' }))).toBe(true)
    expect(matcher(createMockRequest({ url: 'https://myapp.com/api/protected/resource' }))).toBe(true)
    expect(matcher(createMockRequest({ url: 'https://myapp.com/api/public' }))).toBe(false)
  })

  it('does not match partial paths without wildcard', () => {
    const matcher = createRouteMatcher(['/dashboard'])
    expect(matcher(createMockRequest({ url: 'https://myapp.com/dashboard/settings' }))).toBe(false)
  })

  it('handles root path', () => {
    const matcher = createRouteMatcher(['/'])
    expect(matcher(createMockRequest({ url: 'https://myapp.com/' }))).toBe(true)
    expect(matcher(createMockRequest({ url: 'https://myapp.com/anything' }))).toBe(false)
  })

  it('escapes special regex characters in patterns', () => {
    const matcher = createRouteMatcher(['/api/v1.0/users'])
    expect(matcher(createMockRequest({ url: 'https://myapp.com/api/v1.0/users' }))).toBe(true)
    expect(matcher(createMockRequest({ url: 'https://myapp.com/api/v1X0/users' }))).toBe(false)
  })

  it('matches pathname only, ignoring query strings', () => {
    const matcher = createRouteMatcher(['/dashboard(.*)'])
    expect(matcher(createMockRequest({ url: 'https://myapp.com/dashboard?tab=settings' }))).toBe(true)
    expect(matcher(createMockRequest({ url: 'https://myapp.com/about?ref=dashboard' }))).toBe(false)
  })

  it('returns false for empty patterns array', () => {
    const matcher = createRouteMatcher([])
    expect(matcher(createMockRequest({ url: 'https://myapp.com/anything' }))).toBe(false)
  })

  it('handles multiple wildcards in a single pattern', () => {
    const matcher = createRouteMatcher(['/api/(.*)/users(.*)'])
    expect(matcher(createMockRequest({ url: 'https://myapp.com/api/v1/users/123' }))).toBe(true)
    expect(matcher(createMockRequest({ url: 'https://myapp.com/api/v2/users' }))).toBe(true)
  })
})
