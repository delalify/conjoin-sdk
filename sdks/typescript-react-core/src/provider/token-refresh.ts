type QueuedRequest<T> = {
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

export function createTokenRefreshCoordinator() {
  let pendingRefresh: Promise<void> | null = null
  const requestQueue: QueuedRequest<unknown>[] = []
  let isProcessingQueue = false
  let refreshScheduleTimer: ReturnType<typeof setTimeout> | null = null

  function deduplicateRefresh(refreshFn: () => Promise<void>): Promise<void> {
    if (pendingRefresh) return pendingRefresh

    pendingRefresh = refreshFn().finally(() => {
      pendingRefresh = null
    })

    return pendingRefresh
  }

  function enqueueRequest<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      requestQueue.push({
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
      })
      processQueue()
    })
  }

  async function processQueue() {
    if (isProcessingQueue) return
    isProcessingQueue = true

    while (requestQueue.length > 0) {
      const request = requestQueue.shift()
      if (!request) break

      try {
        const result = await request.execute()
        request.resolve(result)
      } catch (error) {
        request.reject(error)
      }
    }

    isProcessingQueue = false
  }

  function scheduleProactiveRefresh(expiresAtMs: number, marginMs: number, refreshFn: () => Promise<void>) {
    if (refreshScheduleTimer) clearTimeout(refreshScheduleTimer)

    const now = Date.now()
    const refreshAt = expiresAtMs - marginMs
    const delay = Math.max(refreshAt - now, 0)

    refreshScheduleTimer = setTimeout(() => {
      deduplicateRefresh(refreshFn)
    }, delay)
  }

  function destroy() {
    if (refreshScheduleTimer) clearTimeout(refreshScheduleTimer)
    pendingRefresh = null
    requestQueue.length = 0
  }

  return {
    deduplicateRefresh,
    enqueueRequest,
    scheduleProactiveRefresh,
    destroy,
  }
}
