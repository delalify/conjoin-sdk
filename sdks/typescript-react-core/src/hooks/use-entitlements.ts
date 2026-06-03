import { createBillingEntitlementOverrides } from '@conjoin-cloud/sdk/billing'
import { useCallback, useMemo } from 'react'
import { useConjoinClient } from './internal/use-conjoin-client'
import { useConjoinQuery } from './internal/use-conjoin-query'

type EntitlementOverridesApi = ReturnType<typeof createBillingEntitlementOverrides>
type EntitlementOverrideItem = Awaited<ReturnType<EntitlementOverridesApi['list']>>['data'][number]

type EntitlementCheckResult = {
  allowed: boolean
  limit?: number
}

const EMPTY_ENTITLEMENTS: EntitlementOverrideItem[] = []

export function useEntitlements(entityId: string) {
  const { client } = useConjoinClient()

  const queryFn = useCallback(async () => {
    const api = createBillingEntitlementOverrides(client)
    const result = await api.list(entityId)
    return result.data
  }, [client, entityId])

  const result = useConjoinQuery<EntitlementOverrideItem[]>({
    queryKey: ['conjoin', 'billing', 'entitlements', entityId],
    queryFn,
    enabled: !!entityId,
  })

  const entitlements = useMemo<EntitlementOverrideItem[]>(() => result.data ?? EMPTY_ENTITLEMENTS, [result.data])

  const check = useCallback(
    (featureId: string): EntitlementCheckResult => {
      const entry = entitlements.find(e => e.feature_id === featureId)
      if (!entry) return { allowed: false }
      const limit = entry.included_units ?? undefined
      return {
        allowed: entry.is_active === true,
        limit,
      }
    },
    [entitlements],
  )

  return useMemo(
    () => ({ entitlements, isLoading: result.isLoading, error: result.error ?? null, check }),
    [entitlements, result.isLoading, result.error, check],
  )
}
