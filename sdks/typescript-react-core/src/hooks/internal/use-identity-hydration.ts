import { useCallback, useEffect, useMemo, useRef } from 'react'
import type {
  ConjoinAccount,
  ConjoinMembership,
  ConjoinOrganization,
  IdentityHydration,
} from '../../provider/identity-types'
import type { AuthTransport } from '../../provider/types'
import { useConjoinClient } from './use-conjoin-client'
import { useConjoinQuery } from './use-conjoin-query'

const ACCOUNT_QUERY_KEY = ['conjoin', 'auth', 'account'] as const
const ORGANIZATIONS_QUERY_KEY = ['conjoin', 'auth', 'organizations'] as const
const ACTIVE_ORG_QUERY_KEY = ['conjoin', 'auth', 'active-organization'] as const

const VALID_DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i

type RawOrganization = {
  organization_id?: unknown
  name?: unknown
  slug?: unknown
  image_url?: unknown
  date_created?: unknown
}

type RawMembership = {
  organization?: RawOrganization
  roles?: unknown
  status?: unknown
  joined_at?: unknown
}

type RawMembershipGroup = {
  organization_memberships?: RawMembership[]
}

type RawActiveOrganization = {
  active_organization_id?: unknown
  active_organization_roles?: unknown
}

type IdentityHydrationDeps = {
  authDomain: string | null
  isSignedIn: boolean
  /**
   * Stable signature of the current presence (signed-out, or the signed-in
   * client handle). Changing this value resets the active-organization pointer
   * and evicts cached identity, so a sign-out or a switch to a different handle
   * never surfaces the prior account, organizations, or selection.
   */
  presenceKey: string
  attachCsrf: AuthTransport['attachCsrf']
}

function buildAuthUrl(authDomain: string, path: string): string {
  if (!VALID_DOMAIN_PATTERN.test(authDomain)) {
    throw new Error(`Invalid auth domain: ${authDomain}`)
  }
  return `https://${authDomain}${path}`
}

async function fetchCookieJson<TData>(url: string): Promise<TData> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  const body = (await response.json()) as { data: TData }
  return body.data
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function normalizeOrganization(raw: RawOrganization): ConjoinOrganization | null {
  const id = raw.organization_id
  const name = raw.name
  const slug = raw.slug
  if (typeof id !== 'string' || typeof name !== 'string' || typeof slug !== 'string') {
    return null
  }
  return {
    id,
    name,
    slug,
    logo_url: toStringOrNull(raw.image_url),
    created_at: typeof raw.date_created === 'string' ? raw.date_created : '',
  }
}

function normalizeMemberships(groups: RawMembershipGroup[]): ConjoinMembership[] {
  const memberships: ConjoinMembership[] = []
  for (const group of groups) {
    const entries = group.organization_memberships
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      const organization = entry.organization ? normalizeOrganization(entry.organization) : null
      if (!organization) continue
      const roles = Array.isArray(entry.roles)
        ? entry.roles.filter((role): role is string => typeof role === 'string')
        : []
      memberships.push({
        organization,
        roles,
        status: typeof entry.status === 'string' ? entry.status : '',
        joined_at: toStringOrNull(entry.joined_at),
      })
    }
  }
  return memberships
}

export function useIdentityHydration(deps: IdentityHydrationDeps): IdentityHydration {
  const { queryClient } = useConjoinClient()
  const { authDomain, isSignedIn, presenceKey, attachCsrf } = deps
  const isEnabled = isSignedIn && Boolean(authDomain)

  const previousPresenceRef = useRef<string>(presenceKey)
  useEffect(() => {
    if (previousPresenceRef.current === presenceKey) return
    previousPresenceRef.current = presenceKey
    queryClient.removeQueries({ queryKey: ACCOUNT_QUERY_KEY })
    queryClient.removeQueries({ queryKey: ORGANIZATIONS_QUERY_KEY })
    queryClient.removeQueries({ queryKey: ACTIVE_ORG_QUERY_KEY })
  }, [presenceKey, queryClient])

  const accountQueryFn = useCallback(async (): Promise<ConjoinAccount> => {
    if (!authDomain) throw new Error('Auth domain not configured')
    return fetchCookieJson<ConjoinAccount>(buildAuthUrl(authDomain, '/v1/auth/self'))
  }, [authDomain])

  const organizationsQueryFn = useCallback(async (): Promise<RawMembershipGroup[]> => {
    if (!authDomain) throw new Error('Auth domain not configured')
    return fetchCookieJson<RawMembershipGroup[]>(buildAuthUrl(authDomain, '/v1/auth/self/organizations'))
  }, [authDomain])

  const activeOrgQueryFn = useCallback(async (): Promise<RawActiveOrganization> => {
    if (!authDomain) throw new Error('Auth domain not configured')
    return fetchCookieJson<RawActiveOrganization>(buildAuthUrl(authDomain, '/v1/auth/self/active-organization'))
  }, [authDomain])

  const accountResult = useConjoinQuery<ConjoinAccount>({
    queryKey: ACCOUNT_QUERY_KEY,
    queryFn: accountQueryFn,
    enabled: isEnabled,
  })

  const organizationsResult = useConjoinQuery<RawMembershipGroup[]>({
    queryKey: ORGANIZATIONS_QUERY_KEY,
    queryFn: organizationsQueryFn,
    enabled: isEnabled,
  })

  const activeOrgResult = useConjoinQuery<RawActiveOrganization>({
    queryKey: ACTIVE_ORG_QUERY_KEY,
    queryFn: activeOrgQueryFn,
    enabled: isEnabled,
  })

  const memberships = useMemo(
    () => (organizationsResult.data ? normalizeMemberships(organizationsResult.data) : []),
    [organizationsResult.data],
  )

  const activeOrganizationId = useMemo(
    () => toStringOrNull(activeOrgResult.data?.active_organization_id),
    [activeOrgResult.data],
  )

  const setActiveOrganization = useCallback(
    async (organizationId: string | null): Promise<void> => {
      if (!authDomain) throw new Error('Auth domain not configured')

      const response = await fetch(buildAuthUrl(authDomain, '/v1/auth/self/active-organization'), {
        method: 'PUT',
        credentials: 'include',
        headers: attachCsrf({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ organization_id: organizationId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to set active organization (status ${response.status})`)
      }

      await Promise.all([
        queryClient.fetchQuery({ queryKey: ACTIVE_ORG_QUERY_KEY, queryFn: activeOrgQueryFn }),
        queryClient.fetchQuery({ queryKey: ORGANIZATIONS_QUERY_KEY, queryFn: organizationsQueryFn }),
      ])
    },
    [authDomain, attachCsrf, queryClient, activeOrgQueryFn, organizationsQueryFn],
  )

  return {
    account: accountResult.data ?? null,
    memberships,
    activeOrganizationId,
    isAccountLoading: isEnabled && accountResult.isLoading,
    areOrganizationsLoading: isEnabled && (organizationsResult.isLoading || activeOrgResult.isLoading),
    setActiveOrganization,
  }
}
