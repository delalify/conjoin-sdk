import { type ConjoinAccount, useAccount, useAuthFetch, useSession } from '@conjoin-cloud/react-core'
import * as Avatar from '@radix-ui/react-avatar'
import * as Label from '@radix-ui/react-label'
import * as Separator from '@radix-ui/react-separator'
import * as Tabs from '@radix-ui/react-tabs'
import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react'
import { BusyContent } from '../internal/busy-content'
import { Spinner } from '../internal/spinner'

type TabValue = 'profile' | 'security' | 'sessions'

type Feedback = { type: 'success' | 'error'; message: string }

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  return (
    <p data-conjoin-feedback="" data-tone={feedback.type} role={feedback.type === 'error' ? 'alert' : 'status'}>
      {feedback.message}
    </p>
  )
}

function ProfileTab({ account }: { account: ConjoinAccount }) {
  const { authFetch } = useAuthFetch()
  const [firstName, setFirstName] = useState(account.first_name ?? '')
  const [lastName, setLastName] = useState(account.last_name ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const handleFirstNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value)
  }, [])

  const handleLastNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value)
  }, [])

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

  const fullName = [account.first_name, account.last_name].filter(Boolean).join(' ') || account.email
  const fallbackInitial = (account.first_name?.[0] ?? account.email[0]).toUpperCase()

  return (
    <form onSubmit={handleSave}>
      <div data-conjoin-profile-head="">
        <Avatar.Root data-conjoin-avatar="" data-size="lg">
          {account.avatar_url ? <Avatar.Image src={account.avatar_url} alt="" /> : null}
          <Avatar.Fallback>{fallbackInitial}</Avatar.Fallback>
        </Avatar.Root>
        <div>
          <p data-conjoin-profile-name="">{fullName}</p>
          <p data-conjoin-profile-email="">{account.email}</p>
        </div>
      </div>

      <Separator.Root data-conjoin-separator="" />

      <div data-conjoin-field-row="">
        <div>
          <Label.Root data-conjoin-label="" htmlFor="conjoin-profile-first">
            First name
          </Label.Root>
          <input
            id="conjoin-profile-first"
            data-conjoin-input=""
            value={firstName}
            onChange={handleFirstNameChange}
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
            onChange={handleLastNameChange}
            maxLength={100}
          />
        </div>
      </div>

      {feedback ? <FeedbackMessage feedback={feedback} /> : null}

      <button type="submit" data-conjoin-button="" data-variant="primary" disabled={isSaving} aria-busy={isSaving}>
        <BusyContent busy={isSaving} label="Save" busyLabel="Saving" />
      </button>
    </form>
  )
}

function SecurityTab() {
  const { authFetch } = useAuthFetch()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const handleCurrentChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value)
  }, [])

  const handleNewChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value)
  }, [])

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
      <h3 data-conjoin-heading="" data-level="section">
        Change password
      </h3>

      <div data-conjoin-field="">
        <Label.Root data-conjoin-label="" htmlFor="conjoin-security-current">
          Current password
        </Label.Root>
        <input
          id="conjoin-security-current"
          data-conjoin-input=""
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={handleCurrentChange}
          required
        />
      </div>

      <div data-conjoin-field="">
        <Label.Root data-conjoin-label="" htmlFor="conjoin-security-new">
          New password
        </Label.Root>
        <input
          id="conjoin-security-new"
          data-conjoin-input=""
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={handleNewChange}
          required
        />
      </div>

      {feedback ? <FeedbackMessage feedback={feedback} /> : null}

      <button type="submit" data-conjoin-button="" data-variant="primary" disabled={isSaving} aria-busy={isSaving}>
        <BusyContent busy={isSaving} label="Update password" busyLabel="Updating password" />
      </button>
    </form>
  )
}

function SessionsTab() {
  const { isLoaded, sessions } = useSession()
  const activeSessions = sessions ?? []

  return (
    <div>
      <h3 data-conjoin-heading="" data-level="section">
        Active sessions
      </h3>

      {!isLoaded ? <p data-conjoin-muted="">Loading session data...</p> : null}

      {isLoaded && activeSessions.length === 0 ? <p data-conjoin-muted="">No active sessions</p> : null}

      {isLoaded
        ? activeSessions.map(session => (
            <div key={session.id} data-conjoin-session-row="">
              <div>
                <p data-conjoin-session-title="">{session.last_activity?.country_code ?? 'Unknown location'}</p>
                <p data-conjoin-session-meta="">{session.last_activity?.ip ?? 'IP unavailable'}</p>
              </div>
              <span data-conjoin-session-status="">{session.status || 'active'}</span>
            </div>
          ))
        : null}
    </div>
  )
}

export function AccountProfile() {
  const { account } = useAccount()
  const [activeTab, setActiveTab] = useState<TabValue>('profile')

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue)
  }, [])

  if (!account) {
    return (
      <div data-conjoin-card="">
        <div data-conjoin-state="">
          <Spinner size="md" label="Loading account" />
        </div>
      </div>
    )
  }

  return (
    <div data-conjoin-card="">
      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
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

        <Tabs.Content data-conjoin-tabs-content="" value="profile" forceMount hidden={activeTab !== 'profile'}>
          {activeTab === 'profile' ? <ProfileTab account={account} /> : null}
        </Tabs.Content>

        <Tabs.Content data-conjoin-tabs-content="" value="security" forceMount hidden={activeTab !== 'security'}>
          {activeTab === 'security' ? <SecurityTab /> : null}
        </Tabs.Content>

        <Tabs.Content data-conjoin-tabs-content="" value="sessions" forceMount hidden={activeTab !== 'sessions'}>
          {activeTab === 'sessions' ? <SessionsTab /> : null}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
