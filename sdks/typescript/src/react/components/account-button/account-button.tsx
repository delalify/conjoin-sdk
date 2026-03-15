import * as Avatar from '@radix-ui/react-avatar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Separator from '@radix-ui/react-separator'
import { useCallback } from 'react'
import { useAccount } from '../../hooks/use-account'
import { useAuth } from '../../hooks/use-auth'

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

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          data-conjoin-avatar=""
          data-size="md"
          aria-label="Account menu"
          style={{ cursor: 'pointer', border: 'none' }}
        >
          <Avatar.Root data-conjoin-avatar="" data-size="md">
            {account?.avatar_url && <Avatar.Image src={account.avatar_url} alt={displayName} />}
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar.Root>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content data-conjoin-menu-content="" sideOffset={8} align="end">
          <div style={{ padding: '0.5rem 0.75rem' }}>
            <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{displayName}</p>
            {email && displayName !== email && (
              <p style={{ fontSize: '0.75rem', color: 'var(--conjoin-subtle-text)', marginTop: '0.125rem' }}>{email}</p>
            )}
          </div>

          <Separator.Root data-conjoin-menu-separator="" />

          {onManageAccount && (
            <DropdownMenu.Item data-conjoin-menu-item="" onSelect={onManageAccount}>
              Manage account
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Item data-conjoin-menu-item="" onSelect={handleSignOut}>
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
