import { useCallback } from 'react'
import { createBillingPriceBundles } from '../../generated/modules/billing-price-bundle'
import { useConjoinClient } from './internal/use-conjoin-client'
import { useConjoinMutation } from './internal/use-conjoin-mutation'

type BillingApi = ReturnType<typeof createBillingPriceBundles>
type ActivateBody = Parameters<BillingApi['activate']>[2]
type DeactivateBody = Parameters<BillingApi['deactivate']>[2]

type ActivateParams = {
  entityId: string
  referenceId: string
  data: ActivateBody
}

type DeactivateParams = {
  entityId: string
  activationId: string
  data: DeactivateBody
}

export function useCheckout() {
  const { client } = useConjoinClient()

  const activateMutation = useConjoinMutation({
    mutationFn: useCallback(
      async (params: ActivateParams) => {
        const api = createBillingPriceBundles(client)
        return api.activate(params.entityId, params.referenceId, params.data)
      },
      [client],
    ),
    invalidateKeys: [['conjoin', 'billing']],
  })

  const deactivateMutation = useConjoinMutation({
    mutationFn: useCallback(
      async (params: DeactivateParams) => {
        const api = createBillingPriceBundles(client)
        return api.deactivate(params.entityId, params.activationId, params.data)
      },
      [client],
    ),
    invalidateKeys: [['conjoin', 'billing']],
  })

  return {
    activate: activateMutation.mutateAsync,
    deactivate: deactivateMutation.mutateAsync,
    isLoading: activateMutation.isPending || deactivateMutation.isPending,
    error: activateMutation.error ?? deactivateMutation.error ?? null,
  }
}

export type { ActivateParams, DeactivateParams }
