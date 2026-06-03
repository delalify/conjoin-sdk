import { useCallback } from 'react'
import { useAuthActions } from './use-auth-actions'
import { useConjoinClient } from './use-conjoin-client'

const VALID_DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i

function validateAuthDomain(domain: string): string {
  if (!VALID_DOMAIN_PATTERN.test(domain)) {
    throw new Error(`Invalid auth domain: ${domain}`)
  }
  return domain
}

export function useAuthFetch() {
  const { sdkConfig } = useConjoinClient()
  const { getToken } = useAuthActions()

  const authDomain = sdkConfig?.auth.domain ?? null

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}): Promise<Response> => {
      if (!authDomain) {
        throw new Error('Auth domain is not configured')
      }
      const validDomain = validateAuthDomain(authDomain)
      const token = getToken()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
      }

      return fetch(`https://${validDomain}${path}`, {
        ...options,
        credentials: 'include',
        headers,
      })
    },
    [authDomain, getToken],
  )

  return { authFetch, authDomain, isConfigured: !!authDomain }
}
