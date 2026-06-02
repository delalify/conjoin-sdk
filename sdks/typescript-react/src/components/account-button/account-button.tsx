import { useAccount, useAuth } from '@conjoin-cloud/react-core'
import * as Avatar from '@radix-ui/react-avatar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Separator from '@radix-ui/react-separator'
import { useCallback } from 'react'

type AccountButtonProps = {
  onManageAccount?: () => void
  onSignOut?: () => void
}

function getInitials(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  if (firstName) return firstName[0].toUpperCase()
  return email[0].toUpperCase()
}

export function AccountButton({ onManageAccount, onSignOut }: AccountButtonProps) {
  const auth = useAuth()
  const { account } = useAccount()

  const handleSignOut = useCallback(async () => {
    await auth.signOut()
    onSignOut?.()
  }, [auth, onSignOut])

  if (!auth.isLoaded || !auth.isSignedIn) return null

  const displayName = account ? [account.first_name, account.last_name].filter(Boolean).join(' ') || account.email : ''
  const email = account?.email ?? ''
  const initials = account ? getInitials(account.first_name, account.last_name, account.email) : ''
  const showEmail = email !== '' && displayName !== email

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" data-conjoin-trigger="" aria-label="Account menu">
          <Avatar.Root data-conjoin-avatar="" data-size="md">
            {account?.avatar_url ? <Avatar.Image src={account.avatar_url} alt={displayName} /> : null}
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar.Root>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content data-conjoin-menu-content="" sideOffset={8} align="end">
          <div data-conjoin-menu-header="">
            <p data-conjoin-menu-name="">{displayName}</p>
            {showEmail ? <p data-conjoin-menu-email="">{email}</p> : null}
          </div>

          <Separator.Root data-conjoin-menu-separator="" />

          {onManageAccount ? (
            <DropdownMenu.Item data-conjoin-menu-item="" onSelect={onManageAccount}>
              Manage account
            </DropdownMenu.Item>
          ) : null}

          <DropdownMenu.Item data-conjoin-menu-item="" onSelect={handleSignOut}>
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
