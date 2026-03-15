import { QueryClient } from '@tanstack/query-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createConjoinClient } from '../../core/client'
import { type AuthManager, createAuthManager } from './auth-manager'
import { fetchSdkConfig } from './config-fetcher'
import { ConjoinAuthContext, ConjoinClientContext } from './contexts'
import type { AuthTransport, ConjoinAuthState, ConjoinProviderProps, ConjoinSdkConfig } from './types'

type ConjoinProviderCoreProps = ConjoinProviderProps & {
  transport: AuthTransport
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
      client,
      transport,
      sdkConfig,
      onStateChange: setAuthState,
    })

    authManagerRef.current = manager
    manager.initialize()

    return () => {
      manager.destroy()
      authManagerRef.current = null
    }
  }, [client, transport, sdkConfig])

  const getToken = useCallback(() => {
    return authManagerRef.current?.getToken() ?? null
  }, [])

  const signOut = useCallback(async () => {
    await authManagerRef.current?.signOut()
  }, [])

  const has = useCallback(
    (params: { role?: string; permission?: string }) => {
      if (!authState.isLoaded || !authState.isSignedIn) return false
      if (params.role && authState.organizationRole !== params.role) return false
      return true
    },
    [authState],
  )

  const clientContextValue = useMemo(
    () => ({ client, queryClient, sdkConfig, isConfigLoaded }),
    [client, queryClient, sdkConfig, isConfigLoaded],
  )

  const authContextValue = useMemo(() => ({ authState, getToken, signOut, has }), [authState, getToken, signOut, has])

  return (
    <ConjoinClientContext.Provider value={clientContextValue}>
      <ConjoinAuthContext.Provider value={authContextValue}>{children}</ConjoinAuthContext.Provider>
    </ConjoinClientContext.Provider>
  )
}
