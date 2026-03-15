export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export type BroadcastConnectionOptions = {
  channelId: string
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectBaseDelay?: number
  reconnectMaxDelay?: number
  heartbeatInterval?: number
  onStateChange?: (state: ConnectionState) => void
  onError?: (error: Error) => void
}

export type BroadcastMessage<T = unknown> = {
  event: string
  data: T
  timestamp?: number
  sender?: string
}

export type BroadcastListener<T = unknown> = (message: BroadcastMessage<T>) => void
