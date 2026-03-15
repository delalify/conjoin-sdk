import { useCallback } from 'react'
import { createBillingEntitlementOverrides } from '../../generated/modules/billing-entitlement-override'
import { useConjoinClient } from './internal/use-conjoin-client'
import { useConjoinQuery } from './internal/use-conjoin-query'

type EntitlementOverridesApi = ReturnType<typeof createBillingEntitlementOverrides>
type EntitlementOverrideItem = Awaited<ReturnType<EntitlementOverridesApi['list']>>['data'][number]

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
    (featureId: string): { allowed: boolean; balance?: number; limit?: number } => {
      const entry = entitlements.find(e => (e as Record<string, unknown>).feature_id === featureId)
      if (!entry) return { allowed: false }
      const record = entry as Record<string, unknown>
      return {
        allowed: record.is_active === true,
        balance: typeof record.balance === 'number' ? record.balance : undefined,
        limit: typeof record.limit === 'number' ? record.limit : undefined,
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
