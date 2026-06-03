import { useCallback, useContext } from 'react'
import { ConjoinAuthActionsContext, ConjoinAuthStateContext } from '../provider/contexts'

export function useAuth() {
  const authState = useContext(ConjoinAuthStateContext)
  const actions = useContext(ConjoinAuthActionsContext)
  if (!authState || !actions) {
    throw new Error('useAuth must be used within a ConjoinProvider')
  }

  const { getToken, signOut } = actions
  const isSignedIn = authState.isLoaded && authState.isSignedIn
  const organizationRole = authState.isLoaded && authState.isSignedIn ? authState.organizationRole : null

  const has = useCallback(
    (params: { role?: string; permission?: string }) => {
      if (!isSignedIn) return false
      if (params.role && organizationRole !== params.role) return false
      return true
    },
    [isSignedIn, organizationRole],
  )

  if (!authState.isLoaded) {
    return {
      isLoaded: false as const,
      isSignedIn: undefined,
      accountId: undefined,
      sessionId: undefined,
      organizationId: undefined,
      organizationRole: undefined,
      getToken,
      signOut,
      has,
    }
  }

  if (!authState.isSignedIn) {
    return {
      isLoaded: true as const,
      isSignedIn: false as const,
      accountId: null,
      sessionId: null,
      organizationId: null,
      organizationRole: null,
      getToken,
      signOut,
      has,
    }
  }

  return {
    isLoaded: true as const,
    isSignedIn: true as const,
    accountId: authState.accountId,
    sessionId: authState.sessionId,
    organizationId: authState.organizationId,
    organizationRole: authState.organizationRole,
    getToken,
    signOut,
    has,
  }
}
