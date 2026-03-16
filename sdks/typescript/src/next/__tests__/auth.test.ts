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
import { getJwksUrl, resolveConfig } from '../config'
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

describe('resolveConfig', () => {
  beforeEach(() => {
    process.env.CONJOIN_SECRET_KEY = 'sk_test_env_key'
    process.env.CONJOIN_PUBLISHABLE_KEY = 'pk_test_env.conjoin.cloud'
  })

  afterEach(() => {
    delete process.env.CONJOIN_SECRET_KEY
    delete process.env.CONJOIN_PUBLISHABLE_KEY
  })

  it('reads from environment variables by default', () => {
    const config = resolveConfig()
    expect(config.secretKey).toBe('sk_test_env_key')
    expect(config.publishableKey).toBe('pk_test_env.conjoin.cloud')
  })

  it('overrides take precedence over env vars', () => {
    const config = resolveConfig({
      secretKey: 'sk_override',
      publishableKey: 'pk_live_override.conjoin.cloud',
    })
    expect(config.secretKey).toBe('sk_override')
    expect(config.publishableKey).toBe('pk_live_override.conjoin.cloud')
  })

  it('returns undefined for keys when env vars are not set', () => {
    delete process.env.CONJOIN_SECRET_KEY
    delete process.env.CONJOIN_PUBLISHABLE_KEY
    const config = resolveConfig()
    expect(config.secretKey).toBeUndefined()
    expect(config.publishableKey).toBeUndefined()
  })

  it('passes through jwksUrl and authDomain overrides', () => {
    const config = resolveConfig({
      jwksUrl: 'https://custom.example.com/.well-known/jwks.json',
      authDomain: 'custom.example.com',
    })
    expect(config.jwksUrl).toBe('https://custom.example.com/.well-known/jwks.json')
    expect(config.authDomain).toBe('custom.example.com')
  })
})

describe('getJwksUrl', () => {
  it('returns explicit jwksUrl when provided', () => {
    const url = getJwksUrl({ jwksUrl: 'https://custom.example.com/jwks' })
    expect(url).toBe('https://custom.example.com/jwks')
  })

  it('derives URL from authDomain', () => {
    const url = getJwksUrl({ authDomain: 'auth.myapp.com' })
    expect(url).toBe('https://auth.myapp.com/.well-known/jwks.json')
  })

  it('derives URL from publishable key with test prefix', () => {
    const url = getJwksUrl({ publishableKey: 'pk_test_auth.conjoin.cloud' })
    expect(url).toBe('https://auth.conjoin.cloud/.well-known/jwks.json')
  })

  it('derives URL from publishable key with live prefix', () => {
    const url = getJwksUrl({ publishableKey: 'pk_live_auth.myapp.com' })
    expect(url).toBe('https://auth.myapp.com/.well-known/jwks.json')
  })

  it('prefers jwksUrl over authDomain over publishableKey', () => {
    const url = getJwksUrl({
      jwksUrl: 'https://explicit.com/jwks',
      authDomain: 'domain.com',
      publishableKey: 'pk_test_key.com',
    })
    expect(url).toBe('https://explicit.com/jwks')
  })

  it('prefers authDomain over publishableKey', () => {
    const url = getJwksUrl({
      authDomain: 'domain.com',
      publishableKey: 'pk_test_key.com',
    })
    expect(url).toBe('https://domain.com/.well-known/jwks.json')
  })

  it('throws when no publishableKey, authDomain, or jwksUrl', () => {
    expect(() => getJwksUrl({})).toThrow('requires a publishableKey, authDomain, or jwksUrl')
  })

  it('throws on invalid publishable key format', () => {
    expect(() => getJwksUrl({ publishableKey: 'invalid_key' })).toThrow('Invalid publishable key format')
  })

  it('throws on publishable key without environment prefix', () => {
    expect(() => getJwksUrl({ publishableKey: 'pk_auth.conjoin.cloud' })).toThrow('Invalid publishable key format')
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

  it('creates client with secretKey from config', async () => {
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

    const mockFetch = vi.fn().mockResolvedValue({ id: 'acc_123' })
    mockCreateConjoinClient.mockReturnValue({
      config: {} as never,
      fetch: mockFetch,
      fetchList: vi.fn() as never,
      fetchRaw: vi.fn() as never,
    })

    await currentAccount()

    expect(mockCreateConjoinClient).toHaveBeenCalledWith({
      apiKey: 'sk_test_secret123',
    })
  })
})
