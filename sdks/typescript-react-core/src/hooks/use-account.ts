import { useCallback, useContext } from 'react'
import { ConjoinAuthContext } from '../provider/contexts'
import { useAuthState } from './internal/use-auth-state'
import { useConjoinClient } from './internal/use-conjoin-client'
import { useConjoinQuery } from './internal/use-conjoin-query'

export type ConjoinAccount = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export function useAccount() {
  const { sdkConfig } = useConjoinClient()
  const authContext = useContext(ConjoinAuthContext)
  const authState = useAuthState()
  const isSignedIn = authState.isLoaded && authState.isSignedIn
  const authDomain = sdkConfig?.auth.domain

  const queryFn = useCallback(async (): Promise<ConjoinAccount> => {
    if (!authDomain) throw new Error('Auth domain not configured')
    const token = authContext?.getToken()
    const response = await fetch(`https://${authDomain}/v1/auth/self`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch account')
    const body = (await response.json()) as { data: ConjoinAccount }
    return body.data
  }, [authDomain, authContext])

  const result = useConjoinQuery<ConjoinAccount>({
    queryKey: ['conjoin', 'auth', 'account'],
    queryFn,
    enabled: isSignedIn && !!authDomain,
  })

  if (!authState.isLoaded) {
    return { isLoaded: false as const, isSignedIn: undefined, account: undefined }
  }

  if (!isSignedIn) {
    return { isLoaded: true as const, isSignedIn: false as const, account: null }
  }

  return {
    isLoaded: !result.isLoading,
    isSignedIn: true as const,
    account: result.data ?? null,
  }
}
