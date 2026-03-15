import * as Avatar from '@radix-ui/react-avatar'
import * as Popover from '@radix-ui/react-popover'
import * as Separator from '@radix-ui/react-separator'
import { useCallback, useEffect, useState } from 'react'
import { useAuthFetch } from '../../hooks/internal/use-auth-fetch'
import { useAuth } from '../../hooks/use-auth'
import { type ConjoinOrganization, useOrg } from '../../hooks/use-org'

type OrgSwitcherProps = {
  onOrgChange?: (orgId: string) => void
}

export function OrgSwitcher({ onOrgChange }: OrgSwitcherProps) {
  const { authFetch, isConfigured } = useAuthFetch()
  const { organization } = useOrg()
  const auth = useAuth()

  const [organizations, setOrganizations] = useState<ConjoinOrganization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isConfigured || !auth.isLoaded || !auth.isSignedIn) return

    setIsLoading(true)
    authFetch('/v1/auth/self/organizations')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch organizations')
        return r.json()
      })
      .then(body => {
        setOrganizations((body as { data: ConjoinOrganization[] }).data)
      })
      .catch(() => {
        setOrganizations([])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [isConfigured, auth.isLoaded, auth.isSignedIn, authFetch])

  const handleSwitch = useCallback(
    async (orgId: string) => {
      setIsSwitching(true)
      try {
        const response = await authFetch('/v1/auth/self/organization', {
          method: 'PUT',
          body: JSON.stringify({ organization_id: orgId }),
        })
        if (response.ok) {
          onOrgChange?.(orgId)
          setIsOpen(false)
        }
      } catch {
        // Switch failure; popover stays open so user can retry
      } finally {
        setIsSwitching(false)
      }
    },
    [authFetch, onOrgChange],
  )

  if (!auth.isLoaded || !auth.isSignedIn) return null

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          data-conjoin-button=""
          data-variant="outline"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          aria-label={`Current organization: ${organization?.name ?? 'None selected'}`}
        >
          <Avatar.Root data-conjoin-avatar="" data-size="sm">
            {organization?.logo_url && <Avatar.Image src={organization.logo_url} alt="" />}
            <Avatar.Fallback>{organization?.name?.[0]?.toUpperCase() ?? 'O'}</Avatar.Fallback>
          </Avatar.Root>
          <span>{organization?.name ?? 'Select organization'}</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content data-conjoin-menu-content="" sideOffset={8} align="start">
          <div
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              color: 'var(--conjoin-subtle-text)',
              fontWeight: 500,
            }}
          >
            Organizations
          </div>

          <Separator.Root data-conjoin-menu-separator="" />

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem' }}>
              <span data-conjoin-spinner="" data-size="sm" />
            </div>
          )}

          {!isLoading &&
            organizations.map(org => (
              <button
                key={org.id}
                type="button"
                data-conjoin-menu-item=""
                onClick={() => handleSwitch(org.id)}
                disabled={isSwitching}
                style={{
                  background: org.id === organization?.id ? 'var(--conjoin-subtle)' : 'transparent',
                }}
                aria-current={org.id === organization?.id ? 'true' : undefined}
              >
                <Avatar.Root data-conjoin-avatar="" data-size="sm">
                  {org.logo_url && <Avatar.Image src={org.logo_url} alt="" />}
                  <Avatar.Fallback>{org.name[0]?.toUpperCase() ?? 'O'}</Avatar.Fallback>
                </Avatar.Root>
                <span>{org.name}</span>
              </button>
            ))}

          {!isLoading && organizations.length === 0 && (
            <p
              style={{
                padding: '0.5rem',
                fontSize: '0.8125rem',
                color: 'var(--conjoin-subtle-text)',
                textAlign: 'center',
              }}
            >
              No organizations
            </p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
