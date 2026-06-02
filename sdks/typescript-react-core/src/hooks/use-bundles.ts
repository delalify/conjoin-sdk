import { createBillingPriceBundles } from '@conjoin-cloud/sdk/billing'
import { useCallback, useMemo } from 'react'
import { useConjoinClient } from './internal/use-conjoin-client'
import { useConjoinQuery } from './internal/use-conjoin-query'

type BillingPriceBundlesApi = ReturnType<typeof createBillingPriceBundles>
export type PriceBundleItem = Awaited<ReturnType<BillingPriceBundlesApi['list']>>['data'][number]

const EMPTY_BUNDLES: PriceBundleItem[] = []

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

  const bundles = result.data ?? EMPTY_BUNDLES

  return useMemo(
    () => ({ bundles, isLoading: result.isLoading, error: result.error ?? null }),
    [bundles, result.isLoading, result.error],
  )
}
