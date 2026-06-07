import { createConjoinClient } from '@conjoin-cloud/sdk'
import { QueryClient } from '@tanstack/query-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIdentityHydration } from '../hooks/internal/use-identity-hydration'
import { type AuthManager, createAuthManager } from './auth-manager'
import { fetchSdkConfig } from './config-fetcher'
import {
  type ConjoinAuthActions,
  ConjoinAuthActionsContext,
  ConjoinAuthStateContext,
  ConjoinClientContext,
  ConjoinIdentityContext,
} from './contexts'
import type { AuthTransport, ConjoinAuthState, ConjoinProviderProps, ConjoinSdkConfig } from './types'

type ConjoinProviderCoreProps = ConjoinProviderProps & {
  transport: AuthTransport
}

/**
 * Presence is derived from the readable client handle, so the manager emits a
 * fresh state object whenever the handle is re-read. Collapsing updates onto a
 * presence signature keeps unrelated re-renders from cascading to every auth
 * consumer when the handle value is unchanged.
 */
function authStateSignature(state: ConjoinAuthState): string {
  if (!state.isLoaded) return 'loading'
  if (!state.isSignedIn) return 'signed-out'
  return `${state.clientId}|${state.referenceId}`
}

function mergePartialConfig(partial: Partial<ConjoinSdkConfig>, fallbackBaseUrl: string): ConjoinSdkConfig {
  return {
    project_id: partial.project_id ?? '',
    environment: partial.environment ?? 'test',
    api_url: partial.api_url ?? fallbackBaseUrl,
    branding: partial.branding ?? null,
    auth: {
      domain: partial.auth?.domain ?? '',
      sign_in_methods: partial.auth?.sign_in_methods ?? [],
      mfa_enabled: partial.auth?.mfa_enabled ?? false,
      sign_up_enabled: partial.auth?.sign_up_enabled ?? true,
    },
    relay: {
      url: partial.relay?.url ?? '',
    },
  }
}

export function ConjoinProviderCore({ publishableKey, children, config, transport }: ConjoinProviderCoreProps) {
  const [sdkConfig, setSdkConfig] = useState<ConjoinSdkConfig | null>(null)
  const [isConfigLoaded, setIsConfigLoaded] = useState(!!config)
  const [authState, setAuthState] = useState<ConjoinAuthState>({ isLoaded: false })

  const authManagerRef = useRef<AuthManager | null>(null)
  const authSignatureRef = useRef<string | null>(null)

  const handleAuthStateChange = useCallback((next: ConjoinAuthState) => {
    const signature = authStateSignature(next)
    if (signature === authSignatureRef.current) return
    authSignatureRef.current = signature
    setAuthState(next)
  }, [])

  const client = useMemo(() => {
    return createConjoinClient({
      publishableKey,
      baseUrl: config?.api_url,
    })
  }, [publishableKey, config?.api_url])

  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: 2,
        },
      },
    })
  }, [])

  useEffect(() => {
    if (config) {
      setSdkConfig(mergePartialConfig(config, client.config.baseUrl))
      setIsConfigLoaded(true)
      return
    }

    let cancelled = false
    fetchSdkConfig(client)
      .then(fetched => {
        if (!cancelled) {
          setSdkConfig(fetched)
          setIsConfigLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setIsConfigLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [client, config])

  useEffect(() => {
    const manager = createAuthManager({
      transport,
      sdkConfig,
      onStateChange: handleAuthStateChange,
    })

    authManagerRef.current = manager
    manager.initialize()

    return () => {
      manager.destroy()
      authManagerRef.current = null
    }
  }, [transport, sdkConfig, handleAuthStateChange])

  const signOut = useCallback(async () => {
    await authManagerRef.current?.signOut()
  }, [])

  const bootstrapSession = useCallback(async () => {
    return (await authManagerRef.current?.bootstrapSession()) ?? false
  }, [])

  const attachCsrf = useCallback((headers: Record<string, string>) => transport.attachCsrf(headers), [transport])

  const authDomain = sdkConfig?.auth.domain ?? null
  const isSignedIn = authState.isLoaded && authState.isSignedIn
  const presenceKey = authStateSignature(authState)

  const identity = useIdentityHydration({
    authDomain,
    isSignedIn,
    presenceKey,
    attachCsrf,
  })

  const clientContextValue = useMemo(
    () => ({ client, queryClient, sdkConfig, isConfigLoaded }),
    [client, queryClient, sdkConfig, isConfigLoaded],
  )

  const authActions = useMemo<ConjoinAuthActions>(
    () => ({
      signOut,
      attachCsrf,
      createPkce: transport.createPkce,
      savePendingFlow: transport.savePendingFlow,
      readPendingFlow: transport.readPendingFlow,
      clearPendingFlow: transport.clearPendingFlow,
      redirect: transport.redirect,
      bootstrapSession,
      refreshIdentity: identity.refresh,
    }),
    [signOut, attachCsrf, transport, bootstrapSession, identity.refresh],
  )

  return (
    <ConjoinClientContext.Provider value={clientContextValue}>
      <ConjoinAuthActionsContext.Provider value={authActions}>
        <ConjoinAuthStateContext.Provider value={authState}>
          <ConjoinIdentityContext.Provider value={identity}>{children}</ConjoinIdentityContext.Provider>
        </ConjoinAuthStateContext.Provider>
      </ConjoinAuthActionsContext.Provider>
    </ConjoinClientContext.Provider>
  )
}
