import type { ConjoinClient } from '@conjoin-cloud/sdk'
import type { QueryClient } from '@tanstack/query-core'
import { createContext } from 'react'
import type { ConjoinAuthState, ConjoinSdkConfig, ConjoinThemeState } from './types'

export type ConjoinClientContextValue = {
  client: ConjoinClient
  queryClient: QueryClient
  sdkConfig: ConjoinSdkConfig | null
  isConfigLoaded: boolean
}

export type ConjoinAuthContextValue = {
  authState: ConjoinAuthState
  getToken: () => string | null
  signOut: () => Promise<void>
  has: (params: { role?: string; permission?: string }) => boolean
}

export const ConjoinClientContext = createContext<ConjoinClientContextValue | null>(null)
export const ConjoinAuthContext = createContext<ConjoinAuthContextValue | null>(null)
export const ConjoinThemeContext = createContext<ConjoinThemeState | null>(null)
