import { type ConjoinOrganization, useAuth, useAuthFetch, useOrg } from '@conjoin-cloud/react-core'
import * as Avatar from '@radix-ui/react-avatar'
import * as Popover from '@radix-ui/react-popover'
import * as Separator from '@radix-ui/react-separator'
import { memo, useCallback, useEffect, useState } from 'react'
import { Spinner } from '../internal/spinner'

type OrgSwitcherProps = {
  onOrgChange?: (orgId: string) => void
}

type OrgRowProps = {
  org: ConjoinOrganization
  isActive: boolean
  isSwitching: boolean
  onSwitch: (orgId: string) => void
}

const OrgRow = memo(function OrgRow({ org, isActive, isSwitching, onSwitch }: OrgRowProps) {
  const handleClick = useCallback(() => onSwitch(org.id), [onSwitch, org.id])

  return (
    <button
      type="button"
      data-conjoin-menu-item=""
      data-active={isActive ? 'true' : undefined}
      onClick={handleClick}
      disabled={isSwitching}
      aria-current={isActive ? 'true' : undefined}
    >
      <Avatar.Root data-conjoin-avatar="" data-size="sm">
        {org.logo_url ? <Avatar.Image src={org.logo_url} alt="" /> : null}
        <Avatar.Fallback>{org.name[0]?.toUpperCase() ?? 'O'}</Avatar.Fallback>
      </Avatar.Root>
      <span>{org.name}</span>
    </button>
  )
})

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

    const controller = new AbortController()
    setIsLoading(true)
    authFetch('/v1/auth/self/organizations', { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch organizations')
        return r.json()
      })
      .then(body => {
        setOrganizations((body as { data: ConjoinOrganization[] }).data)
      })
      .catch(() => {
        if (!controller.signal.aborted) setOrganizations([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
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
        // Switch failure leaves the popover open so the user can retry.
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
          data-conjoin-org-trigger=""
          aria-label={`Current organization: ${organization?.name ?? 'None selected'}`}
        >
          <Avatar.Root data-conjoin-avatar="" data-size="sm">
            {organization?.logo_url ? <Avatar.Image src={organization.logo_url} alt="" /> : null}
            <Avatar.Fallback>{organization?.name?.[0]?.toUpperCase() ?? 'O'}</Avatar.Fallback>
          </Avatar.Root>
          <span>{organization?.name ?? 'Select organization'}</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content data-conjoin-menu-content="" sideOffset={8} align="start">
          <div data-conjoin-menu-label="">Organizations</div>

          <Separator.Root data-conjoin-menu-separator="" />

          {isLoading ? (
            <div data-conjoin-state="">
              <Spinner size="sm" label="Loading organizations" />
            </div>
          ) : null}

          {!isLoading
            ? organizations.map(org => (
                <OrgRow
                  key={org.id}
                  org={org}
                  isActive={org.id === organization?.id}
                  isSwitching={isSwitching}
                  onSwitch={handleSwitch}
                />
              ))
            : null}

          {!isLoading && organizations.length === 0 ? (
            <p data-conjoin-center="" data-conjoin-menu-label="">
              No organizations
            </p>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
