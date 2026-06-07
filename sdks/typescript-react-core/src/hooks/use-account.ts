import type { ConjoinAccount } from '../provider/identity-types'
import { useAuthState } from './internal/use-auth-state'
import { useIdentity } from './internal/use-identity'

export type { ConjoinAccount }

export function useAccount() {
  const authState = useAuthState()
  const identity = useIdentity()
  const isSignedIn = authState.isLoaded && authState.isSignedIn

  if (!authState.isLoaded) {
    return { isLoaded: false as const, isSignedIn: undefined, account: undefined }
  }

  if (!isSignedIn) {
    return { isLoaded: true as const, isSignedIn: false as const, account: null }
  }

  return {
    isLoaded: !identity.isAccountLoading,
    isSignedIn: true as const,
    account: identity.account,
  }
}
