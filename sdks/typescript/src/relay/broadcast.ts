import type { ConjoinClient } from '../core/types'
import { createRelayBroadcasts } from '../generated/modules/relay-broadcast'
import type { BroadcastConnectionOptions, BroadcastListener, BroadcastMessage, ConnectionState } from './types'

const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10
const DEFAULT_RECONNECT_BASE_DELAY = 1000
const DEFAULT_RECONNECT_MAX_DELAY = 30_000
const DEFAULT_HEARTBEAT_INTERVAL = 25_000
const JITTER_FACTOR = 0.5

type Subscription = {
  event: string | '*'
  listener: BroadcastListener
}

export type BroadcastConnection = {
  readonly state: ConnectionState
  connect: () => Promise<void>
  disconnect: () => void
  publish: (event: string, data: unknown) => void
  subscribe: <T = unknown>(event: string, listener: BroadcastListener<T>) => () => void
  subscribeAll: <T = unknown>(listener: BroadcastListener<T>) => () => void
}

export function createBroadcastConnection(
  client: ConjoinClient,
  options: BroadcastConnectionOptions,
): BroadcastConnection {
  const broadcastApi = createRelayBroadcasts(client)
  const maxAttempts = options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS
  const baseDelay = options.reconnectBaseDelay ?? DEFAULT_RECONNECT_BASE_DELAY
  const maxDelay = options.reconnectMaxDelay ?? DEFAULT_RECONNECT_MAX_DELAY
  const heartbeatMs = options.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL
  const autoReconnect = options.autoReconnect !== false

  let state: ConnectionState = 'idle'
  let ws: WebSocket | null = null
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let intentionalClose = false
  const subscriptions = new Set<Subscription>()

  function setState(next: ConnectionState) {
    if (state === next) return
    state = next
    options.onStateChange?.(next)
  }

  function clearTimers() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function startHeartbeat() {
    heartbeatTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, heartbeatMs)
  }

  function getReconnectDelay(attempt: number): number {
    const exponential = Math.min(baseDelay * 2 ** attempt, maxDelay)
    const jitter = exponential * (1 - JITTER_FACTOR + Math.random() * JITTER_FACTOR * 2)
    return Math.floor(jitter)
  }

  function handleMessage(raw: MessageEvent) {
    try {
      const message = JSON.parse(String(raw.data)) as BroadcastMessage

      if ((message as unknown as { type: string }).type === 'pong') return

      for (const sub of subscriptions) {
        if (sub.event === '*' || sub.event === message.event) {
          sub.listener(message)
        }
      }
    } catch {
      options.onError?.(new Error(`Failed to parse broadcast message: ${String(raw.data)}`))
    }
  }

  function scheduleReconnect() {
    if (!autoReconnect || reconnectAttempt >= maxAttempts) {
      setState('disconnected')
      return
    }

    setState('reconnecting')
    const delay = getReconnectDelay(reconnectAttempt)
    reconnectAttempt++

    reconnectTimer = setTimeout(() => {
      connectInternal().catch(err => {
        options.onError?.(err instanceof Error ? err : new Error(String(err)))
        scheduleReconnect()
      })
    }, delay)
  }

  async function connectInternal(): Promise<void> {
    setState('connecting')

    const token = await broadcastApi.generateConnectionToken()
    const baseUrl = client.config.baseUrl.replace(/^http/, 'ws')
    const url = `${baseUrl}/v1/relay/broadcast/channels/${options.channelId}/ws?token=${encodeURIComponent(String(token))}`

    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url)

      socket.onopen = () => {
        ws = socket
        reconnectAttempt = 0
        intentionalClose = false
        setState('connected')
        startHeartbeat()
        resolve()
      }

      socket.onmessage = handleMessage

      socket.onerror = () => {
        const error = new Error('WebSocket connection error')
        options.onError?.(error)
        if (state === 'connecting') reject(error)
      }

      socket.onclose = () => {
        ws = null
        clearTimers()

        if (intentionalClose) {
          setState('disconnected')
          return
        }

        scheduleReconnect()
      }
    })
  }

  return {
    get state() {
      return state
    },

    async connect() {
      if (state === 'connected' || state === 'connecting') return
      intentionalClose = false
      reconnectAttempt = 0
      await connectInternal()
    },

    disconnect() {
      intentionalClose = true
      clearTimers()
      reconnectAttempt = 0
      if (ws) {
        ws.close(1000, 'Client disconnect')
        ws = null
      }
      setState('disconnected')
    },

    publish(event: string, data: unknown) {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error('Cannot publish: WebSocket is not connected')
      }
      ws.send(JSON.stringify({ event, data }))
    },

    subscribe<T = unknown>(event: string, listener: BroadcastListener<T>) {
      const sub: Subscription = { event, listener: listener as BroadcastListener }
      subscriptions.add(sub)
      return () => {
        subscriptions.delete(sub)
      }
    },

    subscribeAll<T = unknown>(listener: BroadcastListener<T>) {
      const sub: Subscription = { event: '*', listener: listener as BroadcastListener }
      subscriptions.add(sub)
      return () => {
        subscriptions.delete(sub)
      }
    },
  }
}
