import type { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../server/tokens', () => ({
  verifyToken: vi.fn(),
}))

import { verifyToken } from '../../server/tokens'
import { conjoinProxy, createRouteMatcher } from '../proxy'

const mockVerifyToken = vi.mocked(verifyToken)

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

function verifiedFixture(overrides: Partial<ReturnType<typeof baseVerified>> = {}) {
  return { ...baseVerified(), ...overrides }
}

function baseVerified() {
  return {
    payload: { sub: 'acc_123' },
    accountId: 'acc_123',
    sessionId: 'ses_456',
    clientId: 'client_123',
    appId: 'app_123',
    liveMode: true,
    organizationId: 'org_789' as string | null,
    organizationRoles: ['admin'] as string[],
  }
}

describe('conjoinProxy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CONJOIN_PUBLISHABLE_KEY = 'pk_test_auth.conjoin.cloud'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.CONJOIN_PUBLISHABLE_KEY
  })

  it('calls handler with verified auth object when the session cookie is valid', async () => {
    mockVerifyToken.mockResolvedValueOnce(verifiedFixture())

    const req = createMockRequest({ cookies: { __conjoin_auth_sess: 'valid-jwt' } })
    let receivedAuth: unknown

    const proxy = conjoinProxy((auth, _req) => {
      receivedAuth = auth
      return undefined
    })

    await proxy(req)

    expect(mockVerifyToken).toHaveBeenCalledWith('valid-jwt', {
      jwksUrl: 'https://auth.conjoin.cloud/.well-known/jwks.json',
    })
    expect(receivedAuth).toEqual({
      accountId: 'acc_123',
      sessionId: 'ses_456',
      clientId: 'client_123',
      appId: 'app_123',
      liveMode: true,
      organizationId: 'org_789',
      organizationRoles: ['admin'],
      has: expect.any(Function),
    })
  })

  it('exposes a role-aware has() and stubs permission checks to false', async () => {
    mockVerifyToken.mockResolvedValueOnce(verifiedFixture({ organizationRoles: ['admin', 'member'] }))

    const req = createMockRequest({ cookies: { __conjoin_auth_sess: 'valid-jwt' } })
    let has: ((params: { role: string } | { permission: string }) => boolean) | undefined

    const proxy = conjoinProxy(auth => {
      has = auth?.has
      return undefined
    })

    await proxy(req)

    expect(has?.({ role: 'admin' })).toBe(true)
    expect(has?.({ role: 'owner' })).toBe(false)
    expect(has?.({ permission: 'billing:write' })).toBe(false)
  })

  it('passes null auth when no session cookie is present', async () => {
    const req = createMockRequest()
    let receivedAuth: unknown = 'not-set'

    const proxy = conjoinProxy(auth => {
      receivedAuth = auth
      return undefined
    })

    await proxy(req)

    expect(receivedAuth).toBeNull()
    expect(mockVerifyToken).not.toHaveBeenCalled()
  })

  it('passes null auth when token verification fails', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('invalid token'))

    const req = createMockRequest({ cookies: { __conjoin_auth_sess: 'bad-jwt' } })
    let receivedAuth: unknown = 'not-set'

    const proxy = conjoinProxy(auth => {
      receivedAuth = auth
      return undefined
    })

    await proxy(req)

    expect(receivedAuth).toBeNull()
  })

  it('returns undefined when no handler is provided', async () => {
    const req = createMockRequest()
    const proxy = conjoinProxy()
    const result = await proxy(req)
    expect(result).toBeUndefined()
  })

  it('returns the handler response value', async () => {
    mockVerifyToken.mockResolvedValueOnce(verifiedFixture())
    const req = createMockRequest({ cookies: { __conjoin_auth_sess: 'valid-jwt' } })
    const mockResponse = new Response('forbidden', { status: 403 })

    const proxy = conjoinProxy(() => mockResponse)
    const result = await proxy(req)

    expect(result).toBe(mockResponse)
  })

  it('awaits an async handler response', async () => {
    const req = createMockRequest()
    const mockResponse = new Response('redirect', { status: 307 })

    const proxy = conjoinProxy(async () => mockResponse)
    const result = await proxy(req)

    expect(result).toBe(mockResponse)
  })

  it('reflects a cleared organization as no-org first-class state', async () => {
    mockVerifyToken.mockResolvedValueOnce(verifiedFixture({ organizationId: null, organizationRoles: [] }))

    const req = createMockRequest({ cookies: { __conjoin_auth_sess: 'valid-jwt' } })
    let receivedAuth:
      | { organizationId: unknown; organizationRoles: unknown; has: (p: { role: string }) => boolean }
      | undefined

    const proxy = conjoinProxy(auth => {
      receivedAuth = auth ?? undefined
      return undefined
    })

    await proxy(req)

    expect(receivedAuth?.organizationId).toBeNull()
    expect(receivedAuth?.organizationRoles).toEqual([])
    expect(receivedAuth?.has({ role: 'admin' })).toBe(false)
  })

  it('passes the request object to the handler', async () => {
    const req = createMockRequest({ url: 'https://myapp.com/protected' })
    let receivedReq: unknown

    const proxy = conjoinProxy((_auth, r) => {
      receivedReq = r
      return undefined
    })

    await proxy(req)

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
