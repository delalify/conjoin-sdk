import * as Avatar from '@radix-ui/react-avatar'
import * as Popover from '@radix-ui/react-popover'
import * as Separator from '@radix-ui/react-separator'
import { useCallback, useEffect, useState } from 'react'
import { useConjoinClient } from '../../hooks/internal/use-conjoin-client'
import { useAuth } from '../../hooks/use-auth'
import { type ConjoinOrganization, useOrg } from '../../hooks/use-org'

type OrgSwitcherProps = {
  onOrgChange?: (orgId: string) => void
}

export function OrgSwitcher({ onOrgChange }: OrgSwitcherProps) {
  const { sdkConfig } = useConjoinClient()
  const { organization } = useOrg()
  const auth = useAuth()
  const authDomain = sdkConfig?.auth.domain

  const [organizations, setOrganizations] = useState<ConjoinOrganization[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!authDomain || !auth.isLoaded || !auth.isSignedIn) return

    fetch(`https://${authDomain}/v1/auth/self/organizations`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.getToken()}`,
      },
    })
      .then(r => r.json())
      .then(body => {
        const data = (body as { data: ConjoinOrganization[] }).data
        setOrganizations(data)
      })
      .catch(() => {})
  }, [authDomain, auth.isLoaded, auth.isSignedIn, auth.getToken])

  const handleSwitch = useCallback(
    async (orgId: string) => {
      if (!authDomain) return

      try {
        await fetch(`https://${authDomain}/v1/auth/self/organization`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organization_id: orgId }),
        })
        onOrgChange?.(orgId)
        setIsOpen(false)
      } catch {
        // Switch is best-effort
      }
    },
    [authDomain, onOrgChange],
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

          {organizations.map(org => (
            <button
              key={org.id}
              type="button"
              data-conjoin-menu-item=""
              onClick={() => handleSwitch(org.id)}
              style={{
                background: org.id === organization?.id ? 'var(--conjoin-subtle)' : 'transparent',
              }}
            >
              <Avatar.Root data-conjoin-avatar="" data-size="sm">
                {org.logo_url && <Avatar.Image src={org.logo_url} alt="" />}
                <Avatar.Fallback>{org.name[0]?.toUpperCase() ?? 'O'}</Avatar.Fallback>
              </Avatar.Root>
              <span>{org.name}</span>
            </button>
          ))}

          {organizations.length === 0 && (
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
