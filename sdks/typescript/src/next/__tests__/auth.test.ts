import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react', () => ({
  cache: (fn: (...args: never[]) => unknown) => fn,
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}))

vi.mock('../../server/tokens', () => ({
  verifyToken: vi.fn(),
}))

vi.mock('../../core/client', () => ({
  createConjoinClient: vi.fn(),
}))

import { cookies, headers } from 'next/headers'
import { createConjoinClient } from '../../core/client'
import { verifyToken } from '../../server/tokens'
import { auth } from '../auth'
import { currentAccount } from '../current-account'

const mockCookies = vi.mocked(cookies)
const mockHeaders = vi.mocked(headers)
const mockVerifyToken = vi.mocked(verifyToken)
const mockCreateConjoinClient = vi.mocked(createConjoinClient)

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    process.env.CONJOIN_PUBLISHABLE_KEY = 'pk_test_auth.conjoin.cloud'
    process.env.CONJOIN_SECRET_KEY = 'sk_test_secret123'

    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue(null),
    } as never)

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.CONJOIN_PUBLISHABLE_KEY
    delete process.env.CONJOIN_SECRET_KEY
  })

  it('reads token from cookie and verifies', async () => {
    const cookieGet = vi.fn().mockImplementation((name: string) => {
      if (name === '__conjoin_auth_at') return { value: 'jwt-from-cookie' }
      return undefined
    })
    mockCookies.mockResolvedValue({ get: cookieGet } as never)

    mockVerifyToken.mockResolvedValueOnce({
      payload: { sub: 'acc_123', sid: 'ses_456' },
      accountId: 'acc_123',
      sessionId: 'ses_456',
      organizationId: null,
      organizationRole: null,
    })

    const result = await auth()

    expect(result).not.toBeNull()
    expect(result?.accountId).toBe('acc_123')
    expect(result?.sessionId).toBe('ses_456')
    expect(result?.getToken()).toBe('jwt-from-cookie')
    expect(mockVerifyToken).toHaveBeenCalledWith('jwt-from-cookie', {
      jwksUrl: 'https://auth.conjoin.cloud/.well-known/jwks.json',
    })
  })

  it('reads Bearer token from Authorization header', async () => {
    const headerGet = vi.fn().mockImplementation((name: string) => {
      if (name === 'authorization') return 'Bearer jwt-from-header'
      return null
    })
    mockHeaders.mockResolvedValue({ get: headerGet } as never)

    mockVerifyToken.mockResolvedValueOnce({
      payload: { sub: 'acc_456' },
      accountId: 'acc_456',
      sessionId: 'ses_789',
      organizationId: 'org_100',
      organizationRole: 'member',
    })

    const result = await auth()

    expect(result).not.toBeNull()
    expect(result?.accountId).toBe('acc_456')
    expect(result?.organizationId).toBe('org_100')
    expect(result?.getToken()).toBe('jwt-from-header')
  })

  it('prefers Bearer header over cookie', async () => {
    const headerGet = vi.fn().mockImplementation((name: string) => {
      if (name === 'authorization') return 'Bearer header-token'
      return null
    })
    mockHeaders.mockResolvedValue({ get: headerGet } as never)

    const cookieGet = vi.fn().mockImplementation((name: string) => {
      if (name === '__conjoin_auth_at') return { value: 'cookie-token' }
      return undefined
    })
    mockCookies.mockResolvedValue({ get: cookieGet } as never)

    mockVerifyToken.mockResolvedValueOnce({
      payload: { sub: 'acc_123' },
      accountId: 'acc_123',
      sessionId: 'ses_456',
      organizationId: null,
      organizationRole: null,
    })

    await auth()

    expect(mockVerifyToken).toHaveBeenCalledWith('header-token', expect.anything())
  })

  it('returns null when no token is present', async () => {
    const result = await auth()
    expect(result).toBeNull()
    expect(mockVerifyToken).not.toHaveBeenCalled()
  })

  it('returns null when token verification fails', async () => {
    const cookieGet = vi.fn().mockImplementation((name: string) => {
      if (name === '__conjoin_auth_at') return { value: 'bad-token' }
      return undefined
    })
    mockCookies.mockResolvedValue({ get: cookieGet } as never)

    mockVerifyToken.mockRejectedValueOnce(new Error('invalid token'))

    const result = await auth()
    expect(result).toBeNull()
  })

  it('ignores non-Bearer authorization headers', async () => {
    const headerGet = vi.fn().mockImplementation((name: string) => {
      if (name === 'authorization') return 'Basic dXNlcjpwYXNz'
      return null
    })
    mockHeaders.mockResolvedValue({ get: headerGet } as never)

    const result = await auth()
    expect(result).toBeNull()
    expect(mockVerifyToken).not.toHaveBeenCalled()
  })
})

describe('currentAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    process.env.CONJOIN_PUBLISHABLE_KEY = 'pk_test_auth.conjoin.cloud'
    process.env.CONJOIN_SECRET_KEY = 'sk_test_secret123'

    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue(null),
    } as never)

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.CONJOIN_PUBLISHABLE_KEY
    delete process.env.CONJOIN_SECRET_KEY
  })

  it('returns null when not authenticated', async () => {
    const result = await currentAccount()
    expect(result).toBeNull()
  })

  it('fetches account when authenticated', async () => {
    const cookieGet = vi.fn().mockImplementation((name: string) => {
      if (name === '__conjoin_auth_at') return { value: 'valid-token' }
      return undefined
    })
    mockCookies.mockResolvedValue({ get: cookieGet } as never)

    mockVerifyToken.mockResolvedValueOnce({
      payload: { sub: 'acc_123' },
      accountId: 'acc_123',
      sessionId: 'ses_456',
      organizationId: null,
      organizationRole: null,
    })

    const mockAccount = {
      id: 'acc_123',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      avatarUrl: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }

    const mockFetch = vi.fn().mockResolvedValue(mockAccount)
    mockCreateConjoinClient.mockReturnValue({
      config: {} as never,
      fetch: mockFetch,
      fetchList: vi.fn() as never,
      fetchRaw: vi.fn() as never,
    })

    const result = await currentAccount()

    expect(result).toEqual(mockAccount)
    expect(mockFetch).toHaveBeenCalledWith('auth/self', {
      headers: { Authorization: 'Bearer valid-token' },
    })
  })
})
