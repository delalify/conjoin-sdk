import { useConjoinClient, useSignUp } from '@conjoin-cloud/react-core'
import * as Label from '@radix-ui/react-label'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from 'react'
import { BusyContent } from '../internal/busy-content'
import { OAuthButton } from '../internal/oauth-button'
import { Spinner } from '../internal/spinner'

type SignUpProps = {
  afterSignUpUrl?: string
  signInUrl?: string
  onSignUp?: () => void
}

const ERROR_ID = 'conjoin-sign-up-error'

const isOAuthMethod = (method: string): boolean =>
  method !== 'email_password' && method !== 'email' && method !== 'password'

export function SignUp({ afterSignUpUrl, signInUrl, onSignUp }: SignUpProps) {
  const { sdkConfig, isConfigLoaded } = useConjoinClient()
  const { status, isSubmitting, error, verificationMethod, signUp, attemptVerification, reset } = useSignUp()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  const methods = sdkConfig?.auth.sign_in_methods ?? []
  const oauthMethods = methods.filter(isOAuthMethod)
  const usesPassword = methods.includes('email_password') || methods.includes('password')
  const signUpEnabled = sdkConfig?.auth.sign_up_enabled !== false
  const describedBy = error ? ERROR_ID : undefined

  useEffect(() => {
    if (status !== 'complete') return

    onSignUp?.()
    if (afterSignUpUrl) {
      window.location.assign(afterSignUpUrl)
    }
  }, [status, onSignUp, afterSignUpUrl])

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }, [])

  const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }, [])

  const handleCodeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value)
  }, [])

  const handleDetailsSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (isSubmitting || !email.trim()) return

      await signUp({
        email: email.trim(),
        password: usesPassword ? password : undefined,
        verificationOption: 'email_verification_code',
      })
    },
    [isSubmitting, email, password, usesPassword, signUp],
  )

  const handleVerificationSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (isSubmitting || !code.trim()) return

      await attemptVerification({ code: code.trim(), password: usesPassword ? password : undefined })
    },
    [isSubmitting, code, password, usesPassword, attemptVerification],
  )

  const handleOAuthSelect = useCallback(
    (provider: string) => {
      void signUp({ providerKey: provider })
    },
    [signUp],
  )

  const handleBack = useCallback(() => {
    setCode('')
    reset()
  }, [reset])

  if (!isConfigLoaded) {
    return (
      <div data-conjoin-card="">
        <div data-conjoin-state="">
          <Spinner size="sm" label="Loading" />
        </div>
      </div>
    )
  }

  if (!signUpEnabled) {
    return (
      <div data-conjoin-card="">
        <p data-conjoin-heading="" data-conjoin-center="">
          Sign up is not available
        </p>
      </div>
    )
  }

  if (status === 'redirecting') {
    return (
      <div data-conjoin-card="">
        <div data-conjoin-state="">
          <Spinner size="sm" label="Redirecting to your provider" />
        </div>
      </div>
    )
  }

  return (
    <div data-conjoin-card="">
      <h2 data-conjoin-heading="" data-level="card">
        Create your account
      </h2>

      {status === 'idle' && oauthMethods.length > 0 ? (
        <div data-conjoin-social-group="">
          {oauthMethods.map(method => (
            <OAuthButton key={method} provider={method} onSelect={handleOAuthSelect} />
          ))}
          <div data-conjoin-divider-text="">or</div>
        </div>
      ) : null}

      {error ? (
        <p id={ERROR_ID} data-conjoin-field-error="" role="alert">
          {error}
        </p>
      ) : null}

      {status === 'idle' ? (
        <form onSubmit={handleDetailsSubmit} noValidate>
          <div data-conjoin-field="">
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-up-email">
              Email address
            </Label.Root>
            <input
              id="conjoin-sign-up-email"
              data-conjoin-input=""
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="you@example.com"
              required
              maxLength={320}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
            />
          </div>

          {usesPassword ? (
            <div data-conjoin-field="">
              <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-up-password">
                Password
              </Label.Root>
              <input
                id="conjoin-sign-up-password"
                data-conjoin-input=""
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Create a password"
                required
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
              />
            </div>
          ) : null}

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
      ) : null}

      {status === 'needs_verification' && verificationMethod === 'magic_link' ? (
        <div data-conjoin-state="">
          <p data-conjoin-prompt="">
            We sent a confirmation link to {email || 'your email'}. Open it to finish setting up your account.
          </p>
          <button type="button" data-conjoin-button="" data-variant="outline" data-block="true" onClick={handleBack}>
            Back
          </button>
        </div>
      ) : null}

      {status === 'needs_verification' && verificationMethod !== 'magic_link' ? (
        <form onSubmit={handleVerificationSubmit} noValidate>
          <VisuallyHidden.Root>
            <label htmlFor="conjoin-sign-up-email-hidden">Email</label>
            <input id="conjoin-sign-up-email-hidden" type="email" value={email} readOnly autoComplete="email" />
          </VisuallyHidden.Root>

          <div data-conjoin-field="" data-gap="wide">
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-up-code">
              Verification code
            </Label.Root>
            <input
              id="conjoin-sign-up-code"
              data-conjoin-input=""
              data-mono="true"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={handleCodeChange}
              placeholder="Enter the code we emailed you"
              required
              maxLength={12}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
            />
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
            <BusyContent busy={isSubmitting} label="Verify" busyLabel="Verifying" />
          </button>

          <button
            type="button"
            data-conjoin-button=""
            data-variant="outline"
            data-block="true"
            data-spacing="stacked"
            onClick={handleBack}
          >
            Back
          </button>
        </form>
      ) : null}

      {status === 'idle' && signInUrl ? (
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
