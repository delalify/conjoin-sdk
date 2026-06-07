import { useCallback, useEffect, useState } from 'react'
import {
  type FlowApiResult,
  type FlowResponseData,
  requestSigninComplete,
  requestSigninStart,
} from '../auth-flow/auth-flow-api'
import { useAuthActions } from './internal/use-auth-actions'
import { useConjoinClient } from './internal/use-conjoin-client'

export type SignInStatus = 'idle' | 'needs_verification' | 'needs_mfa' | 'redirecting' | 'complete'

export type SignInVerificationOption = 'email_verification_code' | 'magic_link' | 'phone_verification_code'

export type SignInStartParams = {
  email?: string
  phone?: string
  password?: string
  providerKey?: string
  verificationOption?: SignInVerificationOption
}

export type SignInVerificationParams = {
  code?: string
  magicLinkToken?: string
  oauthToken?: string
}

export type SignInMfaParams = { method: 'totp'; code: string } | { method: 'phone_verification_code'; code: string }

export type UseSignInReturn = {
  status: SignInStatus
  isSubmitting: boolean
  error: string | null
  verificationMethod: 'pin_code' | 'magic_link' | null
  mfaMethod: string | null
  signIn: (params: SignInStartParams) => Promise<void>
  attemptVerification: (params: SignInVerificationParams) => Promise<void>
  attemptMfa: (params: SignInMfaParams) => Promise<void>
  reset: () => void
}

type SignInPhase = {
  status: SignInStatus
  verificationMethod: 'pin_code' | 'magic_link' | null
  mfaMethod: string | null
}

const INITIAL_PHASE: SignInPhase = { status: 'idle', verificationMethod: null, mfaMethod: null }

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function buildStartBody(params: SignInStartParams): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (params.email) body.email = params.email
  if (params.phone) body.phone = params.phone
  if (params.password) body.password = params.password
  if (params.providerKey) body.provider_key = params.providerKey
  if (params.verificationOption) body.verification_option = params.verificationOption
  return body
}

export function useSignIn(): UseSignInReturn {
  const { sdkConfig } = useConjoinClient()
  const {
    createPkce,
    savePendingFlow,
    readPendingFlow,
    clearPendingFlow,
    attachCsrf,
    redirect,
    bootstrapSession,
    refreshIdentity,
  } = useAuthActions()

  const authDomain = sdkConfig?.auth.domain ?? null

  const [phase, setPhase] = useState<SignInPhase>(INITIAL_PHASE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const pending = readPendingFlow()
    if (pending && pending.kind === 'sign-in' && pending.verificationMethod) {
      setPhase({ status: 'needs_verification', verificationMethod: pending.verificationMethod, mfaMethod: null })
    }
  }, [readPendingFlow])

  const applyResult = useCallback(
    async (result: FlowApiResult<FlowResponseData>): Promise<void> => {
      if (!result.ok) {
        setError(result.message)
        return
      }

      const data = result.data ?? {}

      if (data.redirect_url) {
        setPhase({ status: 'redirecting', verificationMethod: null, mfaMethod: null })
        redirect(data.redirect_url)
        return
      }

      if (data.status === 'complete') {
        clearPendingFlow()
        const established = await bootstrapSession()
        if (!established) {
          setError('We verified you but could not start your session. Please try again.')
          return
        }
        await refreshIdentity()
        setPhase({ status: 'complete', verificationMethod: null, mfaMethod: null })
        return
      }

      if (data.status === 'mfa_required' || data.mfa) {
        const method = data.mfa?.method ?? null
        setPhase(prev => ({ status: 'needs_mfa', verificationMethod: prev.verificationMethod, mfaMethod: method }))
        return
      }

      if (data.status === 'verification_required' || data.verification_method) {
        const method = data.verification_method ?? null
        const pending = readPendingFlow()
        if (pending) {
          savePendingFlow({ ...pending, serverState: data.state ?? pending.serverState, verificationMethod: method })
        }
        setPhase({ status: 'needs_verification', verificationMethod: method, mfaMethod: null })
        return
      }

      setError('Unexpected response from the authentication server.')
    },
    [redirect, bootstrapSession, refreshIdentity, clearPendingFlow, readPendingFlow, savePendingFlow],
  )

  const signIn = useCallback(
    async (params: SignInStartParams): Promise<void> => {
      if (!authDomain) {
        setError('Authentication is not configured.')
        return
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const pkce = await createPkce()
        savePendingFlow({
          kind: 'sign-in',
          state: pkce.state,
          codeVerifier: pkce.codeVerifier,
          codeChallenge: pkce.codeChallenge,
          serverState: null,
          verificationMethod: null,
          identifier: params.email ?? params.phone ?? null,
        })

        const headers = attachCsrf({
          'Content-Type': 'application/json',
          'x-auth-state': pkce.state,
          'x-auth-code-verifier': pkce.codeVerifier,
          'x-auth-code-challenge': pkce.codeChallenge,
        })

        const result = await requestSigninStart(authDomain, { headers, body: buildStartBody(params) })
        await applyResult(result)
      } catch (caught) {
        setError(errorMessage(caught))
      } finally {
        setIsSubmitting(false)
      }
    },
    [authDomain, createPkce, savePendingFlow, attachCsrf, applyResult],
  )

  const attemptVerification = useCallback(
    async (params: SignInVerificationParams): Promise<void> => {
      const pending = readPendingFlow()
      if (!authDomain || !pending) {
        setError('Your verification session has expired. Please start again.')
        return
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const verificationResult: Record<string, unknown> = {}
        if (params.code) verificationResult.pin_code = params.code
        if (params.magicLinkToken) verificationResult.magic_link_token = params.magicLinkToken
        if (params.oauthToken) verificationResult.oauth_token = params.oauthToken

        const headers = attachCsrf({
          'Content-Type': 'application/json',
          'x-auth-state': pending.serverState ?? pending.state,
          'x-auth-code-verifier': pending.codeVerifier,
          'x-auth-code-challenge': pending.codeChallenge,
        })

        const result = await requestSigninComplete(authDomain, {
          headers,
          body: { verification_result: verificationResult },
        })
        await applyResult(result)
      } catch (caught) {
        setError(errorMessage(caught))
      } finally {
        setIsSubmitting(false)
      }
    },
    [authDomain, readPendingFlow, attachCsrf, applyResult],
  )

  const attemptMfa = useCallback(
    async (params: SignInMfaParams): Promise<void> => {
      const pending = readPendingFlow()
      if (!authDomain || !pending) {
        setError('Your sign-in session has expired. Please start again.')
        return
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const mfa =
          params.method === 'totp'
            ? { method: 'totp', totp_code: params.code }
            : { method: 'phone_verification_code', phone_code: params.code }

        const headers = attachCsrf({
          'Content-Type': 'application/json',
          'x-auth-state': pending.serverState ?? pending.state,
          'x-auth-code-verifier': pending.codeVerifier,
          'x-auth-code-challenge': pending.codeChallenge,
        })

        const result = await requestSigninComplete(authDomain, { headers, body: { verification_result: {}, mfa } })
        await applyResult(result)
      } catch (caught) {
        setError(errorMessage(caught))
      } finally {
        setIsSubmitting(false)
      }
    },
    [authDomain, readPendingFlow, attachCsrf, applyResult],
  )

  const reset = useCallback(() => {
    clearPendingFlow()
    setPhase(INITIAL_PHASE)
    setError(null)
  }, [clearPendingFlow])

  return {
    status: phase.status,
    isSubmitting,
    error,
    verificationMethod: phase.verificationMethod,
    mfaMethod: phase.mfaMethod,
    signIn,
    attemptVerification,
    attemptMfa,
    reset,
  }
}
