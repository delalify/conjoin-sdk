import type { AuthTransport, ConjoinAuthState } from '../provider/types'

const CLIENT_HANDLE_COOKIE = '__conjoin_auth_cl'
const CSRF_COOKIE = '__conjoin_auth_csrf'

const SAFE_HANDLE_IDENTIFIER = /^[\w.:-]+$/

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

type ClientHandle = {
  client_id: string
  reference_id: string
}

function parseClientHandle(): ClientHandle | null {
  const raw = getCookie(CLIENT_HANDLE_COOKIE)
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null
  }
  const candidate = parsed as Record<string, unknown>
  const clientId = candidate.client_id
  const referenceId = candidate.reference_id
  if (typeof clientId !== 'string' || !SAFE_HANDLE_IDENTIFIER.test(clientId)) {
    return null
  }
  if (typeof referenceId !== 'string' || !SAFE_HANDLE_IDENTIFIER.test(referenceId)) {
    return null
  }
  return { client_id: clientId, reference_id: referenceId }
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
      const handle = parseClientHandle()
      if (!handle) {
        return { isLoaded: true, isSignedIn: false }
      }

      return {
        isLoaded: true,
        isSignedIn: true,
        clientId: handle.client_id,
        referenceId: handle.reference_id,
      }
    },

    clearHandle() {
      deleteCookie(CLIENT_HANDLE_COOKIE)
    },

    attachCsrf(headers: Record<string, string>): Record<string, string> {
      const csrf = getCookie(CSRF_COOKIE)
      if (csrf) {
        return { ...headers, 'x-csrf-token': csrf }
      }
      return headers
    },
  }
}
