import { useCallback, useContext } from 'react'
import { ConjoinAuthContext } from '../provider/contexts'
import { useAuthState } from './internal/use-auth-state'
import { useConjoinClient } from './internal/use-conjoin-client'
import { useConjoinQuery } from './internal/use-conjoin-query'

export type ConjoinSession = {
  id: string
  account_id: string
  status: string
  last_active_at: string
  expires_at: string
  created_at: string
  client_info: {
    ip_address: string | null
    user_agent: string | null
    device_type: string | null
    city: string | null
    country: string | null
  } | null
}

export function useSession() {
  const { sdkConfig } = useConjoinClient()
  const authContext = useContext(ConjoinAuthContext)
  const authState = useAuthState()
  const isSignedIn = authState.isLoaded && authState.isSignedIn
  const sessionId = isSignedIn ? authState.sessionId : null
  const authDomain = sdkConfig?.auth.domain

  const queryFn = useCallback(async (): Promise<ConjoinSession> => {
    if (!authDomain || !sessionId) throw new Error('Session not available')
    const token = authContext?.getToken()
    const response = await fetch(`https://${authDomain}/v1/auth/self/sessions/${sessionId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch session')
    const body = (await response.json()) as { data: ConjoinSession }
    return body.data
  }, [authDomain, sessionId, authContext])

  const result = useConjoinQuery<ConjoinSession>({
    queryKey: ['conjoin', 'auth', 'session', sessionId],
    queryFn,
    enabled: isSignedIn && !!sessionId && !!authDomain,
  })

  if (!authState.isLoaded) {
    return { isLoaded: false as const, isSignedIn: undefined, session: undefined }
  }

  if (!isSignedIn) {
    return { isLoaded: true as const, isSignedIn: false as const, session: null }
  }

  return {
    isLoaded: !result.isLoading,
    isSignedIn: true as const,
    session: result.data ?? null,
  }
}
