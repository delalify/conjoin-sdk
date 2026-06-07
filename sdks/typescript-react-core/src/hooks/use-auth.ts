import { useCallback } from 'react'
import { useAuthActions } from './internal/use-auth-actions'
import { useAuthState } from './internal/use-auth-state'
import { useIdentity } from './internal/use-identity'

type HasParams = { role?: string; permission?: string }

export function useAuth() {
  const authState = useAuthState()
  const identity = useIdentity()
  const { signOut } = useAuthActions()

  const isSignedIn = authState.isLoaded && authState.isSignedIn
  const activeOrganizationId = identity.activeOrganizationId
  const activeMembership =
    activeOrganizationId === null
      ? null
      : (identity.memberships.find(entry => entry.organization.id === activeOrganizationId) ?? null)
  const activeRolesKey = activeMembership ? activeMembership.roles.join(',') : ''

  const has = useCallback(
    (params: HasParams): boolean => {
      if (!isSignedIn) return false
      if (typeof params.permission === 'string') return false
      if (typeof params.role === 'string') {
        return activeRolesKey.length > 0 && activeRolesKey.split(',').includes(params.role)
      }
      return true
    },
    [isSignedIn, activeRolesKey],
  )

  if (!authState.isLoaded) {
    return {
      isLoaded: false as const,
      isSignedIn: undefined,
      clientId: undefined,
      referenceId: undefined,
      accountId: undefined,
      organizationId: undefined,
      organizationRoles: undefined,
      signOut,
      has,
    }
  }

  if (!authState.isSignedIn) {
    return {
      isLoaded: true as const,
      isSignedIn: false as const,
      clientId: null,
      referenceId: null,
      accountId: null,
      organizationId: null,
      organizationRoles: [] as string[],
      signOut,
      has,
    }
  }

  return {
    isLoaded: true as const,
    isSignedIn: true as const,
    clientId: authState.clientId,
    referenceId: authState.referenceId,
    accountId: identity.account?.id ?? null,
    organizationId: activeOrganizationId,
    organizationRoles: activeMembership?.roles ?? [],
    signOut,
    has,
  }
}
