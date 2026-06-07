import { useCallback } from 'react'
import { useAuthState } from './internal/use-auth-state'
import { useConjoinClient } from './internal/use-conjoin-client'
import { useConjoinQuery } from './internal/use-conjoin-query'

export type ConjoinSession = {
  id: string
  status: string
  expires_at: string | null
  last_activity: {
    ip: string | null
    initiated_at: string | null
    country_code: string | null
  } | null
  created_at: string | null
}

const VALID_DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i

type RawLastActivity = {
  ip?: unknown
  initiated_at?: unknown
  country_code?: unknown
}

type RawSession = {
  session_id?: unknown
  status?: unknown
  expires_at?: unknown
  last_activity?: RawLastActivity
  date_created?: unknown
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function normalizeSession(raw: RawSession): ConjoinSession | null {
  if (typeof raw.session_id !== 'string') return null
  const activity = raw.last_activity
  return {
    id: raw.session_id,
    status: typeof raw.status === 'string' ? raw.status : '',
    expires_at: toStringOrNull(raw.expires_at),
    last_activity: activity
      ? {
          ip: toStringOrNull(activity.ip),
          initiated_at: toStringOrNull(activity.initiated_at),
          country_code: toStringOrNull(activity.country_code),
        }
      : null,
    created_at: toStringOrNull(raw.date_created),
  }
}

export function useSession() {
  const { sdkConfig } = useConjoinClient()
  const authState = useAuthState()
  const isSignedIn = authState.isLoaded && authState.isSignedIn
  const authDomain = sdkConfig?.auth.domain ?? null
  const isEnabled = isSignedIn && Boolean(authDomain)

  const queryFn = useCallback(async (): Promise<RawSession[]> => {
    if (!authDomain || !VALID_DOMAIN_PATTERN.test(authDomain)) {
      throw new Error('Auth domain not configured')
    }
    const response = await fetch(`https://${authDomain}/v1/auth/self/sessions`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error('Failed to fetch sessions')
    const body = (await response.json()) as { data: RawSession[] }
    return body.data
  }, [authDomain])

  const result = useConjoinQuery<RawSession[]>({
    queryKey: ['conjoin', 'auth', 'sessions'],
    queryFn,
    enabled: isEnabled,
  })

  if (!authState.isLoaded) {
    return { isLoaded: false as const, isSignedIn: undefined, sessions: undefined }
  }

  if (!isSignedIn) {
    return { isLoaded: true as const, isSignedIn: false as const, sessions: [] as ConjoinSession[] }
  }

  const sessions = Array.isArray(result.data)
    ? result.data.map(normalizeSession).filter((session): session is ConjoinSession => session !== null)
    : []

  return {
    isLoaded: !result.isLoading,
    isSignedIn: true as const,
    sessions,
  }
}
