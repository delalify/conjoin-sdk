import { MutationObserver, type MutationObserverResult, type QueryKey } from '@tanstack/query-core'
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { useConjoinClient } from './use-conjoin-client'

type ConjoinMutationOptions<TData, TVariables, TError = Error> = {
  mutationFn: (variables: TVariables) => Promise<TData>
  invalidateKeys?: QueryKey[]
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: TError, variables: TVariables) => void
}

type ConjoinMutationResult<TData, TVariables, TError = Error> = {
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  data: TData | undefined
  error: TError | null
  isIdle: boolean
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  reset: () => void
}

export function useConjoinMutation<TData, TVariables, TError = Error>(
  options: ConjoinMutationOptions<TData, TVariables, TError>,
): ConjoinMutationResult<TData, TVariables, TError> {
  const { queryClient } = useConjoinClient()

  const [observer] = useState(
    () =>
      new MutationObserver<TData, TError, TVariables>(queryClient, {
        mutationFn: options.mutationFn,
        onSuccess: (data, variables) => {
          if (options.invalidateKeys) {
            for (const key of options.invalidateKeys) {
              queryClient.invalidateQueries({ queryKey: key })
            }
          }
          options.onSuccess?.(data, variables)
        },
        onError: (error, variables) => {
          options.onError?.(error, variables)
        },
      }),
  )

  const subscribe = useMemo(() => {
    return (onStoreChange: () => void) => {
      return observer.subscribe(() => {
        onStoreChange()
      })
    }
  }, [observer])

  const result = useSyncExternalStore(
    subscribe,
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  ) as MutationObserverResult<TData, TError, TVariables>

  const mutate = useCallback(
    (variables: TVariables) => {
      observer.mutate(variables)
    },
    [observer],
  )

  const mutateAsync = useCallback(
    (variables: TVariables): Promise<TData> => {
      return new Promise<TData>((resolve, reject) => {
        observer.mutate(variables, {
          onSuccess: data => resolve(data),
          onError: error => reject(error),
        })
      })
    },
    [observer],
  )

  return {
    mutate,
    mutateAsync,
    data: result.data,
    error: result.error,
    isIdle: result.status === 'idle',
    isPending: result.status === 'pending',
    isSuccess: result.status === 'success',
    isError: result.status === 'error',
    reset: () => observer.reset(),
  }
}
