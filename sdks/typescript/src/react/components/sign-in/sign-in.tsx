import * as Label from '@radix-ui/react-label'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { type FormEvent, useCallback, useRef, useState } from 'react'
import { useAuthFetch } from '../../hooks/internal/use-auth-fetch'
import { useConjoinClient } from '../../hooks/internal/use-conjoin-client'

type SignInStep = 'identifier' | 'password' | 'mfa'

type SignInProps = {
  afterSignInUrl?: string
  forgotPasswordUrl?: string
  signUpUrl?: string
  onSignIn?: () => void
}

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
        <p data-conjoin-heading="" style={{ textAlign: 'center' }}>
          Sign in is not available
        </p>
      </div>
    )
  }

  return (
    <div data-conjoin-card="">
      <h2 data-conjoin-heading="" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        Sign in
      </h2>

      {oauthMethods.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {oauthMethods.map(method => (
            <button key={method} type="button" data-conjoin-social-button="" onClick={() => handleOAuthClick(method)}>
              Continue with {method.charAt(0).toUpperCase() + method.slice(1)}
            </button>
          ))}
        </div>
      )}

      {oauthMethods.length > 0 && hasEmailPassword && <div data-conjoin-divider-text="">or</div>}

      {error && (
        <p data-conjoin-field-error="" role="alert">
          {error}
        </p>
      )}

      {step === 'identifier' && hasEmailPassword && (
        <form onSubmit={handleIdentifierSubmit} noValidate>
          <div style={{ marginBottom: '1rem' }}>
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
              onChange={e => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              required
              aria-invalid={!!error}
              maxLength={320}
            />
          </div>

          <button
            type="submit"
            data-conjoin-button=""
            data-variant="primary"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isSubmitting ? <span data-conjoin-spinner="" data-size="sm" /> : 'Continue'}
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} noValidate>
          <VisuallyHidden.Root>
            <label htmlFor="conjoin-sign-in-email-hidden">Email</label>
            <input id="conjoin-sign-in-email-hidden" type="email" value={identifier} readOnly autoComplete="email" />
          </VisuallyHidden.Root>

          <div style={{ marginBottom: '1rem' }}>
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
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              aria-invalid={!!error}
            />
          </div>

          {forgotPasswordUrl && (
            <div style={{ textAlign: 'right', marginBottom: '0.75rem' }}>
              <a
                href={forgotPasswordUrl}
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--conjoin-primary)',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            data-conjoin-button=""
            data-variant="primary"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isSubmitting ? <span data-conjoin-spinner="" data-size="sm" /> : 'Sign in'}
          </button>

          <button
            type="button"
            data-conjoin-button=""
            data-variant="outline"
            onClick={handleBack}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            Back
          </button>
        </form>
      )}

      {step === 'mfa' && (
        <form onSubmit={handleMfaSubmit} noValidate>
          <div style={{ marginBottom: '1rem' }}>
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-mfa">
              Verification code
            </Label.Root>
            <input
              ref={mfaRef}
              id="conjoin-sign-in-mfa"
              data-conjoin-input=""
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              maxLength={8}
              aria-invalid={!!error}
            />
          </div>

          <button
            type="submit"
            data-conjoin-button=""
            data-variant="primary"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isSubmitting ? <span data-conjoin-spinner="" data-size="sm" /> : 'Verify'}
          </button>
        </form>
      )}

      {signUpUrl && (
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--conjoin-subtle-text)',
            marginTop: '1.5rem',
          }}
        >
          Don't have an account?{' '}
          <a href={signUpUrl} style={{ color: 'var(--conjoin-primary)', textDecoration: 'none' }}>
            Sign up
          </a>
        </p>
      )}
    </div>
  )
}
