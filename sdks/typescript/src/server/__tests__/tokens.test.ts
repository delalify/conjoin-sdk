import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('jose', () => {
  const mockJwtVerify = vi.fn()
  const mockCreateRemoteJWKSet = vi.fn(() => 'mock-jwks-set')
  return { jwtVerify: mockJwtVerify, createRemoteJWKSet: mockCreateRemoteJWKSet }
})

import { createRemoteJWKSet, jwtVerify } from 'jose'
import { verifyToken } from '../tokens'

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
        sid: 'ses_456',
        org_id: 'org_789',
        org_role: 'admin',
        iss: 'https://auth.conjoin.cloud',
        aud: 'conjoin',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      protectedHeader: { alg: 'RS256' },
    } as never)

    const result = await verifyToken('valid-jwt-token', { jwksUrl: JWKS_URL })

    expect(result.accountId).toBe('acc_123')
    expect(result.sessionId).toBe('ses_456')
    expect(result.organizationId).toBe('org_789')
    expect(result.organizationRole).toBe('admin')
    expect(result.payload.sub).toBe('acc_123')
  })

  it('returns null organization fields when not present', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: {
        sub: 'acc_123',
        sid: 'ses_456',
        iss: 'https://auth.conjoin.cloud',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      protectedHeader: { alg: 'RS256' },
    } as never)

    const result = await verifyToken('valid-jwt-token', { jwksUrl: JWKS_URL })

    expect(result.organizationId).toBeNull()
    expect(result.organizationRole).toBeNull()
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
      payload: { sub: 'acc_1', sid: 'ses_1' },
      protectedHeader: { alg: 'RS256' },
    } as never)

    await verifyToken('token-1', { jwksUrl: JWKS_URL })
    await verifyToken('token-2', { jwksUrl: JWKS_URL })

    const callsForUrl = mockCreateRemoteJWKSet.mock.calls.filter(call => call[0].toString() === JWKS_URL)
    expect(callsForUrl.length).toBeLessThanOrEqual(1)
  })

  it('passes audience and issuer options to jwtVerify', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { sub: 'acc_123', sid: 'ses_456' },
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
      payload: { sid: 'ses_456' },
      protectedHeader: { alg: 'RS256' },
    } as never)

    const result = await verifyToken('no-sub-token', { jwksUrl: JWKS_URL })
    expect(result.accountId).toBe('')
  })
})
