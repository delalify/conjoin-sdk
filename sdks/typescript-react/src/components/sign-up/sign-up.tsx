import { useAuthFetch, useConjoinClient } from '@conjoin-cloud/react-core'
import * as Label from '@radix-ui/react-label'
import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react'
import { BusyContent } from '../internal/busy-content'
import { OAuthButton } from '../internal/oauth-button'

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

  const handleFirstNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value)
  }, [])

  const handleLastNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value)
  }, [])

  const handleEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }, [])

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

  if (!isConfigured || !signUpEnabled) {
    return (
      <div data-conjoin-card="">
        <p data-conjoin-heading="" data-conjoin-center="">
          Sign up is not available
        </p>
      </div>
    )
  }

  return (
    <div data-conjoin-card="">
      <h2 data-conjoin-heading="" data-level="card">
        Create your account
      </h2>

      {oauthMethods.length > 0 ? (
        <div data-conjoin-social-group="">
          {oauthMethods.map(method => (
            <OAuthButton key={method} provider={method} onSelect={handleOAuthClick} />
          ))}
          <div data-conjoin-divider-text="">or</div>
        </div>
      ) : null}

      {error && !Object.keys(fieldErrors).length ? (
        <p data-conjoin-field-error="" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div data-conjoin-field-row="">
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
              onChange={handleFirstNameChange}
              maxLength={100}
              aria-invalid={fieldErrors.first_name ? true : undefined}
              aria-describedby={fieldErrors.first_name ? 'conjoin-err-first-name' : undefined}
            />
            {fieldErrors.first_name ? (
              <p id="conjoin-err-first-name" data-conjoin-field-error="">
                {fieldErrors.first_name}
              </p>
            ) : null}
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
              onChange={handleLastNameChange}
              maxLength={100}
              aria-invalid={fieldErrors.last_name ? true : undefined}
              aria-describedby={fieldErrors.last_name ? 'conjoin-err-last-name' : undefined}
            />
            {fieldErrors.last_name ? (
              <p id="conjoin-err-last-name" data-conjoin-field-error="">
                {fieldErrors.last_name}
              </p>
            ) : null}
          </div>
        </div>

        <div data-conjoin-field="">
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
            onChange={handleEmailChange}
            placeholder="you@example.com"
            required
            maxLength={320}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'conjoin-err-email' : undefined}
          />
          {fieldErrors.email ? (
            <p id="conjoin-err-email" data-conjoin-field-error="">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div data-conjoin-field="">
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
            onChange={handlePasswordChange}
            placeholder="Create a password"
            required
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? 'conjoin-err-password' : undefined}
          />
          {fieldErrors.password ? (
            <p id="conjoin-err-password" data-conjoin-field-error="">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          data-conjoin-button=""
          data-variant="primary"
          data-block="true"
          data-spacing="stacked"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          <BusyContent busy={isSubmitting} label="Create account" busyLabel="Creating account" />
        </button>
      </form>

      {signInUrl ? (
        <p data-conjoin-prompt="">
          Already have an account?{' '}
          <a href={signInUrl} data-conjoin-link="">
            Sign in
          </a>
        </p>
      ) : null}
    </div>
  )
}
