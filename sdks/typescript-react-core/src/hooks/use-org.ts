import type { ConjoinMembership, ConjoinOrganization } from '../provider/identity-types'
import { useAuthState } from './internal/use-auth-state'
import { useIdentity } from './internal/use-identity'

export type { ConjoinMembership, ConjoinOrganization }

export function useOrg() {
  const authState = useAuthState()
  const identity = useIdentity()
  const isSignedIn = authState.isLoaded && authState.isSignedIn

  if (!authState.isLoaded) {
    return {
      isLoaded: false as const,
      isSignedIn: undefined,
      organization: undefined,
      memberships: undefined,
      membership: undefined,
      setActive: identity.setActiveOrganization,
    }
  }

  if (!isSignedIn) {
    return {
      isLoaded: true as const,
      isSignedIn: false as const,
      organization: null,
      memberships: [] as ConjoinMembership[],
      membership: null,
      setActive: identity.setActiveOrganization,
    }
  }

  const activeMembership =
    identity.activeOrganizationId === null
      ? null
      : (identity.memberships.find(entry => entry.organization.id === identity.activeOrganizationId) ?? null)

  return {
    isLoaded: !identity.areOrganizationsLoading,
    isSignedIn: true as const,
    organization: activeMembership?.organization ?? null,
    memberships: identity.memberships,
    membership: activeMembership,
    setActive: identity.setActiveOrganization,
  }
}
