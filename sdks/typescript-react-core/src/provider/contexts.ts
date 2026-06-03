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

export type ConjoinAuthActions = {
  getToken: () => string | null
  signOut: () => Promise<void>
}

export const ConjoinClientContext = createContext<ConjoinClientContextValue | null>(null)
export const ConjoinAuthStateContext = createContext<ConjoinAuthState | null>(null)
export const ConjoinAuthActionsContext = createContext<ConjoinAuthActions | null>(null)
export const ConjoinThemeContext = createContext<ConjoinThemeState | null>(null)
