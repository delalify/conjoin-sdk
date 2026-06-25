import type { AuthTransport, NativeAuthTransport, PendingAuthFlow } from '@conjoin-cloud/react-core'
import { describe, expect, it } from 'vitest'
import { createNativeTransport } from '../native'

type NativeCapable = AuthTransport & NativeAuthTransport

function nativeTransport(): NativeCapable {
  return createNativeTransport() as NativeCapable
}

function accessToken(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `${header}.${payload}.signature`
}

const PENDING: PendingAuthFlow = {
  kind: 'sign-in',
  state: 'state-value',
  codeVerifier: 'verifier-value',
  codeChallenge: 'challenge-value',
  serverState: null,
  verificationMethod: 'pin_code',
  identifier: 'ada@acme.test',
  clientHandle: { client_id: 'authcl_1', reference_id: 'ref_1' },
}

describe('createNativeTransport: bearer attachment', () => {
  it('attaches the access token only once a token is stored', async () => {
    const transport = nativeTransport()
    expect(transport.attachBearer({ 'Content-Type': 'application/json' })).toEqual({
      'Content-Type': 'application/json',
    })

    await transport.storeTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' })

    expect(transport.attachBearer({ 'Content-Type': 'application/json' })).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer access-1',
    })
  })

  it('exposes the token pair only when both tokens are present', async () => {
    const transport = nativeTransport()
    expect(transport.readTokens()).toBeNull()

    await transport.storeTokens({ accessToken: 'access-2', refreshToken: 'refresh-2' })
    expect(transport.readTokens()).toEqual({ accessToken: 'access-2', refreshToken: 'refresh-2' })

    await transport.clearTokens()
    expect(transport.readTokens()).toBeNull()
    expect(transport.attachBearer({})).toEqual({})
  })
})

describe('createNativeTransport: session decoding', () => {
  it('decodes account, session, and organization claims from the access token', async () => {
    const transport = nativeTransport()
    const exp = Math.floor(Date.now() / 1000) + 3600
    await transport.storeTokens({
      accessToken: accessToken({
        sub: 'acct_42',
        session_id: 'sess_42',
        organization_id: 'org_42',
        organization_roles: ['admin', 'billing'],
        exp,
      }),
      refreshToken: 'refresh-42',
    })

    const session = transport.readSession()
    expect(session).toEqual({
      accountId: 'acct_42',
      sessionId: 'sess_42',
      organizationId: 'org_42',
      organizationRoles: ['admin', 'billing'],
      expiresAtMs: exp * 1000,
    })
  })

  it('returns null for a token missing required claims', async () => {
    const transport = nativeTransport()
    await transport.storeTokens({
      accessToken: accessToken({ sub: 'acct_99' }),
      refreshToken: 'refresh-99',
    })
    expect(transport.readSession()).toBeNull()
  })

  it('returns null for a structurally invalid token', async () => {
    const transport = nativeTransport()
    await transport.storeTokens({ accessToken: 'not-a-jwt', refreshToken: 'refresh' })
    expect(transport.readSession()).toBeNull()
  })

  it('defaults organization fields when the claims omit them', async () => {
    const transport = nativeTransport()
    const exp = Math.floor(Date.now() / 1000) + 3600
    await transport.storeTokens({
      accessToken: accessToken({ sub: 'acct_7', session_id: 'sess_7', exp }),
      refreshToken: 'refresh-7',
    })
    expect(transport.readSession()).toEqual({
      accountId: 'acct_7',
      sessionId: 'sess_7',
      organizationId: null,
      organizationRoles: [],
      expiresAtMs: exp * 1000,
    })
  })
})

describe('createNativeTransport: refresh lock', () => {
  it('serializes tasks acquired concurrently', async () => {
    const transport = nativeTransport()
    const order: string[] = []

    const first = transport.acquireRefreshLock(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      order.push('first')
      return 'a'
    })
    const second = transport.acquireRefreshLock(async () => {
      order.push('second')
      return 'b'
    })

    const results = await Promise.all([first, second])
    expect(order).toEqual(['first', 'second'])
    expect(results).toEqual(['a', 'b'])
  })

  it('runs the next task even after a prior task rejects', async () => {
    const transport = nativeTransport()
    const failing = transport.acquireRefreshLock(async () => {
      throw new Error('boom')
    })
    await expect(failing).rejects.toThrow('boom')

    const recovered = await transport.acquireRefreshLock(async () => 'ok')
    expect(recovered).toBe('ok')
  })
})

describe('createNativeTransport: pending flow', () => {
  it('round-trips the pending flow including the client handle', () => {
    const transport = nativeTransport()
    transport.savePendingFlow(PENDING)
    expect(transport.readPendingFlow()).toEqual(PENDING)

    transport.clearPendingFlow()
    expect(transport.readPendingFlow()).toBeNull()
  })

  it('clears the handle, tokens, and pending flow together', async () => {
    const transport = nativeTransport()
    await transport.storeTokens({ accessToken: 'access', refreshToken: 'refresh' })
    await transport.setClientHandle({ client_id: 'authcl_2', reference_id: 'ref_2' })
    transport.savePendingFlow(PENDING)

    await transport.clearTokens()

    expect(transport.readTokens()).toBeNull()
    expect(transport.getClientHandle()).toBeNull()
    expect(transport.readPendingFlow()).toBeNull()
  })
})
