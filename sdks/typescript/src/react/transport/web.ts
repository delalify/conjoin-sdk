import type { AuthTransport, ConjoinAuthState } from '../provider/types'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const prefix = `${name}=`
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.substring(prefix.length))
    }
  }
  return null
}

type AuthCookiePayload = {
  accountId: string
  sessionId: string
  orgId: string | null
  orgRole: string | null
}

function parseAuthCookie(): AuthCookiePayload | null {
  const raw = getCookie('__conjoin_auth_cl')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    if (typeof parsed.accountId !== 'string' || typeof parsed.sessionId !== 'string') return null
    return parsed as AuthCookiePayload
  } catch {
    return null
  }
}

function deleteCookie(name: string) {
  if (typeof window !== 'undefined' && 'cookieStore' in window) {
    const store = window.cookieStore as { delete: (name: string) => Promise<void> }
    store.delete(name).catch(() => {})
  } else if (typeof document !== 'undefined') {
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API fallback for older browsers
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
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

    storeTokens() {
      // Tokens are HttpOnly cookies managed by the auth server
    },

    clearTokens() {
      deleteCookie('__conjoin_auth_cl')
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
