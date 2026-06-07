import type { ConjoinClient } from '@conjoin-cloud/sdk'
import type { QueryClient } from '@tanstack/query-core'
import { createContext } from 'react'
import type { IdentityHydration } from './identity-types'
import type { ConjoinAuthState, ConjoinSdkConfig, ConjoinThemeState } from './types'

export type ConjoinClientContextValue = {
  client: ConjoinClient
  queryClient: QueryClient
  sdkConfig: ConjoinSdkConfig | null
  isConfigLoaded: boolean
}

export type ConjoinAuthActions = {
  signOut: () => Promise<void>
  attachCsrf: (headers: Record<string, string>) => Record<string, string>
}

export const ConjoinClientContext = createContext<ConjoinClientContextValue | null>(null)
export const ConjoinAuthStateContext = createContext<ConjoinAuthState | null>(null)
export const ConjoinAuthActionsContext = createContext<ConjoinAuthActions | null>(null)
export const ConjoinIdentityContext = createContext<IdentityHydration | null>(null)
export const ConjoinThemeContext = createContext<ConjoinThemeState | null>(null)
