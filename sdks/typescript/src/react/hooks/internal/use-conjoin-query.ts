import { type QueryKey, QueryObserver, type QueryObserverResult } from '@tanstack/query-core'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useConjoinClient } from './use-conjoin-client'

type ConjoinQueryOptions<TData> = {
  queryKey: QueryKey
  queryFn: () => Promise<TData>
  enabled?: boolean
  staleTime?: number
}

export function useConjoinQuery<TData>(options: ConjoinQueryOptions<TData>): QueryObserverResult<TData, Error> {
  const { queryClient } = useConjoinClient()
  const { queryKey, queryFn, enabled, staleTime } = options

  const [observer] = useState(
    () => new QueryObserver<TData, Error>(queryClient, { queryKey, queryFn, enabled, staleTime }),
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
    observer.setOptions({ queryKey, queryFn, enabled, staleTime })
  }, [observer, queryKey, queryFn, enabled, staleTime])

  return result
}
