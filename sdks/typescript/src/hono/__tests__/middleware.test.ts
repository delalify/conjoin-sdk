import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VerifiedToken } from '../../server/tokens'

vi.mock('../../server/tokens', () => ({
  verifyToken: vi.fn(),
}))

import { verifyToken } from '../../server/tokens'
import { getAuth, requireAuth } from '../helpers'
import { conjoinMiddleware } from '../middleware'
import type { ConjoinEnv } from '../types'

const mockVerifyToken = vi.mocked(verifyToken)

const JWKS_URL = 'https://auth.conjoin.cloud/.well-known/jwks.json'

const mockVerifiedToken: VerifiedToken = {
  payload: { sub: 'acc_123', sid: 'ses_456' },
  accountId: 'acc_123',
  sessionId: 'ses_456',
  organizationId: 'org_789',
  organizationRole: 'admin',
}

function createApp() {
  return new Hono<ConjoinEnv>()
}

describe('conjoinMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets auth on context from Bearer header', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL }))
    app.get('/test', c => {
      const auth = c.get('auth')
      return c.json({ accountId: auth?.accountId })
    })

    const res = await app.request('/test', {
      headers: { authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.accountId).toBe('acc_123')
  })

  it('sets auth from cookie when no Bearer header', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL }))
    app.get('/test', c => {
      const auth = c.get('auth')
      return c.json({ accountId: auth?.accountId })
    })

    const res = await app.request('/test', {
      headers: { cookie: '__conjoin_auth_at=cookie-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.accountId).toBe('acc_123')
  })

  it('prefers Bearer token over cookie', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL }))
    app.get('/test', c => c.json({ ok: true }))

    await app.request('/test', {
      headers: {
        authorization: 'Bearer bearer-token',
        cookie: '__conjoin_auth_at=cookie-token',
      },
    })

    expect(mockVerifyToken).toHaveBeenCalledWith('bearer-token', expect.anything())
  })

  it('sets auth to null when no token is present', async () => {
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL }))
    app.get('/test', c => {
      const auth = c.get('auth')
      return c.json({ auth })
    })

    const res = await app.request('/test')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.auth).toBeNull()
  })

  it('sets auth to null on invalid token', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('invalid'))
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL }))
    app.get('/test', c => {
      const auth = c.get('auth')
      return c.json({ auth })
    })

    const res = await app.request('/test', {
      headers: { authorization: 'Bearer bad-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.auth).toBeNull()
  })

  it('always calls next and never blocks', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('fail'))
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL }))

    let handlerCalled = false
    app.get('/test', c => {
      handlerCalled = true
      return c.json({ ok: true })
    })

    await app.request('/test', {
      headers: { authorization: 'Bearer any-token' },
    })

    expect(handlerCalled).toBe(true)
  })

  it('uses custom cookie name', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL, cookieName: 'my_token' }))
    app.get('/test', c => c.json({ ok: true }))

    await app.request('/test', {
      headers: { cookie: 'my_token=custom-token' },
    })

    expect(mockVerifyToken).toHaveBeenCalledWith('custom-token', expect.anything())
  })
})

describe('getAuth', () => {
  it('returns auth from Hono context', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL }))

    let authResult: VerifiedToken | null = null
    app.get('/test', c => {
      authResult = getAuth(c)
      return c.json({ ok: true })
    })

    await app.request('/test', {
      headers: { authorization: 'Bearer valid-token' },
    })

    expect(authResult).toEqual(mockVerifiedToken)
  })

  it('returns null when no auth', async () => {
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL }))

    let authResult: VerifiedToken | null = null
    app.get('/test', c => {
      authResult = getAuth(c)
      return c.json({ ok: true })
    })

    await app.request('/test')

    expect(authResult).toBeNull()
  })
})

describe('requireAuth', () => {
  it('returns 401 JSON when unauthenticated', async () => {
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL }))
    app.use(requireAuth())
    app.get('/test', c => c.json({ ok: true }))

    const res = await app.request('/test')

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('passes through when authenticated', async () => {
    mockVerifyToken.mockResolvedValueOnce(mockVerifiedToken)
    const app = createApp()
    app.use(conjoinMiddleware({ jwksUrl: JWKS_URL }))
    app.use(requireAuth())
    app.get('/test', c => c.json({ ok: true }))

    const res = await app.request('/test', {
      headers: { authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
