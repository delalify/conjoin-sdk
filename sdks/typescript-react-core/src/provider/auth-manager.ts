import { requestHandshake, requestLogout } from '../auth-flow/auth-flow-api'
import type { AuthTransport, ConjoinAuthState, ConjoinSdkConfig } from './types'

type AuthManagerOptions = {
  transport: AuthTransport
  sdkConfig: ConjoinSdkConfig | null
  onStateChange: (state: ConjoinAuthState) => void
}

const REFRESH_RATIO = 0.85
const MIN_REFRESH_MS = 30_000

/**
 * Handshake-driven auth manager. A readable client handle alone does not mean
 * signed in (the handle also exists mid-flow), so signed-in is confirmed by a
 * handshake that mints a fresh httpOnly session against a completed client. The
 * session token is short-lived, so a successful handshake schedules the next one
 * ahead of expiry; any failed handshake collapses to signed-out. The browser
 * still never reads the session token. Verified identity (account, organizations,
 * roles) hydrates separately from the self-surface.
 */
export function createAuthManager(options: AuthManagerOptions) {
  const { transport, onStateChange } = options

  let currentState: ConjoinAuthState = { isLoaded: false }
  let refreshTimer: ReturnType<typeof setTimeout> | null = null
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

  function scheduleRefresh(ttlSeconds: number) {
    clearRefreshTimer()
    const delay = Math.max(MIN_REFRESH_MS, Math.floor(ttlSeconds * 1000 * REFRESH_RATIO))
    refreshTimer = setTimeout(() => {
      void runHandshake()
    }, delay)
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
      })
      scheduleRefresh(result.data.access_token_ttl_seconds)
      return true
    }

    applySignedOut()
    return false
  }

  function initialize() {
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
    return runHandshake()
  }

  async function signOut(): Promise<void> {
    const authDomain = options.sdkConfig?.auth.domain
    const wasSignedIn = currentState.isLoaded && currentState.isSignedIn

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
