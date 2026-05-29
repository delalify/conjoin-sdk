import { useContext } from 'react'
import { ConjoinAuthContext } from '../provider/contexts'

export function useAuth() {
  const context = useContext(ConjoinAuthContext)
  if (!context) {
    throw new Error('useAuth must be used within a ConjoinProvider')
  }

  const { authState, getToken, signOut, has } = context

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
