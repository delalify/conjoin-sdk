import * as Label from '@radix-ui/react-label'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { type FormEvent, useCallback, useState } from 'react'
import { useConjoinClient } from '../../hooks/internal/use-conjoin-client'

type SignInStep = 'identifier' | 'password' | 'mfa'

type SignInProps = {
  afterSignInUrl?: string
  onSignIn?: () => void
}

export function SignIn({ afterSignInUrl, onSignIn }: SignInProps) {
  const { sdkConfig } = useConjoinClient()
  const [step, setStep] = useState<SignInStep>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [flowId, setFlowId] = useState<string | null>(null)

  const authDomain = sdkConfig?.auth.domain
  const signInMethods = sdkConfig?.auth.sign_in_methods ?? []
  const oauthMethods = signInMethods.filter(m => m !== 'email_password' && m !== 'email_otp')
  const hasEmailPassword = signInMethods.includes('email_password')

  const handleIdentifierSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!authDomain || !identifier.trim()) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`https://${authDomain}/v1/auth/signin/start`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: identifier.trim() }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string }
          setError(body.message ?? 'Sign in failed')
          return
        }

        const body = (await response.json()) as { data: { flow_id: string; requires_mfa: boolean } }
        setFlowId(body.data.flow_id)
        setStep('password')
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    },
    [authDomain, identifier],
  )

  const handlePasswordSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!authDomain || !flowId || !password) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`https://${authDomain}/v1/auth/signin/complete`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flow_id: flowId, password }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string; requires_mfa?: boolean }
          if (body.requires_mfa) {
            setStep('mfa')
            return
          }
          setError(body.message ?? 'Invalid credentials')
          return
        }

        if (afterSignInUrl) {
          window.location.href = afterSignInUrl
        }
        onSignIn?.()
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    },
    [authDomain, flowId, password, afterSignInUrl, onSignIn],
  )

  const handleMfaSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!authDomain || !flowId || !mfaCode) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`https://${authDomain}/v1/auth/signin/complete`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flow_id: flowId, mfa_code: mfaCode }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string }
          setError(body.message ?? 'Invalid code')
          return
        }

        if (afterSignInUrl) {
          window.location.href = afterSignInUrl
        }
        onSignIn?.()
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    },
    [authDomain, flowId, mfaCode, afterSignInUrl, onSignIn],
  )

  const handleOAuthClick = useCallback(
    (provider: string) => {
      if (!authDomain) return
      window.location.href = `https://${authDomain}/v1/auth/oauth/${provider}/start`
    },
    [authDomain],
  )

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

      {step === 'identifier' && hasEmailPassword && (
        <form onSubmit={handleIdentifierSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-identifier">
              Email address
            </Label.Root>
            <input
              id="conjoin-sign-in-identifier"
              data-conjoin-input=""
              type="email"
              autoComplete="email"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {error && <p data-conjoin-field-error="">{error}</p>}

          <button
            type="submit"
            data-conjoin-button=""
            data-variant="primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isLoading ? <span data-conjoin-spinner="" data-size="sm" /> : 'Continue'}
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit}>
          <VisuallyHidden.Root>
            <label htmlFor="conjoin-sign-in-email-hidden">Email</label>
            <input id="conjoin-sign-in-email-hidden" type="email" value={identifier} readOnly autoComplete="email" />
          </VisuallyHidden.Root>

          <div style={{ marginBottom: '1rem' }}>
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-password">
              Password
            </Label.Root>
            <input
              id="conjoin-sign-in-password"
              data-conjoin-input=""
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p data-conjoin-field-error="">{error}</p>}

          <button
            type="submit"
            data-conjoin-button=""
            data-variant="primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isLoading ? <span data-conjoin-spinner="" data-size="sm" /> : 'Sign in'}
          </button>

          <button
            type="button"
            data-conjoin-button=""
            data-variant="outline"
            onClick={() => {
              setStep('identifier')
              setError(null)
            }}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            Back
          </button>
        </form>
      )}

      {step === 'mfa' && (
        <form onSubmit={handleMfaSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <Label.Root data-conjoin-label="" htmlFor="conjoin-sign-in-mfa">
              Verification code
            </Label.Root>
            <input
              id="conjoin-sign-in-mfa"
              data-conjoin-input=""
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
            />
          </div>

          {error && <p data-conjoin-field-error="">{error}</p>}

          <button
            type="submit"
            data-conjoin-button=""
            data-variant="primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isLoading ? <span data-conjoin-spinner="" data-size="sm" /> : 'Verify'}
          </button>
        </form>
      )}
    </div>
  )
}
