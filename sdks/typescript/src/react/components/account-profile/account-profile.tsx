import * as Avatar from '@radix-ui/react-avatar'
import * as Label from '@radix-ui/react-label'
import * as Separator from '@radix-ui/react-separator'
import * as Tabs from '@radix-ui/react-tabs'
import { type FormEvent, useCallback, useState } from 'react'
import { useAuthFetch } from '../../hooks/internal/use-auth-fetch'
import { type ConjoinAccount, useAccount } from '../../hooks/use-account'
import { useSession } from '../../hooks/use-session'

function ProfileTab({ account }: { account: ConjoinAccount }) {
  const { authFetch } = useAuthFetch()
  const [firstName, setFirstName] = useState(account.first_name ?? '')
  const [lastName, setLastName] = useState(account.last_name ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (isSaving) return

      setIsSaving(true)
      setFeedback(null)

      try {
        const response = await authFetch('/v1/auth/self', {
          method: 'PATCH',
          body: JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim() }),
        })

        if (response.ok) {
          setFeedback({ type: 'success', message: 'Profile updated' })
        } else {
          const body = (await response.json().catch(() => ({}))) as { message?: string }
          setFeedback({ type: 'error', message: body.message ?? 'Failed to update profile' })
        }
      } catch {
        setFeedback({ type: 'error', message: 'A network error occurred' })
      } finally {
        setIsSaving(false)
      }
    },
    [authFetch, firstName, lastName, isSaving],
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
            {[account.first_name, account.last_name].filter(Boolean).join(' ') || account.email}
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
            maxLength={100}
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
            maxLength={100}
          />
        </div>
      </div>

      {feedback && (
        <p
          role={feedback.type === 'error' ? 'alert' : 'status'}
          style={{
            fontSize: '0.8125rem',
            marginBottom: '0.5rem',
            color: feedback.type === 'success' ? 'var(--conjoin-success)' : 'var(--conjoin-danger)',
          }}
        >
          {feedback.message}
        </p>
      )}

      <button type="submit" data-conjoin-button="" data-variant="primary" disabled={isSaving} aria-busy={isSaving}>
        {isSaving ? <span data-conjoin-spinner="" data-size="sm" /> : 'Save'}
      </button>
    </form>
  )
}

function SecurityTab() {
  const { authFetch } = useAuthFetch()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleChangePassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (isSaving) return

      setIsSaving(true)
      setFeedback(null)

      try {
        const response = await authFetch('/v1/auth/self/password', {
          method: 'POST',
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        })

        if (response.ok) {
          setFeedback({ type: 'success', message: 'Password updated' })
          setCurrentPassword('')
          setNewPassword('')
        } else {
          const body = (await response.json().catch(() => ({}))) as { message?: string }
          setFeedback({ type: 'error', message: body.message ?? 'Failed to update password' })
        }
      } catch {
        setFeedback({ type: 'error', message: 'A network error occurred' })
      } finally {
        setIsSaving(false)
      }
    },
    [authFetch, currentPassword, newPassword, isSaving],
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

      {feedback && (
        <p
          role={feedback.type === 'error' ? 'alert' : 'status'}
          style={{
            fontSize: '0.8125rem',
            marginBottom: '0.5rem',
            color: feedback.type === 'success' ? 'var(--conjoin-success)' : 'var(--conjoin-danger)',
          }}
        >
          {feedback.message}
        </p>
      )}

      <button type="submit" data-conjoin-button="" data-variant="primary" disabled={isSaving} aria-busy={isSaving}>
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

      {session ? (
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
              {session.client_info?.city ? ` \u00B7 ${session.client_info.city}` : ''}
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--conjoin-success)', fontWeight: 500 }}>Active</span>
        </div>
      ) : (
        <p style={{ fontSize: '0.8125rem', color: 'var(--conjoin-subtle-text)' }}>Loading session data...</p>
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
        <Tabs.List data-conjoin-tabs-list="" aria-label="Account settings sections">
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
