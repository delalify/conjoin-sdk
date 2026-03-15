import * as Avatar from '@radix-ui/react-avatar'
import * as Label from '@radix-ui/react-label'
import * as Separator from '@radix-ui/react-separator'
import * as Tabs from '@radix-ui/react-tabs'
import { type FormEvent, useCallback, useState } from 'react'
import { useConjoinClient } from '../../hooks/internal/use-conjoin-client'
import { type ConjoinAccount, useAccount } from '../../hooks/use-account'
import { useSession } from '../../hooks/use-session'

function ProfileTab({ account }: { account: ConjoinAccount }) {
  const { sdkConfig } = useConjoinClient()
  const authDomain = sdkConfig?.auth.domain
  const [firstName, setFirstName] = useState(account.first_name ?? '')
  const [lastName, setLastName] = useState(account.last_name ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!authDomain) return

      setIsSaving(true)
      setMessage(null)

      try {
        const response = await fetch(`https://${authDomain}/v1/auth/self`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name: firstName, last_name: lastName }),
        })

        setMessage(response.ok ? 'Profile updated' : 'Update failed')
      } catch {
        setMessage('Update failed')
      } finally {
        setIsSaving(false)
      }
    },
    [authDomain, firstName, lastName],
  )

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Avatar.Root data-conjoin-avatar="" data-size="lg">
          {account.avatar_url && <Avatar.Image src={account.avatar_url} alt="" />}
          <Avatar.Fallback>{(account.first_name?.[0] ?? account.email[0]).toUpperCase()}</Avatar.Fallback>
        </Avatar.Root>
        <div>
          <p style={{ fontWeight: 500 }}>
            {[account.first_name, account.last_name].filter(Boolean).join(' ') || 'Your profile'}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--conjoin-subtle-text)' }}>{account.email}</p>
        </div>
      </div>

      <Separator.Root data-conjoin-separator="" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <Label.Root data-conjoin-label="" htmlFor="conjoin-profile-first">
            First name
          </Label.Root>
          <input
            id="conjoin-profile-first"
            data-conjoin-input=""
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <Label.Root data-conjoin-label="" htmlFor="conjoin-profile-last">
            Last name
          </Label.Root>
          <input
            id="conjoin-profile-last"
            data-conjoin-input=""
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
        </div>
      </div>

      {message && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--conjoin-success)', marginBottom: '0.5rem' }}>{message}</p>
      )}

      <button type="submit" data-conjoin-button="" data-variant="primary" disabled={isSaving}>
        {isSaving ? <span data-conjoin-spinner="" data-size="sm" /> : 'Save'}
      </button>
    </form>
  )
}

function SecurityTab() {
  const { sdkConfig } = useConjoinClient()
  const authDomain = sdkConfig?.auth.domain
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleChangePassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!authDomain) return

      setIsSaving(true)
      setMessage(null)

      try {
        const response = await fetch(`https://${authDomain}/v1/auth/self/password`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        })

        if (response.ok) {
          setMessage('Password updated')
          setCurrentPassword('')
          setNewPassword('')
        } else {
          const body = (await response.json().catch(() => ({}))) as { message?: string }
          setMessage(body.message ?? 'Password change failed')
        }
      } catch {
        setMessage('Password change failed')
      } finally {
        setIsSaving(false)
      }
    },
    [authDomain, currentPassword, newPassword],
  )

  return (
    <form onSubmit={handleChangePassword}>
      <h3 data-conjoin-heading="" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
        Change password
      </h3>

      <div style={{ marginBottom: '0.75rem' }}>
        <Label.Root data-conjoin-label="" htmlFor="conjoin-security-current">
          Current password
        </Label.Root>
        <input
          id="conjoin-security-current"
          data-conjoin-input=""
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <Label.Root data-conjoin-label="" htmlFor="conjoin-security-new">
          New password
        </Label.Root>
        <input
          id="conjoin-security-new"
          data-conjoin-input=""
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
      </div>

      {message && (
        <p style={{ fontSize: '0.8125rem', marginBottom: '0.5rem', color: 'var(--conjoin-subtle-text)' }}>{message}</p>
      )}

      <button type="submit" data-conjoin-button="" data-variant="primary" disabled={isSaving}>
        {isSaving ? <span data-conjoin-spinner="" data-size="sm" /> : 'Update password'}
      </button>
    </form>
  )
}

function SessionsTab() {
  const { session } = useSession()

  return (
    <div>
      <h3 data-conjoin-heading="" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
        Active sessions
      </h3>

      {session && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            border: 'var(--conjoin-border-width) solid var(--conjoin-border)',
            borderRadius: 'var(--conjoin-radius-md)',
          }}
        >
          <div>
            <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>Current session</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--conjoin-subtle-text)' }}>
              {session.client_info?.device_type ?? 'Unknown device'}
              {session.client_info?.city ? ` - ${session.client_info.city}` : ''}
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--conjoin-success)' }}>Active</span>
        </div>
      )}
    </div>
  )
}

export function AccountProfile() {
  const { account } = useAccount()

  if (!account) {
    return (
      <div data-conjoin-card="">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <span data-conjoin-spinner="" data-size="md" />
        </div>
      </div>
    )
  }

  return (
    <div data-conjoin-card="" style={{ maxWidth: '640px' }}>
      <Tabs.Root defaultValue="profile">
        <Tabs.List data-conjoin-tabs-list="">
          <Tabs.Trigger data-conjoin-tabs-trigger="" value="profile">
            Profile
          </Tabs.Trigger>
          <Tabs.Trigger data-conjoin-tabs-trigger="" value="security">
            Security
          </Tabs.Trigger>
          <Tabs.Trigger data-conjoin-tabs-trigger="" value="sessions">
            Sessions
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content data-conjoin-tabs-content="" value="profile">
          <ProfileTab account={account} />
        </Tabs.Content>

        <Tabs.Content data-conjoin-tabs-content="" value="security">
          <SecurityTab />
        </Tabs.Content>

        <Tabs.Content data-conjoin-tabs-content="" value="sessions">
          <SessionsTab />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
