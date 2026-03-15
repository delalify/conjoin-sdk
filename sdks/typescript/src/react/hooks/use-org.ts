import { useCallback, useContext } from 'react'
import { ConjoinAuthContext } from '../provider/contexts'
import { useAuthState } from './internal/use-auth-state'
import { useConjoinClient } from './internal/use-conjoin-client'
import { useConjoinQuery } from './internal/use-conjoin-query'

export type ConjoinOrganization = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
}

export type ConjoinMembership = {
  id: string
  organization_id: string
  account_id: string
  role: string
  created_at: string
}

type OrgData = {
  organization: ConjoinOrganization
  membership: ConjoinMembership
}

export function useOrg() {
  const { sdkConfig } = useConjoinClient()
  const authContext = useContext(ConjoinAuthContext)
  const authState = useAuthState()
  const isSignedIn = authState.isLoaded && authState.isSignedIn
  const orgId = isSignedIn ? authState.organizationId : null
  const authDomain = sdkConfig?.auth.domain

  const queryFn = useCallback(async (): Promise<OrgData> => {
    if (!authDomain || !orgId) throw new Error('Organization context not available')
    const token = authContext?.getToken()
    const response = await fetch(`https://${authDomain}/v1/auth/self/organization`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch organization')
    const body = (await response.json()) as { data: OrgData }
    return body.data
  }, [authDomain, orgId, authContext])

  const result = useConjoinQuery<OrgData>({
    queryKey: ['conjoin', 'auth', 'organization', orgId],
    queryFn,
    enabled: isSignedIn && !!orgId && !!authDomain,
  })

  if (!authState.isLoaded) {
    return { isLoaded: false as const, organization: undefined, membership: undefined }
  }

  return {
    isLoaded: !result.isLoading,
    organization: result.data?.organization ?? null,
    membership: result.data?.membership ?? null,
  }
}
