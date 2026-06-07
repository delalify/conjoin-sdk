import type { AuthTransport, ClientHandle, PendingAuthFlow, PkceMaterial } from '../provider/types'

const CLIENT_HANDLE_COOKIE = '__conjoin_auth_cl'
const CSRF_COOKIE = '__conjoin_auth_csrf'
const PENDING_FLOW_KEY = '__conjoin_auth_flow'

const SAFE_HANDLE_IDENTIFIER = /^[\w.:-]+$/
const PENDING_FLOW_KINDS = new Set(['sign-in', 'sign-up'])
const VERIFICATION_METHODS = new Set(['pin_code', 'magic_link'])

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

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function createPkce(): Promise<PkceMaterial> {
  const state = toBase64Url(crypto.getRandomValues(new Uint8Array(32)))
  const codeVerifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
  const codeChallenge = toBase64Url(new Uint8Array(digest))

  return { state, codeVerifier, codeChallenge }
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function parsePendingFlow(raw: string): PendingAuthFlow | null {
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
  const { kind, state, codeVerifier, codeChallenge, serverState, verificationMethod, identifier } = candidate

  if (typeof kind !== 'string' || !PENDING_FLOW_KINDS.has(kind)) return null
  if (typeof state !== 'string' || typeof codeVerifier !== 'string' || typeof codeChallenge !== 'string') return null
  if (!isNullableString(serverState) || !isNullableString(identifier)) return null
  if (
    verificationMethod !== null &&
    (typeof verificationMethod !== 'string' || !VERIFICATION_METHODS.has(verificationMethod))
  ) {
    return null
  }

  return {
    kind: kind as PendingAuthFlow['kind'],
    state,
    codeVerifier,
    codeChallenge,
    serverState,
    verificationMethod: verificationMethod as PendingAuthFlow['verificationMethod'],
    identifier,
  }
}

export function createWebTransport(): AuthTransport {
  return {
    getClientHandle(): ClientHandle | null {
      return parseClientHandle()
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

    createPkce,

    savePendingFlow(flow: PendingAuthFlow) {
      const storage = getSessionStorage()
      if (!storage) return
      try {
        storage.setItem(PENDING_FLOW_KEY, JSON.stringify(flow))
      } catch {}
    },

    readPendingFlow(): PendingAuthFlow | null {
      const storage = getSessionStorage()
      if (!storage) return null
      const raw = storage.getItem(PENDING_FLOW_KEY)
      if (!raw) return null
      return parsePendingFlow(raw)
    },

    clearPendingFlow() {
      const storage = getSessionStorage()
      if (!storage) return
      try {
        storage.removeItem(PENDING_FLOW_KEY)
      } catch {}
    },

    redirect(url: string) {
      if (typeof window === 'undefined') return
      let parsed: URL
      try {
        parsed = new URL(url)
      } catch {
        return
      }
      if (parsed.protocol !== 'https:') return
      window.location.assign(parsed.toString())
    },
  }
}
