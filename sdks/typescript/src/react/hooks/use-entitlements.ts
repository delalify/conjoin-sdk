import { useCallback } from 'react'
import { createBillingEntitlementOverrides } from '../../generated/modules/billing-entitlement-override'
import { useConjoinClient } from './internal/use-conjoin-client'
import { useConjoinQuery } from './internal/use-conjoin-query'

type EntitlementOverridesApi = ReturnType<typeof createBillingEntitlementOverrides>
type EntitlementOverrideItem = Awaited<ReturnType<EntitlementOverridesApi['list']>>['data'][number]

type EntitlementCheckResult = {
  allowed: boolean
  balance?: number
  limit?: number
}

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

  const entitlements = result.data ?? []

  const check = useCallback(
    (featureId: string): EntitlementCheckResult => {
      const record = entitlements as unknown as Array<{
        feature_id?: string
        is_active?: boolean
        balance?: number
        limit?: number
      }>
      const entry = record.find(e => e.feature_id === featureId)
      if (!entry) return { allowed: false }
      return {
        allowed: entry.is_active === true,
        balance: entry.balance,
        limit: entry.limit,
      }
    },
    [entitlements],
  )

  return {
    entitlements,
    isLoading: result.isLoading,
    error: result.error ?? null,
    check,
  }
}
