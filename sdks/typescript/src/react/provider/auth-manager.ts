import type { ConjoinClient } from '../../core/types'
import type { AuthTransport, ConjoinAuthState, ConjoinSdkConfig } from './types'

type AuthManagerOptions = {
  client: ConjoinClient
  transport: AuthTransport
  sdkConfig: ConjoinSdkConfig | null
  onStateChange: (state: ConjoinAuthState) => void
}

type TokenPayload = {
  sub: string
  sid: string
  org_id?: string
  org_role?: string
  exp: number
}

const REFRESH_MARGIN_MS = 60_000

function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload as TokenPayload
  } catch {
    return null
  }
}

export function createAuthManager(options: AuthManagerOptions) {
  const { transport, onStateChange } = options

  let currentState: ConjoinAuthState = { isLoaded: false }
  let refreshTimer: ReturnType<typeof setTimeout> | null = null
  let refreshPromise: Promise<void> | null = null

  function setState(next: ConjoinAuthState) {
    currentState = next
    onStateChange(next)
  }

  function getState(): ConjoinAuthState {
    return currentState
  }

  function scheduleRefresh(expiresAt: number) {
    if (refreshTimer) clearTimeout(refreshTimer)

    const now = Date.now()
    const refreshAt = expiresAt * 1000 - REFRESH_MARGIN_MS
    const delay = Math.max(refreshAt - now, 0)

    refreshTimer = setTimeout(() => {
      refreshTokens().catch(() => {
        setState({ isLoaded: true, isSignedIn: false })
      })
    }, delay)
  }

  async function refreshTokens(): Promise<void> {
    if (refreshPromise) return refreshPromise

    refreshPromise = transport.acquireRefreshLock(async () => {
      try {
        const authDomain = options.sdkConfig?.auth.domain
        if (!authDomain) return

        const response = await fetch(`https://${authDomain}/v1/auth/self/sessions/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...transport.attachAuth({}),
            ...(transport.attachCsrf ? transport.attachCsrf({}) : {}),
          },
        })

        if (!response.ok) {
          await transport.clearTokens()
          setState({ isLoaded: true, isSignedIn: false })
          return
        }

        const body = (await response.json()) as { data: { access_token: string; refresh_token: string } }
        const { access_token, refresh_token } = body.data

        await transport.storeTokens(access_token, refresh_token)

        const payload = decodeTokenPayload(access_token)
        if (payload) {
          setState({
            isLoaded: true,
            isSignedIn: true,
            accountId: payload.sub,
            sessionId: payload.sid,
            organizationId: payload.org_id ?? null,
            organizationRole: payload.org_role ?? null,
            accessToken: access_token,
          })
          scheduleRefresh(payload.exp)
        }
      } catch {
        await transport.clearTokens()
        setState({ isLoaded: true, isSignedIn: false })
      }
    })

    try {
      await refreshPromise
    } finally {
      refreshPromise = null
    }
  }

  function initialize() {
    const state = transport.readAuthState()
    setState(state)

    if (state.isLoaded && state.isSignedIn) {
      const payload = decodeTokenPayload(state.accessToken)
      if (payload) {
        const now = Date.now() / 1000
        if (payload.exp <= now) {
          refreshTokens().catch(() => {
            setState({ isLoaded: true, isSignedIn: false })
          })
        } else {
          scheduleRefresh(payload.exp)
        }
      }
    }
  }

  async function signOut(): Promise<void> {
    if (refreshTimer) clearTimeout(refreshTimer)

    const authDomain = options.sdkConfig?.auth.domain
    if (authDomain && currentState.isLoaded && currentState.isSignedIn) {
      try {
        await fetch(`https://${authDomain}/v1/auth/self/sessions/${currentState.sessionId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...transport.attachAuth({}),
            ...(transport.attachCsrf ? transport.attachCsrf({}) : {}),
          },
        })
      } catch {
        // Sign out locally even if the server call fails
      }
    }

    await transport.clearTokens()
    setState({ isLoaded: true, isSignedIn: false })
  }

  function getToken(): string | null {
    if (currentState.isLoaded && currentState.isSignedIn) {
      return currentState.accessToken
    }
    return null
  }

  function destroy() {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshPromise = null
  }

  return {
    initialize,
    getState,
    getToken,
    signOut,
    refreshTokens,
    destroy,
  }
}

export type AuthManager = ReturnType<typeof createAuthManager>
