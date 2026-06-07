import type { AuthTransport, ConjoinAuthState, ConjoinSdkConfig } from './types'

type AuthManagerOptions = {
  transport: AuthTransport
  sdkConfig: ConjoinSdkConfig | null
  onStateChange: (state: ConjoinAuthState) => void
}

const VALID_DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i

/**
 * Presence-only auth manager. The browser never holds the session token (it is
 * an httpOnly cookie), so this manager decodes no token and runs no refresh.
 * Signed-in presence and the readable client handle are derived synchronously
 * from the `__conjoin_auth_cl` cookie through the transport. Verified identity
 * (account, organizations, roles) hydrates separately from the self-surface.
 */
export function createAuthManager(options: AuthManagerOptions) {
  const { transport, onStateChange } = options

  let currentState: ConjoinAuthState = { isLoaded: false }

  function setState(next: ConjoinAuthState) {
    currentState = next
    onStateChange(next)
  }

  function getState(): ConjoinAuthState {
    return currentState
  }

  function initialize() {
    setState(transport.readAuthState())
  }

  async function signOut(): Promise<void> {
    const authDomain = options.sdkConfig?.auth.domain
    const canCallServer = currentState.isLoaded && currentState.isSignedIn && Boolean(authDomain)

    if (canCallServer && authDomain && VALID_DOMAIN_PATTERN.test(authDomain)) {
      try {
        await fetch(`https://${authDomain}/v1/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: transport.attachCsrf({ 'Content-Type': 'application/json' }),
        })
      } catch {
        // Sign out locally even when the server call fails.
      }
    }

    await transport.clearHandle()
    setState({ isLoaded: true, isSignedIn: false })
  }

  function destroy() {
    currentState = { isLoaded: false }
  }

  return {
    initialize,
    getState,
    signOut,
    destroy,
  }
}

export type AuthManager = ReturnType<typeof createAuthManager>
