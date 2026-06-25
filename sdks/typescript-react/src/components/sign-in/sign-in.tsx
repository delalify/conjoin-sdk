import { useConjoinClient, useSignIn } from '@conjoin-cloud/react-core'
import * as Label from '@radix-ui/react-label'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from 'react'
import { BusyContent } from '../internal/busy-content'
import { OAuthButton } from '../internal/oauth-button'
import { Spinner } from '../internal/spinner'

type SignInProps = {
  afterSignInUrl?: string
  forgotPasswordUrl?: string
  signUpUrl?: string
  onSignIn?: () => void
}

const ERROR_ID = 'conjoin-sign-in-error'

const isOAuthMethod = (method: string): boolean =>
  method !== 'email_password' && method !== 'email' && method !== 'password'

export function SignIn({ afterSignInUrl, forgotPasswordUrl, signUpUrl, onSignIn }: SignInProps) {
  const { sdkConfig, isConfigLoaded } = useConjoinClient()
  const { status, isSubmitting, error, verificationMethod, mfaMethod, signIn, attemptVerification, attemptMfa, reset } =
    useSignIn()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [mfaCode, setMfaCode] = useState('')

  const methods = sdkConfig?.auth.sign_in_methods ?? []
  const oauthMethods = methods.filter(isOAuthMethod)
  const usesPassword = methods.includes('email_password') || methods.includes('password')
  const usesEmailCode = methods.includes('email')
  const hasIdentifierForm = usesPassword || usesEmailCode
  const describedBy = error ? ERROR_ID : undefined

  useEffect(() => {
    if (status !== 'complete') return

    onSignIn?.()
    if (afterSignInUrl) {
      window.location.assign(afterSignInUrl)
    }
  }, [status, onSignIn, afterSignInUrl])

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }, [])

  const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }, [])

  const handleCodeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value)
  }, [])

  const handleMfaChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setMfaCode(event.target.value)
  }, [])

  const handleIdentifierSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (isSubmitting || !email.trim()) return

      if (usesPassword) {
        await signIn({ email: email.trim(), password })
        return
      }

      await signIn({ email: email.trim(), verificationOption: 'email_verification_code' })
    },
    [isSubmitting, email, password, usesPassword, signIn],
  )

  const handleVerificationSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (isSubmitting || !code.trim()) return

      await attemptVerification({ code: code.trim() })
    },
    [isSubmitting, code, attemptVerification],
  )

  const handleMfaSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (isSubmitting || !mfaCode.trim()) return

      await attemptMfa({
        method: mfaMethod === 'totp' ? 'totp' : 'phone_verification_code',
        code: mfaCode.trim(),
      })
    },
    [isSubmitting, mfaCode, mfaMethod, attemptMfa],
  )

  const handleOAuthSelect = useCallback(
    (provider: string) => {
      void signIn({ providerKey: provider })
    },
    [signIn],
  )

  const handleBack = useCallback(() => {
    setPassword('')
    setCode('')
    setMfaCode('')
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
        Sign in
      </h2>

      {status === 'idle' && oauthMethods.length > 0 ? (
        <div data-conjoin-social-group="">
          {oauthMethods.map(method => (
            <OAuthButton key={method} provider={method} onSelect={handleOAuthSelect} />
          ))}
        </div>
      ) : null}

      {status === 'idle' && oauthMethods.length > 0 && hasIdentifierForm ? (
        <div data-conjoin-divider-text="">or</div>
      ) : null}

      {error ? (
        <p id={ERROR_ID} data-conjoin-field-error="" role="alert">
          {error}
        </p>
      ) : null}

      {status === 'idle' && hasIdentifierForm ? (
        <form onSubmit={handleIdentifierSubmit} noValidate>
          <div data-conjoin-field="" data-gap="wide">
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-email">
              Email address
            </Label.Root>
            <input
              id="conjoin-sign-in-email"
              data-conjoin-input=""
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="you@example.com"
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              maxLength={320}
            />
          </div>

          {usesPassword ? (
            <div data-conjoin-field="" data-gap="wide">
              <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-password">
                Password
              </Label.Root>
              <input
                id="conjoin-sign-in-password"
                data-conjoin-input=""
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                required
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
              />
            </div>
          ) : null}

          {usesPassword && forgotPasswordUrl ? (
            <div data-conjoin-forgot="">
              <a href={forgotPasswordUrl} data-conjoin-link="">
                Forgot password?
              </a>
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
            <BusyContent busy={isSubmitting} label="Continue" busyLabel="Signing in" />
          </button>
        </form>
      ) : null}

      {status === 'needs_verification' && verificationMethod === 'magic_link' ? (
        <div data-conjoin-state="">
          <p data-conjoin-prompt="">We sent a sign-in link to {email || 'your email'}. Open it to finish signing in.</p>
          <button type="button" data-conjoin-button="" data-variant="outline" data-block="true" onClick={handleBack}>
            Back
          </button>
        </div>
      ) : null}

      {status === 'needs_verification' && verificationMethod !== 'magic_link' ? (
        <form onSubmit={handleVerificationSubmit} noValidate>
          <VisuallyHidden.Root>
            <label htmlFor="conjoin-sign-in-email-hidden">Email</label>
            <input id="conjoin-sign-in-email-hidden" type="email" value={email} readOnly autoComplete="email" />
          </VisuallyHidden.Root>

          <div data-conjoin-field="" data-gap="wide">
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-code">
              Verification code
            </Label.Root>
            <input
              id="conjoin-sign-in-code"
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

      {status === 'needs_mfa' && mfaMethod === 'passkey' ? (
        <div data-conjoin-state="">
          <p data-conjoin-prompt="">
            Your account uses a passkey for verification, which this screen does not yet support.
          </p>
          <button type="button" data-conjoin-button="" data-variant="outline" data-block="true" onClick={handleBack}>
            Back
          </button>
        </div>
      ) : null}

      {status === 'needs_mfa' && mfaMethod !== 'passkey' ? (
        <form onSubmit={handleMfaSubmit} noValidate>
          <div data-conjoin-field="" data-gap="wide">
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-mfa">
              Verification code
            </Label.Root>
            <input
              id="conjoin-sign-in-mfa"
              data-conjoin-input=""
              data-mono="true"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={handleMfaChange}
              placeholder="Enter your 6-digit code"
              required
              maxLength={8}
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
        </form>
      ) : null}

      {status === 'idle' && signUpUrl ? (
        <p data-conjoin-prompt="">
          Don't have an account?{' '}
          <a href={signUpUrl} data-conjoin-link="">
            Sign up
          </a>
        </p>
      ) : null}
    </div>
  )
}
