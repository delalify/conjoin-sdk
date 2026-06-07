import { useCallback, useEffect, useState } from 'react'
import {
  type FlowApiResult,
  type FlowResponseData,
  requestSignupComplete,
  requestSignupStart,
} from '../auth-flow/auth-flow-api'
import { useAuthActions } from './internal/use-auth-actions'
import { useConjoinClient } from './internal/use-conjoin-client'

export type SignUpStatus = 'idle' | 'needs_verification' | 'redirecting' | 'complete'

export type SignUpVerificationOption = 'email_verification_code' | 'magic_link' | 'phone_verification_code'

export type SignUpStartParams = {
  email?: string
  phone?: string
  password?: string
  providerKey?: string
  verificationOption?: SignUpVerificationOption
}

export type SignUpVerificationParams = {
  code?: string
  magicLinkToken?: string
  oauthToken?: string
  password?: string
}

export type UseSignUpReturn = {
  status: SignUpStatus
  isSubmitting: boolean
  error: string | null
  verificationMethod: 'pin_code' | 'magic_link' | null
  signUp: (params: SignUpStartParams) => Promise<void>
  attemptVerification: (params: SignUpVerificationParams) => Promise<void>
  reset: () => void
}

type SignUpPhase = {
  status: SignUpStatus
  verificationMethod: 'pin_code' | 'magic_link' | null
}

const INITIAL_PHASE: SignUpPhase = { status: 'idle', verificationMethod: null }

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function buildStartBody(params: SignUpStartParams): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (params.email) body.email = params.email
  if (params.phone) body.phone = params.phone
  if (params.password) body.password = params.password
  if (params.providerKey) body.provider_key = params.providerKey
  if (params.verificationOption) body.verification_option = params.verificationOption
  return body
}

export function useSignUp(): UseSignUpReturn {
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

  const [phase, setPhase] = useState<SignUpPhase>(INITIAL_PHASE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const pending = readPendingFlow()
    if (pending && pending.kind === 'sign-up' && pending.verificationMethod) {
      setPhase({ status: 'needs_verification', verificationMethod: pending.verificationMethod })
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
        setPhase({ status: 'redirecting', verificationMethod: null })
        redirect(data.redirect_url)
        return
      }

      if (data.status === 'complete') {
        clearPendingFlow()
        const established = await bootstrapSession()
        if (!established) {
          setError('Your account was created but we could not start your session. Please sign in.')
          return
        }
        await refreshIdentity()
        setPhase({ status: 'complete', verificationMethod: null })
        return
      }

      if (data.status === 'verification_required' || data.verification_method) {
        const method = data.verification_method ?? null
        const pending = readPendingFlow()
        if (pending) {
          savePendingFlow({ ...pending, serverState: data.state ?? pending.serverState, verificationMethod: method })
        }
        setPhase({ status: 'needs_verification', verificationMethod: method })
        return
      }

      setError('Unexpected response from the authentication server.')
    },
    [redirect, bootstrapSession, refreshIdentity, clearPendingFlow, readPendingFlow, savePendingFlow],
  )

  const signUp = useCallback(
    async (params: SignUpStartParams): Promise<void> => {
      if (!authDomain) {
        setError('Authentication is not configured.')
        return
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const pkce = await createPkce()
        savePendingFlow({
          kind: 'sign-up',
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

        const result = await requestSignupStart(authDomain, { headers, body: buildStartBody(params) })
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
    async (params: SignUpVerificationParams): Promise<void> => {
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

        const body: Record<string, unknown> = { verification_result: verificationResult }
        if (params.password) body.password = params.password

        const headers = attachCsrf({
          'Content-Type': 'application/json',
          'x-auth-state': pending.serverState ?? pending.state,
          'x-auth-code-verifier': pending.codeVerifier,
          'x-auth-code-challenge': pending.codeChallenge,
        })

        const result = await requestSignupComplete(authDomain, { headers, body })
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
    signUp,
    attemptVerification,
    reset,
  }
}
