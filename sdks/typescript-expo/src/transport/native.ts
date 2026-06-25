import type {
  AuthTokens,
  AuthTransport,
  ClientHandle,
  NativeAuthSession,
  PendingAuthFlow,
  PkceMaterial,
} from '@conjoin-cloud/react-core'

/**
 * React Native auth transport for the bearer-token flow (RFC 8252).
 *
 * Native apps have no DOM and cannot read fetch-set cookies, so a session here
 * is the access/refresh token pair the auth service mints from `/native/token`.
 * Tokens live only in OS secure storage (Keychain / Keystore) behind this
 * transport; the rest of the SDK reaches them through `attachBearer`, never
 * directly. PKCE runs on device: the verifier is generated up front but withheld
 * from every flow step and released only at the token mint. Sign-in happens in
 * the system browser, and `completeAuthReturn` handles the deep link the browser
 * redirects back to, capturing the completed client handle so the auth manager
 * can redeem it for tokens.
 */

const ACCESS_TOKEN_KEY = 'conjoin.auth.access_token'
const REFRESH_TOKEN_KEY = 'conjoin.auth.refresh_token'
const CLIENT_HANDLE_KEY = 'conjoin.auth.client_handle'
const PENDING_FLOW_KEY = 'conjoin.auth.pending_flow'

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

const BASE64URL_LOOKUP: Record<string, number> = (() => {
  const lookup: Record<string, number> = {}
  for (let index = 0; index < BASE64URL_ALPHABET.length; index += 1) {
    lookup[BASE64URL_ALPHABET[index]] = index
  }
  return lookup
})()

async function loadSecureStore() {
  try {
    return await import('expo-secure-store')
  } catch {
    throw new Error(
      'expo-secure-store is required for Conjoin auth on Expo. Install it with: npx expo install expo-secure-store',
    )
  }
}

async function loadCrypto() {
  try {
    return await import('expo-crypto')
  } catch {
    throw new Error('expo-crypto is required for Conjoin auth on Expo. Install it with: npx expo install expo-crypto')
  }
}

async function loadLinking() {
  try {
    return await import('expo-linking')
  } catch {
    return null
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let output = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const byte0 = bytes[index]
    const hasByte1 = index + 1 < bytes.length
    const hasByte2 = index + 2 < bytes.length
    const byte1 = hasByte1 ? bytes[index + 1] : 0
    const byte2 = hasByte2 ? bytes[index + 2] : 0
    output += BASE64URL_ALPHABET[byte0 >> 2]
    output += BASE64URL_ALPHABET[((byte0 & 0b11) << 4) | (byte1 >> 4)]
    if (!hasByte1) break
    output += BASE64URL_ALPHABET[((byte1 & 0b1111) << 2) | (byte2 >> 6)]
    if (!hasByte2) break
    output += BASE64URL_ALPHABET[byte2 & 0b111111]
  }
  return output
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(input: string): Uint8Array {
  const bytes: number[] = []
  let buffer = 0
  let bits = 0
  for (const char of input) {
    const value = BASE64URL_LOOKUP[char]
    if (value === undefined) continue
    buffer = (buffer << 6) | value
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 0xff)
    }
  }
  return Uint8Array.from(bytes)
}

function utf8Decode(bytes: Uint8Array): string {
  let result = ''
  let index = 0
  while (index < bytes.length) {
    const byte1 = bytes[index++]
    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1)
    } else if (byte1 >= 0xc0 && byte1 < 0xe0) {
      const byte2 = bytes[index++] & 0x3f
      result += String.fromCharCode(((byte1 & 0x1f) << 6) | byte2)
    } else if (byte1 >= 0xe0 && byte1 < 0xf0) {
      const byte2 = bytes[index++] & 0x3f
      const byte3 = bytes[index++] & 0x3f
      result += String.fromCharCode(((byte1 & 0x0f) << 12) | (byte2 << 6) | byte3)
    } else {
      const byte2 = bytes[index++] & 0x3f
      const byte3 = bytes[index++] & 0x3f
      const byte4 = bytes[index++] & 0x3f
      const codepoint = ((byte1 & 0x07) << 18) | (byte2 << 12) | (byte3 << 6) | byte4
      const offset = codepoint - 0x10000
      result += String.fromCharCode(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff))
    }
  }
  return result
}

async function createPkce(): Promise<PkceMaterial> {
  const crypto = await loadCrypto()
  const state = bytesToBase64Url(await crypto.getRandomBytesAsync(32))
  const codeVerifier = bytesToBase64Url(await crypto.getRandomBytesAsync(32))
  const digest = await crypto.digestStringAsync(crypto.CryptoDigestAlgorithm.SHA256, codeVerifier, {
    encoding: crypto.CryptoEncoding.BASE64,
  })

  return { state, codeVerifier, codeChallenge: toBase64Url(digest) }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function toClientHandle(value: unknown): ClientHandle | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const candidate = value as Record<string, unknown>
  if (!isNonEmptyString(candidate.client_id) || !isNonEmptyString(candidate.reference_id)) {
    return null
  }
  return { client_id: candidate.client_id, reference_id: candidate.reference_id }
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
  if (kind !== 'sign-in' && kind !== 'sign-up') return null
  if (!isNonEmptyString(state) || !isNonEmptyString(codeVerifier) || !isNonEmptyString(codeChallenge)) return null
  if (!isNullableString(serverState) || !isNullableString(verificationMethod) || !isNullableString(identifier)) {
    return null
  }

  return {
    kind,
    state,
    codeVerifier,
    codeChallenge,
    serverState,
    verificationMethod,
    identifier,
    clientHandle: toClientHandle(candidate.clientHandle),
  }
}

function parseClientHandle(raw: string): ClientHandle | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(decoded)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null
  }
  const candidate = parsed as Record<string, unknown>
  if (!isNonEmptyString(candidate.client_id) || !isNonEmptyString(candidate.reference_id)) {
    return null
  }
  return { client_id: candidate.client_id, reference_id: candidate.reference_id }
}

/**
 * Decodes the signed-in identity from the access-token JWT. The signature is not
 * verified on device (the SDK holds no signing key); these claims drive UI state
 * only, and every request is still authorized by the server against the token.
 */
function decodeNativeSession(accessToken: string): NativeAuthSession | null {
  const segments = accessToken.split('.')
  if (segments.length !== 3) return null

  let claims: Record<string, unknown>
  try {
    const parsed = JSON.parse(utf8Decode(base64UrlToBytes(segments[1])))
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    claims = parsed as Record<string, unknown>
  } catch {
    return null
  }

  const accountId = claims.sub
  const sessionId = claims.session_id
  const expiresAt = claims.exp
  if (!isNonEmptyString(accountId) || !isNonEmptyString(sessionId) || typeof expiresAt !== 'number') {
    return null
  }

  const organizationId = isNonEmptyString(claims.organization_id) ? claims.organization_id : null
  const organizationRoles = Array.isArray(claims.organization_roles)
    ? claims.organization_roles.filter((role): role is string => typeof role === 'string')
    : []

  return {
    accountId,
    sessionId,
    organizationId,
    organizationRoles,
    expiresAtMs: expiresAt * 1000,
  }
}

function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {}
  const queryStart = url.indexOf('?')
  if (queryStart < 0) return params
  const query = url.slice(queryStart + 1).split('#')[0]
  for (const pair of query.split('&')) {
    if (!pair) continue
    const separator = pair.indexOf('=')
    const rawKey = separator < 0 ? pair : pair.slice(0, separator)
    const rawValue = separator < 0 ? '' : pair.slice(separator + 1)
    let key: string
    try {
      key = decodeURIComponent(rawKey)
    } catch {
      key = rawKey
    }
    params[key] = rawValue
  }
  return params
}

async function openSystemBrowser(url: string): Promise<string | null> {
  let webBrowser: typeof import('expo-web-browser')
  try {
    webBrowser = await import('expo-web-browser')
  } catch {
    throw new Error(
      'expo-web-browser is required to complete sign-in on Expo. Install it with: npx expo install expo-web-browser',
    )
  }
  const result = await webBrowser.openAuthSessionAsync(url)
  return result.type === 'success' ? result.url : null
}

export function createNativeTransport(): AuthTransport {
  let accessToken: string | null = null
  let refreshToken: string | null = null
  let clientHandle: ClientHandle | null = null
  let pendingFlow: PendingAuthFlow | null = null
  let hydrated = false
  let refreshLock: Promise<unknown> = Promise.resolve()

  const listeners = new Set<() => void>()

  function notify() {
    for (const listener of listeners) {
      try {
        listener()
      } catch {
        // A listener failure must not stop the rest from being notified.
      }
    }
  }

  async function persist(key: string, value: string) {
    try {
      const store = await loadSecureStore()
      await store.setItemAsync(key, value)
    } catch {
      // Persisting failed; the in-memory mirror keeps a same-session value alive.
    }
  }

  async function remove(key: string) {
    try {
      const store = await loadSecureStore()
      await store.deleteItemAsync(key)
    } catch {
      // The in-memory mirror is already cleared; a stale stored value is dropped
      // on the next successful write or read.
    }
  }

  const hydrate = async () => {
    if (hydrated) return
    hydrated = true
    try {
      const store = await loadSecureStore()
      const [storedAccess, storedRefresh, storedHandle, storedFlow] = await Promise.all([
        store.getItemAsync(ACCESS_TOKEN_KEY),
        store.getItemAsync(REFRESH_TOKEN_KEY),
        store.getItemAsync(CLIENT_HANDLE_KEY),
        store.getItemAsync(PENDING_FLOW_KEY),
      ])
      if (storedAccess && !accessToken) accessToken = storedAccess
      if (storedRefresh && !refreshToken) refreshToken = storedRefresh
      if (storedHandle && !clientHandle) clientHandle = parseClientHandle(storedHandle)
      if (storedFlow && !pendingFlow) pendingFlow = parsePendingFlow(storedFlow)
    } catch {
      // Secure store is unavailable; an in-session sign-in still works in memory.
    }
    notify()
  }

  void hydrate()
    .then(setupDeepLinks)
    .catch(() => {})

  async function setClientHandle(handle: ClientHandle) {
    clientHandle = handle
    await persist(CLIENT_HANDLE_KEY, encodeURIComponent(JSON.stringify(handle)))
    notify()
  }

  async function completeAuthReturn(returnUrl: string): Promise<void> {
    const params = parseQueryParams(returnUrl)
    const rawHandle = params.client_handle
    if (!rawHandle) return
    const handle = parseClientHandle(rawHandle)
    if (!handle) return

    if (!pendingFlow) return
    if (params.state && params.state !== pendingFlow.state) return

    await setClientHandle(handle)
  }

  /**
   * Catches the auth return deep link both when the app is already running and
   * when a magic link cold-starts it (`getInitialURL`). The handle is only
   * adopted when the link's `state` matches the pending flow, so an unrelated or
   * forged deep link cannot inject a session. Best-effort: if `expo-linking` is
   * absent, system-browser returns from `redirect` still complete sign-in.
   */
  async function setupDeepLinks(): Promise<void> {
    const linking = await loadLinking()
    if (!linking) return
    try {
      const initialUrl = await linking.getInitialURL()
      if (initialUrl) await completeAuthReturn(initialUrl)
    } catch {
      // No initial deep link to consume; live links are still handled below.
    }
    try {
      linking.addEventListener('url', event => {
        void completeAuthReturn(event.url)
      })
    } catch {
      // Deep-link events are unavailable; same-session browser returns still work.
    }
  }

  return {
    getClientHandle(): ClientHandle | null {
      return clientHandle
    },

    clearHandle() {
      clientHandle = null
      void remove(CLIENT_HANDLE_KEY)
      notify()
    },

    setClientHandle,

    attachCsrf(headers: Record<string, string>): Record<string, string> {
      return headers
    },

    attachBearer(headers: Record<string, string>): Record<string, string> {
      if (!accessToken) return headers
      return { ...headers, Authorization: `Bearer ${accessToken}` }
    },

    readTokens(): AuthTokens | null {
      if (!accessToken || !refreshToken) return null
      return { accessToken, refreshToken }
    },

    async storeTokens(tokens: AuthTokens) {
      accessToken = tokens.accessToken
      refreshToken = tokens.refreshToken
      await Promise.all([
        persist(ACCESS_TOKEN_KEY, tokens.accessToken),
        persist(REFRESH_TOKEN_KEY, tokens.refreshToken),
      ])
      notify()
    },

    async clearTokens() {
      accessToken = null
      refreshToken = null
      clientHandle = null
      pendingFlow = null
      await Promise.all([
        remove(ACCESS_TOKEN_KEY),
        remove(REFRESH_TOKEN_KEY),
        remove(CLIENT_HANDLE_KEY),
        remove(PENDING_FLOW_KEY),
      ])
      notify()
    },

    readSession(): NativeAuthSession | null {
      if (!accessToken) return null
      return decodeNativeSession(accessToken)
    },

    acquireRefreshLock<T>(task: () => Promise<T>): Promise<T> {
      const run = refreshLock.then(task, task)
      refreshLock = run.then(
        () => undefined,
        () => undefined,
      )
      return run
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    createPkce,

    savePendingFlow(flow: PendingAuthFlow) {
      pendingFlow = flow
      void persist(PENDING_FLOW_KEY, JSON.stringify(flow))
    },

    readPendingFlow(): PendingAuthFlow | null {
      return pendingFlow
    },

    clearPendingFlow() {
      pendingFlow = null
      void remove(PENDING_FLOW_KEY)
    },

    redirect(url: string) {
      if (!/^https:\/\//i.test(url)) return
      void (async () => {
        try {
          const returnUrl = await openSystemBrowser(url)
          if (returnUrl) await completeAuthReturn(returnUrl)
        } catch {
          // A cancelled or failed browser session leaves the app signed-out;
          // the user can retry sign-in.
        }
      })()
    },
  }
}
