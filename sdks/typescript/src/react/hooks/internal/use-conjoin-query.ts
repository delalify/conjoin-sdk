import { type QueryKey, QueryObserver, type QueryObserverOptions, type QueryObserverResult } from '@tanstack/query-core'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useConjoinClient } from './use-conjoin-client'

type ConjoinQueryOptions<TData, TError = Error> = {
  queryKey: QueryKey
  queryFn: () => Promise<TData>
  enabled?: boolean
  staleTime?: number
} & Omit<QueryObserverOptions<TData, TError>, 'queryKey' | 'queryFn'>

export function useConjoinQuery<TData, TError = Error>(
  options: ConjoinQueryOptions<TData, TError>,
): QueryObserverResult<TData, TError> {
  const { queryClient } = useConjoinClient()

  const [observer] = useState(
    () =>
      new QueryObserver<TData, TError>(queryClient, {
        ...options,
        queryKey: options.queryKey,
        queryFn: options.queryFn,
      }),
  )

  const subscribe = useMemo(() => {
    return (onStoreChange: () => void) => {
      const unsubscribe = observer.subscribe(() => {
        onStoreChange()
      })
      observer.updateResult()
      return unsubscribe
    }
  }, [observer])

  const result = useSyncExternalStore(
    subscribe,
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  )

  useEffect(() => {
    observer.setOptions(options)
  }, [observer, options])

  return result
}
