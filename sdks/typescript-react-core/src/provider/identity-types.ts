export type ConjoinAccount = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ConjoinOrganization = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
}

export type ConjoinMembership = {
  organization: ConjoinOrganization
  roles: string[]
  status: string
  joined_at: string | null
}

export type IdentityHydration = {
  account: ConjoinAccount | null
  memberships: ConjoinMembership[]
  activeOrganizationId: string | null
  isAccountLoading: boolean
  areOrganizationsLoading: boolean
  setActiveOrganization: (organizationId: string | null) => Promise<void>
}
