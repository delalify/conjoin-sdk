import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('jose', () => {
  const mockJwtVerify = vi.fn()
  const mockCreateRemoteJWKSet = vi.fn(() => 'mock-jwks-set')
  return { jwtVerify: mockJwtVerify, createRemoteJWKSet: mockCreateRemoteJWKSet }
})

import { createRemoteJWKSet, jwtVerify } from 'jose'
import { SESSION_TOKEN_AUDIENCE, verifyToken } from '../tokens'

const mockJwtVerify = vi.mocked(jwtVerify)
const mockCreateRemoteJWKSet = vi.mocked(createRemoteJWKSet)

const JWKS_URL = 'https://auth.conjoin.cloud/.well-known/jwks.json'

describe('verifyToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns verified token with correct claims', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: {
        sub: 'acc_123',
        session_id: 'ses_456',
        client_id: 'client_123',
        app_id: 'app_123',
        live_mode: true,
        organization_id: 'org_789',
        organization_roles: ['admin', 'billing_manager'],
        iss: 'https://auth.conjoin.cloud',
        aud: SESSION_TOKEN_AUDIENCE,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      protectedHeader: { alg: 'RS256' },
    } as never)

    const result = await verifyToken('valid-jwt-token', { jwksUrl: JWKS_URL })

    expect(result.accountId).toBe('acc_123')
    expect(result.sessionId).toBe('ses_456')
    expect(result.clientId).toBe('client_123')
    expect(result.appId).toBe('app_123')
    expect(result.liveMode).toBe(true)
    expect(result.organizationId).toBe('org_789')
    expect(result.organizationRoles).toEqual(['admin', 'billing_manager'])
    expect(result.payload.sub).toBe('acc_123')
  })

  it('returns null organization id and empty roles when not present', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: {
        sub: 'acc_123',
        session_id: 'ses_456',
        client_id: 'client_123',
        app_id: 'app_123',
        live_mode: false,
        iss: 'https://auth.conjoin.cloud',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      protectedHeader: { alg: 'RS256' },
    } as never)

    const result = await verifyToken('valid-jwt-token', { jwksUrl: JWKS_URL })

    expect(result.organizationId).toBeNull()
    expect(result.organizationRoles).toEqual([])
    expect(result.liveMode).toBe(false)
  })

  it('drops non-string entries from organization_roles', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: {
        sub: 'acc_123',
        session_id: 'ses_456',
        organization_id: 'org_789',
        organization_roles: ['admin', 42, null, 'member'],
      },
      protectedHeader: { alg: 'RS256' },
    } as never)

    const result = await verifyToken('valid-jwt-token', { jwksUrl: JWKS_URL })

    expect(result.organizationRoles).toEqual(['admin', 'member'])
  })

  it('coerces a non-boolean live_mode claim to false', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: {
        sub: 'acc_123',
        session_id: 'ses_456',
        live_mode: 'true',
      },
      protectedHeader: { alg: 'RS256' },
    } as never)

    const result = await verifyToken('valid-jwt-token', { jwksUrl: JWKS_URL })

    expect(result.liveMode).toBe(false)
  })

  it('throws on expired token', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('JWT expired'))

    await expect(verifyToken('expired-jwt-token', { jwksUrl: JWKS_URL })).rejects.toThrow('JWT expired')
  })

  it('throws on invalid signature', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('signature verification failed'))

    await expect(verifyToken('bad-signature-token', { jwksUrl: JWKS_URL })).rejects.toThrow(
      'signature verification failed',
    )
  })

  it('caches JWKS set for the same URL', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: 'acc_1', session_id: 'ses_1' },
      protectedHeader: { alg: 'RS256' },
    } as never)

    await verifyToken('token-1', { jwksUrl: JWKS_URL })
    await verifyToken('token-2', { jwksUrl: JWKS_URL })

    const callsForUrl = mockCreateRemoteJWKSet.mock.calls.filter(call => call[0].toString() === JWKS_URL)
    expect(callsForUrl.length).toBeLessThanOrEqual(1)
  })

  it('defaults the audience to the session token audience', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { sub: 'acc_123', session_id: 'ses_456' },
      protectedHeader: { alg: 'RS256' },
    } as never)

    await verifyToken('valid-jwt-token', { jwksUrl: JWKS_URL })

    expect(mockJwtVerify).toHaveBeenCalledWith('valid-jwt-token', expect.anything(), {
      audience: SESSION_TOKEN_AUDIENCE,
      issuer: undefined,
    })
  })

  it('passes audience and issuer overrides to jwtVerify', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { sub: 'acc_123', session_id: 'ses_456' },
      protectedHeader: { alg: 'RS256' },
    } as never)

    await verifyToken('valid-jwt-token', {
      jwksUrl: JWKS_URL,
      audience: 'conjoin-app',
      issuer: 'https://auth.conjoin.cloud',
    })

    expect(mockJwtVerify).toHaveBeenCalledWith('valid-jwt-token', expect.anything(), {
      audience: 'conjoin-app',
      issuer: 'https://auth.conjoin.cloud',
    })
  })

  it('returns empty string for accountId when sub is missing', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { session_id: 'ses_456' },
      protectedHeader: { alg: 'RS256' },
    } as never)

    const result = await verifyToken('no-sub-token', { jwksUrl: JWKS_URL })
    expect(result.accountId).toBe('')
  })
})
