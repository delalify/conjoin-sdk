import type { AuthTransport, ConjoinAuthState } from '../../react/provider/types'

type SecureStore = {
  getItemAsync: (key: string) => Promise<string | null>
  setItemAsync: (key: string, value: string) => Promise<void>
  deleteItemAsync: (key: string) => Promise<void>
}

const ACCESS_TOKEN_KEY = 'conjoin_access_token'
const REFRESH_TOKEN_KEY = 'conjoin_refresh_token'

let secureStore: SecureStore | null = null

async function loadSecureStore(): Promise<SecureStore> {
  if (secureStore) return secureStore
  try {
    const mod = await import('expo-secure-store')
    secureStore = mod as unknown as SecureStore
    return secureStore
  } catch {
    throw new Error(
      'expo-secure-store is required for Conjoin Expo support. Install it with: npx expo install expo-secure-store',
    )
  }
}

let refreshLockPromise: Promise<unknown> | null = null

export function createNativeTransport(): AuthTransport {
  let cachedAccessToken: string | null = null

  return {
    readAuthState(): ConjoinAuthState {
      if (cachedAccessToken) {
        return {
          isLoaded: true,
          isSignedIn: true,
          accountId: '',
          sessionId: '',
          organizationId: null,
          organizationRole: null,
          accessToken: cachedAccessToken,
        }
      }
      return { isLoaded: true, isSignedIn: false }
    },

    async storeTokens(accessToken: string, refreshToken: string) {
      cachedAccessToken = accessToken
      const store = await loadSecureStore()
      await Promise.all([
        store.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
        store.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
      ])
    },

    async clearTokens() {
      cachedAccessToken = null
      const store = await loadSecureStore()
      await Promise.all([store.deleteItemAsync(ACCESS_TOKEN_KEY), store.deleteItemAsync(REFRESH_TOKEN_KEY)])
    },

    attachAuth(headers: Record<string, string>): Record<string, string> {
      if (cachedAccessToken) {
        return { ...headers, Authorization: `Bearer ${cachedAccessToken}` }
      }
      return headers
    },

    async acquireRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
      if (refreshLockPromise) {
        await refreshLockPromise
      }

      const promise = fn()
      refreshLockPromise = promise

      try {
        return await promise
      } finally {
        refreshLockPromise = null
      }
    },
  }
}
