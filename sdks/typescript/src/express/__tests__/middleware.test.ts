import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VerifiedToken } from '../../server/tokens'

vi.mock('../../server/tokens', () => ({
  verifyToken: vi.fn(),
}))

import { verifyToken } from '../../server/tokens'
import { getAuth, requireAuth } from '../helpers'
import { conjoinMiddleware } from '../middleware'

const mockVerifyToken = vi.mocked(verifyToken)

const JWKS_URL = 'https://auth.conjoin.cloud/.well-known/jwks.json'

const mockVerifiedToken: VerifiedToken = {
  payload: { sub: 'acc_123', sid: 'ses_456' },
  accountId: 'acc_123',
  sessionId: 'ses_456',
  organizationId: 'org_789',
  organizationRole: 'admin',
}

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    headers: {},
    cookies: {},
    ...overrides,
  } as never
}

function createMockRes() {
  const res: Record<string, unknown> = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res as never
}

describe('conjoinMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('attaches verified token to req.auth from Bearer header', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })

    const req = createMockReq({
      headers: { authorization: 'Bearer valid-token' },
    })
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(mockVerifyToken).toHaveBeenCalledWith('valid-token', {
      jwksUrl: JWKS_URL,
      audience: undefined,
      issuer: undefined,
    })
    expect((req as Record<string, unknown>).auth).toEqual(mockVerifiedToken)
    expect(next).toHaveBeenCalledOnce()
  })

  it('attaches verified token from cookie when no Bearer header', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })

    const req = createMockReq({
      cookies: { __conjoin_auth_at: 'cookie-token' },
    })
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(mockVerifyToken).toHaveBeenCalledWith('cookie-token', expect.anything())
    expect((req as Record<string, unknown>).auth).toEqual(mockVerifiedToken)
  })

  it('prefers Bearer token over cookie', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })

    const req = createMockReq({
      headers: { authorization: 'Bearer bearer-token' },
      cookies: { __conjoin_auth_at: 'cookie-token' },
    })
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(mockVerifyToken).toHaveBeenCalledWith('bearer-token', expect.anything())
  })

  it('sets req.auth to null on missing token', async () => {
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })

    const req = createMockReq()
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    expect((req as Record<string, unknown>).auth).toBeNull()
    expect(next).toHaveBeenCalledOnce()
  })

  it('sets req.auth to null on invalid token', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('invalid token'))
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })

    const req = createMockReq({
      headers: { authorization: 'Bearer bad-token' },
    })
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    expect((req as Record<string, unknown>).auth).toBeNull()
    expect(next).toHaveBeenCalledOnce()
  })

  it('always calls next and never blocks', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('verification failed'))
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })

    const req = createMockReq({
      headers: { authorization: 'Bearer any-token' },
    })
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledOnce()
  })

  it('uses custom cookie name when specified', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const middleware = conjoinMiddleware({
      jwksUrl: JWKS_URL,
      cookieName: 'custom_token',
    })

    const req = createMockReq({
      cookies: { custom_token: 'custom-cookie-token' },
    })
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(mockVerifyToken).toHaveBeenCalledWith('custom-cookie-token', expect.anything())
  })
})

describe('getAuth', () => {
  it('returns auth from request after middleware', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })

    const req = createMockReq({
      headers: { authorization: 'Bearer valid-token' },
    })
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    const auth = getAuth(req as never)
    expect(auth).toEqual(mockVerifiedToken)
  })

  it('throws if middleware was not applied', () => {
    const req = createMockReq()

    expect(() => getAuth(req as never)).toThrow('conjoinMiddleware() must be applied before calling getAuth()')
  })

  it('returns null when authenticated but no token', async () => {
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })

    const req = createMockReq()
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    const auth = getAuth(req as never)
    expect(auth).toBeNull()
  })
})

describe('requireAuth', () => {
  it('returns 401 when unauthenticated', async () => {
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })
    const req = createMockReq()
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    const guard = requireAuth()
    const guardNext = vi.fn()
    guard(req as never, res, guardNext)

    expect((res as Record<string, unknown>).status).toHaveBeenCalledWith(401)
    expect((res as Record<string, unknown>).json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(guardNext).not.toHaveBeenCalled()
  })

  it('passes through when authenticated', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })

    const req = createMockReq({
      headers: { authorization: 'Bearer valid-token' },
    })
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    const guard = requireAuth()
    const guardNext = vi.fn()
    guard(req as never, res, guardNext)

    expect(guardNext).toHaveBeenCalledOnce()
  })

  it('calls custom onUnauthenticated handler', async () => {
    const middleware = conjoinMiddleware({ jwksUrl: JWKS_URL })
    const req = createMockReq()
    const res = createMockRes()
    const next = vi.fn()

    await middleware(req, res, next)

    const customHandler = vi.fn()
    const guard = requireAuth({ onUnauthenticated: customHandler })
    const guardNext = vi.fn()
    guard(req as never, res, guardNext)

    expect(customHandler).toHaveBeenCalledWith(req, res)
    expect(guardNext).not.toHaveBeenCalled()
  })
})
