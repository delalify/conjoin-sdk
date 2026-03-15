import * as Label from '@radix-ui/react-label'
import { type FormEvent, useCallback, useState } from 'react'
import { useAuthFetch } from '../../hooks/internal/use-auth-fetch'
import { useConjoinClient } from '../../hooks/internal/use-conjoin-client'

type SignUpProps = {
  afterSignUpUrl?: string
  signInUrl?: string
  onSignUp?: () => void
}

export function SignUp({ afterSignUpUrl, signInUrl, onSignUp }: SignUpProps) {
  const { sdkConfig } = useConjoinClient()
  const { authFetch, authDomain, isConfigured } = useAuthFetch()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const signUpEnabled = sdkConfig?.auth.sign_up_enabled !== false
  const oauthMethods = (sdkConfig?.auth.sign_in_methods ?? []).filter(m => m !== 'email_password' && m !== 'email_otp')

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (isSubmitting) return

      setIsSubmitting(true)
      setError(null)
      setFieldErrors({})

      try {
        const response = await authFetch('/v1/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
            first_name: firstName.trim() || undefined,
            last_name: lastName.trim() || undefined,
          }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            message?: string
            errors?: Array<{ path: string; message: string }>
          }

          if (body.errors?.length) {
            const mapped: Record<string, string> = {}
            for (const err of body.errors) {
              mapped[err.path] = err.message
            }
            setFieldErrors(mapped)
          }

          setError(body.message ?? 'Unable to create account. Please try again.')
          return
        }

        if (afterSignUpUrl) {
          window.location.href = afterSignUpUrl
        }
        onSignUp?.()
      } catch {
        setError('A network error occurred. Please check your connection and try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [authFetch, email, password, firstName, lastName, afterSignUpUrl, onSignUp, isSubmitting],
  )

  const handleOAuthClick = useCallback(
    (provider: string) => {
      if (!authDomain) return
      window.location.href = `https://${authDomain}/v1/auth/oauth/${encodeURIComponent(provider)}/start`
    },
    [authDomain],
  )

  if (!isConfigured) {
    return (
      <div data-conjoin-card="">
        <p data-conjoin-heading="" style={{ textAlign: 'center' }}>
          Sign up is not available
        </p>
      </div>
    )
  }

  if (!signUpEnabled) {
    return (
      <div data-conjoin-card="">
        <p data-conjoin-heading="" style={{ textAlign: 'center' }}>
          Sign up is not available
        </p>
      </div>
    )
  }

  return (
    <div data-conjoin-card="">
      <h2 data-conjoin-heading="" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        Create your account
      </h2>

      {oauthMethods.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {oauthMethods.map(method => (
            <button key={method} type="button" data-conjoin-social-button="" onClick={() => handleOAuthClick(method)}>
              Continue with {method.charAt(0).toUpperCase() + method.slice(1)}
            </button>
          ))}
          <div data-conjoin-divider-text="">or</div>
        </div>
      )}

      {error && !Object.keys(fieldErrors).length && (
        <p data-conjoin-field-error="" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-up-first-name">
              First name
            </Label.Root>
            <input
              id="conjoin-sign-up-first-name"
              data-conjoin-input=""
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              maxLength={100}
              aria-invalid={!!fieldErrors.first_name}
              aria-describedby={fieldErrors.first_name ? 'conjoin-err-first-name' : undefined}
            />
            {fieldErrors.first_name && (
              <p id="conjoin-err-first-name" data-conjoin-field-error="">
                {fieldErrors.first_name}
              </p>
            )}
          </div>
          <div>
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-up-last-name">
              Last name
            </Label.Root>
            <input
              id="conjoin-sign-up-last-name"
              data-conjoin-input=""
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              maxLength={100}
              aria-invalid={!!fieldErrors.last_name}
              aria-describedby={fieldErrors.last_name ? 'conjoin-err-last-name' : undefined}
            />
            {fieldErrors.last_name && (
              <p id="conjoin-err-last-name" data-conjoin-field-error="">
                {fieldErrors.last_name}
              </p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-up-email">
            Email address
          </Label.Root>
          <input
            id="conjoin-sign-up-email"
            data-conjoin-input=""
            data-error={fieldErrors.email ? 'true' : undefined}
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            maxLength={320}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'conjoin-err-email' : undefined}
          />
          {fieldErrors.email && (
            <p id="conjoin-err-email" data-conjoin-field-error="">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-up-password">
            Password
          </Label.Root>
          <input
            id="conjoin-sign-up-password"
            data-conjoin-input=""
            data-error={fieldErrors.password ? 'true' : undefined}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'conjoin-err-password' : undefined}
          />
          {fieldErrors.password && (
            <p id="conjoin-err-password" data-conjoin-field-error="">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          data-conjoin-button=""
          data-variant="primary"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {isSubmitting ? <span data-conjoin-spinner="" data-size="sm" /> : 'Create account'}
        </button>
      </form>

      {signInUrl && (
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--conjoin-subtle-text)',
            marginTop: '1.5rem',
          }}
        >
          Already have an account?{' '}
          <a href={signInUrl} style={{ color: 'var(--conjoin-primary)', textDecoration: 'none' }}>
            Sign in
          </a>
        </p>
      )}
    </div>
  )
}
