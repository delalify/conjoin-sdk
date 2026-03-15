import { useCallback, useContext } from 'react'
import { ConjoinAuthContext } from '../../provider/contexts'
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
  const authContext = useContext(ConjoinAuthContext)

  const authDomain = sdkConfig?.auth.domain ?? null

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}): Promise<Response> => {
      if (!authDomain) {
        throw new Error('Auth domain is not configured')
      }
      const validDomain = validateAuthDomain(authDomain)
      const token = authContext?.getToken()

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
    [authDomain, authContext],
  )

  return { authFetch, authDomain, isConfigured: !!authDomain }
}
