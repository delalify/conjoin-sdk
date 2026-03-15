import { useCallback } from 'react'
import { createBillingPriceBundles } from '../../generated/modules/billing-price-bundle'
import { useConjoinClient } from './internal/use-conjoin-client'
import { useConjoinQuery } from './internal/use-conjoin-query'

type BillingPriceBundlesApi = ReturnType<typeof createBillingPriceBundles>
type PriceBundleItem = Awaited<ReturnType<BillingPriceBundlesApi['list']>>['data'][number]

export function useBundles(entityId: string, referenceId: string) {
  const { client } = useConjoinClient()

  const queryFn = useCallback(async () => {
    const api = createBillingPriceBundles(client)
    const result = await api.list(entityId, referenceId)
    return result.data
  }, [client, entityId, referenceId])

  const result = useConjoinQuery<PriceBundleItem[]>({
    queryKey: ['conjoin', 'billing', 'bundles', entityId, referenceId],
    queryFn,
    enabled: !!entityId && !!referenceId,
  })

  return {
    bundles: result.data ?? [],
    isLoading: result.isLoading,
    error: result.error ?? null,
  }
}
