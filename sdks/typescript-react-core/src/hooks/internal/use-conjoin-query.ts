import { hashKey, type QueryKey, QueryObserver, type QueryObserverResult } from '@tanstack/query-core'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
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

  const queryKeyHash = hashKey(queryKey)
  const stableKeyRef = useRef<{ hash: string; key: QueryKey }>({ hash: queryKeyHash, key: queryKey })
  if (stableKeyRef.current.hash !== queryKeyHash) {
    stableKeyRef.current = { hash: queryKeyHash, key: queryKey }
  }
  const stableKey = stableKeyRef.current.key

  const [observer] = useState(
    () => new QueryObserver<TData, Error>(queryClient, { queryKey: stableKey, queryFn, enabled, staleTime }),
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
    observer.setOptions({ queryKey: stableKey, queryFn, enabled, staleTime })
  }, [observer, stableKey, queryFn, enabled, staleTime])

  return result
}
