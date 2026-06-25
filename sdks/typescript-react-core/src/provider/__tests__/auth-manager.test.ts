import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  requestHandshake,
  requestLogout,
  requestNativeLogout,
  requestNativeRefresh,
  requestNativeTokenMint,
} from '../../auth-flow/auth-flow-api'
import { createAuthManager } from '../auth-manager'
import type {
  AuthTokens,
  AuthTransport,
  ClientHandle,
  ConjoinAuthState,
  ConjoinSdkConfig,
  NativeAuthSession,
  NativeAuthTransport,
  PendingAuthFlow,
} from '../types'

vi.mock('../../auth-flow/auth-flow-api', () => ({
  requestHandshake: vi.fn(),
  requestLogout: vi.fn(),
  requestNativeLogout: vi.fn(),
  requestNativeRefresh: vi.fn(),
  requestNativeTokenMint: vi.fn(),
}))

const AUTH_DOMAIN = 'auth.acme.test'
const HANDLE: ClientHandle = { client_id: 'authcl_123', reference_id: 'ref_123' }
const PENDING: PendingAuthFlow = {
  kind: 'sign-in',
  state: 'state-value',
  codeVerifier: 'verifier-value',
  codeChallenge: 'challenge-value',
  serverState: null,
  verificationMethod: null,
  identifier: 'ada@acme.test',
  clientHandle: HANDLE,
}

function sessionExpiringInMs(ms: number): NativeAuthSession {
  return {
    accountId: 'acct_123',
    sessionId: 'sess_123',
    organizationId: 'org_123',
    organizationRoles: ['admin'],
    expiresAtMs: Date.now() + ms,
  }
}

function mintData(accessToken: string) {
  return {
    access_token: accessToken,
    token_type: 'Bearer' as const,
    expires_in: 3600,
    refresh_token: 'refresh-token-value',
    session_id: 'sess_123',
    account_id: 'acct_123',
  }
}

type FakeNativeTransport = {
  transport: AuthTransport & NativeAuthTransport
  emit: () => void
  state: {
    tokens: AuthTokens | null
    session: NativeAuthSession | null
    handle: ClientHandle | null
    pending: PendingAuthFlow | null
  }
}

function createFakeNativeTransport(initial: Partial<FakeNativeTransport['state']> = {}): FakeNativeTransport {
  const state: FakeNativeTransport['state'] = {
    tokens: initial.tokens ?? null,
    session: initial.session ?? null,
    handle: initial.handle ?? null,
    pending: initial.pending ?? null,
  }
  const listeners = new Set<() => void>()
  let lock: Promise<unknown> = Promise.resolve()

  const transport: AuthTransport & NativeAuthTransport = {
    getClientHandle: () => state.handle,
    clearHandle: () => {
      state.handle = null
    },
    attachCsrf: headers => headers,
    attachBearer: headers =>
      state.tokens ? { ...headers, Authorization: `Bearer ${state.tokens.accessToken}` } : headers,
    createPkce: async () => ({ state: 'state', codeVerifier: 'verifier', codeChallenge: 'challenge' }),
    savePendingFlow: flow => {
      state.pending = flow
    },
    readPendingFlow: () => state.pending,
    clearPendingFlow: () => {
      state.pending = null
    },
    redirect: () => {},
    readTokens: () => state.tokens,
    storeTokens: tokens => {
      state.tokens = tokens
      state.session = sessionExpiringInMs(3600 * 1000)
    },
    clearTokens: () => {
      state.tokens = null
      state.session = null
      state.handle = null
      state.pending = null
    },
    readSession: () => state.session,
    setClientHandle: handle => {
      state.handle = handle
    },
    acquireRefreshLock: fn => {
      const run = lock.then(fn, fn)
      lock = run.then(
        () => undefined,
        () => undefined,
      )
      return run
    },
    subscribe: listener => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }

  return {
    transport,
    emit: () => {
      for (const listener of listeners) listener()
    },
    state,
  }
}

function sdkConfig(): ConjoinSdkConfig {
  return {
    project_id: 'proj_123',
    environment: 'test',
    api_url: 'https://api.acme.test',
    branding: null,
    auth: { domain: AUTH_DOMAIN, sign_in_methods: [], mfa_enabled: false, sign_up_enabled: true },
    relay: { url: '' },
  }
}

function drainLock(fake: FakeNativeTransport): Promise<unknown> {
  return fake.transport.acquireRefreshLock(async () => undefined)
}

function lastState(states: ConjoinAuthState[]): ConjoinAuthState {
  const value = states.at(-1)
  if (!value) throw new Error('no state emitted')
  return value
}

beforeEach(() => {
  vi.mocked(requestNativeTokenMint).mockReset()
  vi.mocked(requestNativeRefresh).mockReset()
  vi.mocked(requestNativeLogout).mockReset()
  vi.mocked(requestHandshake).mockReset()
  vi.mocked(requestLogout).mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createAuthManager (native)', () => {
  it('mints tokens from a completed handle and pending flow on initialize', async () => {
    const fake = createFakeNativeTransport({ handle: HANDLE, pending: PENDING })
    vi.mocked(requestNativeTokenMint).mockResolvedValue({
      ok: true,
      status: 200,
      data: mintData('access-token-1'),
      message: null,
    })
    const states: ConjoinAuthState[] = []
    const manager = createAuthManager({
      transport: fake.transport,
      sdkConfig: sdkConfig(),
      onStateChange: s => states.push(s),
    })

    manager.initialize()
    await drainLock(fake)

    expect(requestNativeTokenMint).toHaveBeenCalledTimes(1)
    expect(requestNativeTokenMint).toHaveBeenCalledWith(AUTH_DOMAIN, HANDLE, PENDING.codeVerifier)
    expect(fake.state.tokens?.accessToken).toBe('access-token-1')
    expect(fake.state.pending).toBeNull()
    const final = lastState(states)
    expect(final).toMatchObject({ isLoaded: true, isSignedIn: true, accountId: 'acct_123', sessionId: 'sess_123' })
    manager.destroy()
  })

  it('persists the client handle on mint so logout can revoke it', async () => {
    const fake = createFakeNativeTransport({ handle: null, pending: { ...PENDING, clientHandle: HANDLE } })
    vi.mocked(requestNativeTokenMint).mockResolvedValue({
      ok: true,
      status: 200,
      data: mintData('access-token-2'),
      message: null,
    })
    const manager = createAuthManager({ transport: fake.transport, sdkConfig: sdkConfig(), onStateChange: () => {} })

    const established = await manager.bootstrapSession()

    expect(established).toBe(true)
    expect(requestNativeTokenMint).toHaveBeenCalledWith(AUTH_DOMAIN, HANDLE, PENDING.codeVerifier)
    expect(fake.state.handle).toEqual(HANDLE)
    manager.destroy()
  })

  it('collapses to signed-out and clears tokens when the mint fails', async () => {
    const fake = createFakeNativeTransport({ handle: HANDLE, pending: PENDING })
    vi.mocked(requestNativeTokenMint).mockResolvedValue({
      ok: false,
      status: 401,
      data: null,
      message: 'rejected',
    })
    const states: ConjoinAuthState[] = []
    const manager = createAuthManager({
      transport: fake.transport,
      sdkConfig: sdkConfig(),
      onStateChange: s => states.push(s),
    })

    manager.initialize()
    await drainLock(fake)

    expect(fake.state.tokens).toBeNull()
    expect(fake.state.pending).toBeNull()
    expect(lastState(states)).toEqual({ isLoaded: true, isSignedIn: false })
    manager.destroy()
  })

  it('mints only once when reconcile is triggered repeatedly', async () => {
    const fake = createFakeNativeTransport({ handle: HANDLE, pending: PENDING })
    vi.mocked(requestNativeTokenMint).mockResolvedValue({
      ok: true,
      status: 200,
      data: mintData('access-token-3'),
      message: null,
    })
    const manager = createAuthManager({ transport: fake.transport, sdkConfig: sdkConfig(), onStateChange: () => {} })

    manager.initialize()
    fake.emit()
    fake.emit()
    await drainLock(fake)

    expect(requestNativeTokenMint).toHaveBeenCalledTimes(1)
    manager.destroy()
  })

  it('resumes a stored session without minting or refreshing', async () => {
    const fake = createFakeNativeTransport({
      tokens: { accessToken: 'stored', refreshToken: 'stored-refresh' },
      session: sessionExpiringInMs(3600 * 1000),
    })
    const states: ConjoinAuthState[] = []
    const manager = createAuthManager({
      transport: fake.transport,
      sdkConfig: sdkConfig(),
      onStateChange: s => states.push(s),
    })

    manager.initialize()
    await drainLock(fake)

    expect(requestNativeTokenMint).not.toHaveBeenCalled()
    expect(requestNativeRefresh).not.toHaveBeenCalled()
    expect(lastState(states)).toMatchObject({ isLoaded: true, isSignedIn: true, accountId: 'acct_123' })
    manager.destroy()
  })

  it('refreshes immediately when the stored session is within the refresh window', async () => {
    const fake = createFakeNativeTransport({
      tokens: { accessToken: 'stale', refreshToken: 'stale-refresh' },
      session: sessionExpiringInMs(5_000),
    })
    vi.mocked(requestNativeRefresh).mockResolvedValue({
      ok: true,
      status: 200,
      data: mintData('access-token-rotated'),
      message: null,
    })
    const manager = createAuthManager({ transport: fake.transport, sdkConfig: sdkConfig(), onStateChange: () => {} })

    manager.initialize()
    await drainLock(fake)

    expect(requestNativeRefresh).toHaveBeenCalledTimes(1)
    expect(requestNativeRefresh).toHaveBeenCalledWith(AUTH_DOMAIN, 'stale-refresh')
    expect(fake.state.tokens?.accessToken).toBe('access-token-rotated')
    manager.destroy()
  })

  it('signs out by revoking the handle and clearing tokens', async () => {
    const fake = createFakeNativeTransport({
      tokens: { accessToken: 'live', refreshToken: 'live-refresh' },
      session: sessionExpiringInMs(3600 * 1000),
      handle: HANDLE,
    })
    vi.mocked(requestNativeLogout).mockResolvedValue({ ok: true, status: 200, data: { success: true }, message: null })
    const states: ConjoinAuthState[] = []
    const manager = createAuthManager({
      transport: fake.transport,
      sdkConfig: sdkConfig(),
      onStateChange: s => states.push(s),
    })

    manager.initialize()
    await drainLock(fake)
    await manager.signOut()

    expect(requestNativeLogout).toHaveBeenCalledWith(AUTH_DOMAIN, HANDLE)
    expect(fake.state.tokens).toBeNull()
    expect(lastState(states)).toEqual({ isLoaded: true, isSignedIn: false })
    manager.destroy()
  })

  it('signs out locally even when the logout request throws', async () => {
    const fake = createFakeNativeTransport({
      tokens: { accessToken: 'live', refreshToken: 'live-refresh' },
      session: sessionExpiringInMs(3600 * 1000),
      handle: HANDLE,
    })
    vi.mocked(requestNativeLogout).mockRejectedValue(new Error('network down'))
    const manager = createAuthManager({ transport: fake.transport, sdkConfig: sdkConfig(), onStateChange: () => {} })

    manager.initialize()
    await drainLock(fake)
    await manager.signOut()

    expect(fake.state.tokens).toBeNull()
    manager.destroy()
  })

  it('bootstrapSession mints from a completed flow when no tokens exist', async () => {
    const fake = createFakeNativeTransport({ handle: HANDLE, pending: PENDING })
    vi.mocked(requestNativeTokenMint).mockResolvedValue({
      ok: true,
      status: 200,
      data: mintData('access-token-bootstrap'),
      message: null,
    })
    const manager = createAuthManager({ transport: fake.transport, sdkConfig: sdkConfig(), onStateChange: () => {} })

    const established = await manager.bootstrapSession()

    expect(established).toBe(true)
    expect(requestNativeTokenMint).toHaveBeenCalledTimes(1)
    manager.destroy()
  })
})

describe('createAuthManager (web)', () => {
  it('confirms sign-in through the cookie handshake', async () => {
    const handleRef: { current: ClientHandle | null } = { current: HANDLE }
    const webTransport: AuthTransport = {
      getClientHandle: () => handleRef.current,
      clearHandle: () => {
        handleRef.current = null
      },
      attachCsrf: headers => headers,
      createPkce: async () => ({ state: 'state', codeVerifier: 'verifier', codeChallenge: 'challenge' }),
      savePendingFlow: () => {},
      readPendingFlow: () => null,
      clearPendingFlow: () => {},
      redirect: () => {},
    }
    vi.mocked(requestHandshake).mockResolvedValue({
      ok: true,
      status: 200,
      data: { access_token_ttl_seconds: 3600, session_id: 'sess_web', account_id: 'acct_web', iat: 0, exp: 3600 },
      message: null,
    })
    const states: ConjoinAuthState[] = []
    const manager = createAuthManager({
      transport: webTransport,
      sdkConfig: sdkConfig(),
      onStateChange: s => states.push(s),
    })

    manager.initialize()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(requestNativeTokenMint).not.toHaveBeenCalled()
    expect(requestHandshake).toHaveBeenCalledTimes(1)
    expect(lastState(states)).toMatchObject({ isLoaded: true, isSignedIn: true, clientId: HANDLE.client_id })
    manager.destroy()
  })
})
