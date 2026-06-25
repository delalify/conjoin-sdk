import {
  requestHandshake,
  requestLogout,
  requestNativeLogout,
  requestNativeRefresh,
  requestNativeTokenMint,
} from '../auth-flow/auth-flow-api'
import type {
  AuthTransport,
  ClientHandle,
  ConjoinAuthState,
  ConjoinSdkConfig,
  NativeAuthSession,
  NativeAuthTransport,
} from './types'

type AuthManagerOptions = {
  transport: AuthTransport
  sdkConfig: ConjoinSdkConfig | null
  onStateChange: (state: ConjoinAuthState) => void
}

const REFRESH_RATIO = 0.85
const MIN_REFRESH_MS = 30_000

type NativeCapableTransport = AuthTransport & NativeAuthTransport

function isNativeTransport(transport: AuthTransport): transport is NativeCapableTransport {
  return (
    typeof transport.readTokens === 'function' &&
    typeof transport.storeTokens === 'function' &&
    typeof transport.clearTokens === 'function' &&
    typeof transport.readSession === 'function' &&
    typeof transport.acquireRefreshLock === 'function' &&
    typeof transport.subscribe === 'function'
  )
}

function nativeSignedInState(session: NativeAuthSession): ConjoinAuthState {
  return {
    isLoaded: true,
    isSignedIn: true,
    clientId: null,
    referenceId: null,
    accountId: session.accountId,
    sessionId: session.sessionId,
    organizationId: session.organizationId,
    organizationRoles: session.organizationRoles,
  }
}

/**
 * Auth manager for both runtimes. On the web a readable client handle alone does
 * not mean signed in (the handle also exists mid-flow), so signed-in is confirmed
 * by a handshake that mints a fresh httpOnly session against a completed client.
 * On native there are no cookies: the session is the bearer-token pair in secure
 * storage, identity is decoded from the access-token JWT, and refresh rotates the
 * tokens through the native refresh endpoint. Either way the manager schedules the
 * next refresh ahead of expiry and collapses any failure to signed-out.
 */
export function createAuthManager(options: AuthManagerOptions) {
  const { transport, onStateChange } = options
  const native = isNativeTransport(transport) ? transport : null

  let currentState: ConjoinAuthState = { isLoaded: false }
  let refreshTimer: ReturnType<typeof setTimeout> | null = null
  let unsubscribeNative: (() => void) | null = null
  let isBusy = false
  let destroyed = false

  function setState(next: ConjoinAuthState) {
    currentState = next
    onStateChange(next)
  }

  function getState(): ConjoinAuthState {
    return currentState
  }

  function clearRefreshTimer() {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }

  function scheduleRefresh(ttlSeconds: number, run: () => void) {
    clearRefreshTimer()
    const delay = Math.max(MIN_REFRESH_MS, Math.floor(ttlSeconds * 1000 * REFRESH_RATIO))
    refreshTimer = setTimeout(run, delay)
  }

  function applySignedOut() {
    clearRefreshTimer()
    setState({ isLoaded: true, isSignedIn: false })
  }

  async function runHandshake(): Promise<boolean> {
    const authDomain = options.sdkConfig?.auth.domain
    const handle = transport.getClientHandle()

    if (!authDomain || !handle) {
      if (!destroyed) applySignedOut()
      return false
    }

    const result = await requestHandshake(authDomain, transport.attachCsrf({ 'Content-Type': 'application/json' }))
    if (destroyed) return false

    if (result.ok && result.data) {
      setState({
        isLoaded: true,
        isSignedIn: true,
        clientId: handle.client_id,
        referenceId: handle.reference_id,
        accountId: null,
        sessionId: null,
        organizationId: null,
        organizationRoles: [],
      })
      scheduleRefresh(result.data.access_token_ttl_seconds, () => {
        void runHandshake()
      })
      return true
    }

    applySignedOut()
    return false
  }

  function reconcileNative(transportRef: NativeCapableTransport) {
    if (destroyed || isBusy) return

    const tokens = transportRef.readTokens()
    if (!tokens) {
      const handle = transportRef.getClientHandle()
      const pending = transportRef.readPendingFlow()
      if (handle && pending) {
        void runNativeMint(transportRef, handle, pending.codeVerifier)
        return
      }
      applySignedOut()
      return
    }

    const session = transportRef.readSession()
    if (!session) {
      void runNativeRefresh(transportRef)
      return
    }

    const ttlSeconds = (session.expiresAtMs - Date.now()) / 1000
    if (ttlSeconds * 1000 <= MIN_REFRESH_MS) {
      void runNativeRefresh(transportRef)
      return
    }

    setState(nativeSignedInState(session))
    scheduleRefresh(ttlSeconds, () => {
      void runNativeRefresh(transportRef)
    })
  }

  async function runNativeMint(
    transportRef: NativeCapableTransport,
    handle: ClientHandle,
    codeVerifier: string,
  ): Promise<boolean> {
    return transportRef.acquireRefreshLock(async () => {
      if (destroyed) return false
      if (transportRef.readTokens()) return true

      const authDomain = options.sdkConfig?.auth.domain
      if (!authDomain) {
        if (!destroyed) applySignedOut()
        return false
      }

      isBusy = true
      try {
        const result = await requestNativeTokenMint(authDomain, handle, codeVerifier)
        if (destroyed) return false

        if (result.ok && result.data) {
          await transportRef.storeTokens({
            accessToken: result.data.access_token,
            refreshToken: result.data.refresh_token,
          })
          await transportRef.setClientHandle(handle)
          transportRef.clearPendingFlow()
          applyNativeTokenResult(transportRef, result.data)
          return true
        }

        transportRef.clearPendingFlow()
        await transportRef.clearTokens()
        applySignedOut()
        return false
      } finally {
        isBusy = false
      }
    })
  }

  function applyNativeTokenResult(
    transportRef: NativeCapableTransport,
    data: { access_token: string; expires_in: number; session_id: string; account_id: string },
  ) {
    const session = transportRef.readSession()
    if (session) {
      setState(nativeSignedInState(session))
    } else {
      setState({
        isLoaded: true,
        isSignedIn: true,
        clientId: null,
        referenceId: null,
        accountId: data.account_id,
        sessionId: data.session_id,
        organizationId: null,
        organizationRoles: [],
      })
    }
    scheduleRefresh(data.expires_in, () => {
      void runNativeRefresh(transportRef)
    })
  }

  async function runNativeRefresh(transportRef: NativeCapableTransport): Promise<boolean> {
    return transportRef.acquireRefreshLock(async () => {
      if (destroyed) return false

      const tokens = transportRef.readTokens()
      const authDomain = options.sdkConfig?.auth.domain
      if (!tokens || !authDomain) {
        await transportRef.clearTokens()
        if (!destroyed) applySignedOut()
        return false
      }

      isBusy = true
      try {
        const result = await requestNativeRefresh(authDomain, tokens.refreshToken)
        if (destroyed) return false

        if (result.ok && result.data) {
          await transportRef.storeTokens({
            accessToken: result.data.access_token,
            refreshToken: result.data.refresh_token,
          })
          applyNativeTokenResult(transportRef, result.data)
          return true
        }

        await transportRef.clearTokens()
        applySignedOut()
        return false
      } finally {
        isBusy = false
      }
    })
  }

  function initialize() {
    if (native) {
      unsubscribeNative = native.subscribe(() => reconcileNative(native))
      reconcileNative(native)
      return
    }

    const handle = transport.getClientHandle()
    if (!handle) {
      applySignedOut()
      return
    }

    if (!options.sdkConfig?.auth.domain) {
      setState({ isLoaded: false })
      return
    }

    void runHandshake()
  }

  async function bootstrapSession(): Promise<boolean> {
    if (native) {
      if (native.readTokens()) {
        return runNativeRefresh(native)
      }
      // Only the sign-in/up hooks call this, and only once the flow reports
      // complete, so the pending flow's handle is a safe mint signal here even
      // though reconcile (which fires on any change) trusts only the set handle.
      const pending = native.readPendingFlow()
      const handle = native.getClientHandle() ?? pending?.clientHandle ?? null
      if (handle && pending) {
        return runNativeMint(native, handle, pending.codeVerifier)
      }
      return false
    }
    return runHandshake()
  }

  async function signOut(): Promise<void> {
    const authDomain = options.sdkConfig?.auth.domain
    const wasSignedIn = currentState.isLoaded && currentState.isSignedIn

    if (native) {
      clearRefreshTimer()
      const handle = native.getClientHandle()
      if (wasSignedIn && authDomain && handle) {
        try {
          await requestNativeLogout(authDomain, handle)
        } catch {
          // Sign out locally even when the server call fails.
        }
      }
      await native.clearTokens()
      setState({ isLoaded: true, isSignedIn: false })
      return
    }

    if (wasSignedIn && authDomain) {
      try {
        await requestLogout(authDomain, transport.attachCsrf({ 'Content-Type': 'application/json' }))
      } catch {
        // Sign out locally even when the server call fails.
      }
    }

    clearRefreshTimer()
    await transport.clearHandle()
    transport.clearPendingFlow()
    setState({ isLoaded: true, isSignedIn: false })
  }

  function destroy() {
    destroyed = true
    clearRefreshTimer()
    if (unsubscribeNative) {
      unsubscribeNative()
      unsubscribeNative = null
    }
    currentState = { isLoaded: false }
  }

  return {
    initialize,
    getState,
    bootstrapSession,
    signOut,
    destroy,
  }
}

export type AuthManager = ReturnType<typeof createAuthManager>
