import type { AuthTransport, ConjoinAuthState } from '../provider/types'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function parseAuthCookie(): {
  accountId: string
  sessionId: string
  orgId: string | null
  orgRole: string | null
} | null {
  const raw = getCookie('__conjoin_auth_cl')
  if (!raw) return null
  try {
    return JSON.parse(raw) as { accountId: string; sessionId: string; orgId: string | null; orgRole: string | null }
  } catch {
    return null
  }
}

export function createWebTransport(): AuthTransport {
  return {
    readAuthState(): ConjoinAuthState {
      const parsed = parseAuthCookie()
      if (!parsed) {
        return { isLoaded: true, isSignedIn: false }
      }

      return {
        isLoaded: true,
        isSignedIn: true,
        accountId: parsed.accountId,
        sessionId: parsed.sessionId,
        organizationId: parsed.orgId,
        organizationRole: parsed.orgRole,
        accessToken: '',
      }
    },

    storeTokens(_accessToken: string, _refreshToken: string) {
      // Tokens are stored as HttpOnly cookies by the auth server.
      // The access token in the client state is used for API calls only.
    },

    clearTokens() {
      if (typeof window !== 'undefined' && 'cookieStore' in window) {
        ;(window as unknown as { cookieStore: { delete: (name: string) => Promise<void> } }).cookieStore.delete(
          '__conjoin_auth_cl',
        )
      } else if (typeof document !== 'undefined') {
        // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API not available, fallback required
        document.cookie = '__conjoin_auth_cl=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      }
    },

    attachAuth(headers: Record<string, string>): Record<string, string> {
      return headers
    },

    attachCsrf(headers: Record<string, string>): Record<string, string> {
      const csrf = getCookie('__conjoin_auth_csrf')
      if (csrf) {
        return { ...headers, 'X-CSRF-Token': csrf }
      }
      return headers
    },

    async acquireRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
      if (typeof navigator !== 'undefined' && 'locks' in navigator) {
        return navigator.locks.request('conjoin-token-refresh', fn)
      }
      return fn()
    },
  }
}
