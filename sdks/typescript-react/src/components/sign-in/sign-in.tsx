import { useAuthFetch, useConjoinClient } from '@conjoin-cloud/react-core'
import * as Label from '@radix-ui/react-label'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { type ChangeEvent, type FormEvent, useCallback, useRef, useState } from 'react'
import { BusyContent } from '../internal/busy-content'
import { OAuthButton } from '../internal/oauth-button'

type SignInStep = 'identifier' | 'password' | 'mfa'

type SignInProps = {
  afterSignInUrl?: string
  forgotPasswordUrl?: string
  signUpUrl?: string
  onSignIn?: () => void
}

const ERROR_ID = 'conjoin-sign-in-error'

export function SignIn({ afterSignInUrl, forgotPasswordUrl, signUpUrl, onSignIn }: SignInProps) {
  const { sdkConfig } = useConjoinClient()
  const { authFetch, authDomain, isConfigured } = useAuthFetch()
  const [step, setStep] = useState<SignInStep>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [flowId, setFlowId] = useState<string | null>(null)

  const passwordRef = useRef<HTMLInputElement>(null)
  const mfaRef = useRef<HTMLInputElement>(null)
  const identifierRef = useRef<HTMLInputElement>(null)

  const signInMethods = sdkConfig?.auth.sign_in_methods ?? []
  const oauthMethods = signInMethods.filter(m => m !== 'email_password' && m !== 'email_otp')
  const hasEmailPassword = signInMethods.includes('email_password')
  const describedBy = error ? ERROR_ID : undefined

  const handleIdentifierChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value)
  }, [])

  const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }, [])

  const handleMfaChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setMfaCode(e.target.value)
  }, [])

  const handleIdentifierSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (isSubmitting || !identifier.trim()) return

      setIsSubmitting(true)
      setError(null)

      try {
        const response = await authFetch('/v1/auth/signin/start', {
          method: 'POST',
          body: JSON.stringify({ identifier: identifier.trim() }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string }
          setError(body.message ?? 'Unable to sign in. Please check your email and try again.')
          return
        }

        const body = (await response.json()) as { data: { flow_id: string } }
        setFlowId(body.data.flow_id)
        setStep('password')
        requestAnimationFrame(() => passwordRef.current?.focus())
      } catch {
        setError('A network error occurred. Please check your connection and try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [authFetch, identifier, isSubmitting],
  )

  const handlePasswordSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (isSubmitting || !flowId || !password) return

      setIsSubmitting(true)
      setError(null)

      try {
        const response = await authFetch('/v1/auth/signin/complete', {
          method: 'POST',
          body: JSON.stringify({ flow_id: flowId, password }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string; requires_mfa?: boolean }
          if (body.requires_mfa) {
            setStep('mfa')
            requestAnimationFrame(() => mfaRef.current?.focus())
            return
          }
          setError(body.message ?? 'Invalid credentials. Please try again.')
          return
        }

        if (afterSignInUrl) {
          window.location.href = afterSignInUrl
        }
        onSignIn?.()
      } catch {
        setError('A network error occurred. Please check your connection and try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [authFetch, flowId, password, afterSignInUrl, onSignIn, isSubmitting],
  )

  const handleMfaSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (isSubmitting || !flowId || !mfaCode) return

      setIsSubmitting(true)
      setError(null)

      try {
        const response = await authFetch('/v1/auth/signin/complete', {
          method: 'POST',
          body: JSON.stringify({ flow_id: flowId, mfa_code: mfaCode }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string }
          setError(body.message ?? 'Invalid verification code. Please try again.')
          return
        }

        if (afterSignInUrl) {
          window.location.href = afterSignInUrl
        }
        onSignIn?.()
      } catch {
        setError('A network error occurred. Please check your connection and try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [authFetch, flowId, mfaCode, afterSignInUrl, onSignIn, isSubmitting],
  )

  const handleOAuthClick = useCallback(
    (provider: string) => {
      if (!authDomain) return
      window.location.href = `https://${authDomain}/v1/auth/oauth/${encodeURIComponent(provider)}/start`
    },
    [authDomain],
  )

  const handleBack = useCallback(() => {
    setStep('identifier')
    setError(null)
    setPassword('')
    setMfaCode('')
    requestAnimationFrame(() => identifierRef.current?.focus())
  }, [])

  if (!isConfigured) {
    return (
      <div data-conjoin-card="">
        <p data-conjoin-heading="" data-conjoin-center="">
          Sign in is not available
        </p>
      </div>
    )
  }

  return (
    <div data-conjoin-card="">
      <h2 data-conjoin-heading="" data-level="card">
        Sign in
      </h2>

      {oauthMethods.length > 0 ? (
        <div data-conjoin-social-group="">
          {oauthMethods.map(method => (
            <OAuthButton key={method} provider={method} onSelect={handleOAuthClick} />
          ))}
        </div>
      ) : null}

      {oauthMethods.length > 0 && hasEmailPassword ? <div data-conjoin-divider-text="">or</div> : null}

      {error ? (
        <p id={ERROR_ID} data-conjoin-field-error="" role="alert">
          {error}
        </p>
      ) : null}

      {step === 'identifier' && hasEmailPassword ? (
        <form onSubmit={handleIdentifierSubmit} noValidate>
          <div data-conjoin-field="" data-gap="wide">
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-identifier">
              Email address
            </Label.Root>
            <input
              ref={identifierRef}
              id="conjoin-sign-in-identifier"
              data-conjoin-input=""
              type="email"
              autoComplete="email"
              value={identifier}
              onChange={handleIdentifierChange}
              placeholder="you@example.com"
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              maxLength={320}
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
            <BusyContent busy={isSubmitting} label="Continue" busyLabel="Signing in" />
          </button>
        </form>
      ) : null}

      {step === 'password' ? (
        <form onSubmit={handlePasswordSubmit} noValidate>
          <VisuallyHidden.Root>
            <label htmlFor="conjoin-sign-in-email-hidden">Email</label>
            <input id="conjoin-sign-in-email-hidden" type="email" value={identifier} readOnly autoComplete="email" />
          </VisuallyHidden.Root>

          <div data-conjoin-field="" data-gap="wide">
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-password">
              Password
            </Label.Root>
            <input
              ref={passwordRef}
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

          {forgotPasswordUrl ? (
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
            <BusyContent busy={isSubmitting} label="Sign in" busyLabel="Signing in" />
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

      {step === 'mfa' ? (
        <form onSubmit={handleMfaSubmit} noValidate>
          <div data-conjoin-field="" data-gap="wide">
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-mfa">
              Verification code
            </Label.Root>
            <input
              ref={mfaRef}
              id="conjoin-sign-in-mfa"
              data-conjoin-input=""
              data-mono="true"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={handleMfaChange}
              placeholder="Enter 6-digit code"
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

      {signUpUrl ? (
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
