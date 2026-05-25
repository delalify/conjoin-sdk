import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConjoinClient, ResolvedConfig } from '../../core/types'
import { DEFAULT_API_VERSION } from '../../core/version'
import { createBroadcastConnection } from '../broadcast'
import type { BroadcastMessage, ConnectionState } from '../types'

const config: ResolvedConfig = Object.freeze({
  apiKey: 'ck_test_123',
  apiVersion: DEFAULT_API_VERSION,
  baseUrl: 'https://api.conjoin.cloud',
  retry: Object.freeze({ backoffMs: 100, maxRetries: 0 }),
  timeout: 30_000,
})

const createMockClient = (token = 'relay_token_123'): ConjoinClient => ({
  config,
  fetch: vi.fn().mockResolvedValue(token),
  fetchList: vi.fn(),
  fetchListWithResponse: vi.fn(),
  fetchRaw: vi.fn(),
  fetchWithResponse: vi.fn(),
  withRequestTrace: vi.fn(),
})

const createFailingClient = (error: unknown): ConjoinClient => ({
  config,
  fetch: vi.fn().mockRejectedValue(error),
  fetchList: vi.fn(),
  fetchListWithResponse: vi.fn(),
  fetchRaw: vi.fn(),
  fetchWithResponse: vi.fn(),
  withRequestTrace: vi.fn(),
})

type WebSocketHandler<TEvent> = (event: TEvent) => void

class FakeWebSocket {
  static readonly OPEN = 1
  static readonly instances: FakeWebSocket[] = []

  readonly close = vi.fn((code?: number, reason?: string) => {
    this.closeCode = code
    this.closeReason = reason
    this.readyState = 3
    this.onclose?.({} as CloseEvent)
  })
  readonly send = vi.fn()
  readonly url: string

  closeCode?: number
  closeReason?: string
  onclose: WebSocketHandler<CloseEvent> | null = null
  onerror: WebSocketHandler<Event> | null = null
  onmessage: WebSocketHandler<MessageEvent> | null = null
  onopen: WebSocketHandler<Event> | null = null
  readyState = 0

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN
    this.onopen?.({} as Event)
  }

  receive(data: string): void {
    this.onmessage?.({ data } as MessageEvent)
  }

  fail(): void {
    this.onerror?.({} as Event)
  }

  closeFromServer(): void {
    this.readyState = 3
    this.onclose?.({} as CloseEvent)
  }
}

beforeEach(() => {
  FakeWebSocket.instances.length = 0
  vi.stubGlobal('WebSocket', FakeWebSocket)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const waitForSocket = async (index = 0): Promise<FakeWebSocket> => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const socket = FakeWebSocket.instances[index]
    if (socket) return socket
    await Promise.resolve()
  }

  throw new Error(`WebSocket instance ${index} was not created`)
}

const connectAndOpen = async (
  connection: ReturnType<typeof createBroadcastConnection>,
  index = 0,
): Promise<FakeWebSocket> => {
  const connectPromise = connection.connect()
  const socket = await waitForSocket(index)
  socket.open()
  await connectPromise

  return socket
}

describe('createBroadcastConnection', () => {
  it('connects with a generated token and emits state changes', async () => {
    const states: ConnectionState[] = []
    const client = createMockClient('relay token')
    const connection = createBroadcastConnection(client, {
      channelId: 'channel_123',
      onStateChange: state => states.push(state),
    })

    const connectPromise = connection.connect()
    const socket = await waitForSocket()

    expect(connection.state).toBe('connecting')
    expect(socket?.url).toBe('wss://api.conjoin.cloud/v1/relay/broadcast/channels/channel_123/ws?token=relay%20token')

    socket?.open()
    await connectPromise

    expect(client.fetch).toHaveBeenCalledWith('relay/broadcast/auth', { method: 'POST' })
    expect(connection.state).toBe('connected')
    expect(states).toEqual(['connecting', 'connected'])
  })

  it('publishes messages and sends heartbeat pings while connected', async () => {
    const client = createMockClient()
    const connection = createBroadcastConnection(client, {
      channelId: 'channel_123',
      heartbeatInterval: 25,
    })

    const socket = await connectAndOpen(connection)

    connection.publish('message.created', { id: 'msg_123' })
    vi.advanceTimersByTime(25)

    expect(socket?.send).toHaveBeenNthCalledWith(
      1,
      JSON.stringify({ event: 'message.created', data: { id: 'msg_123' } }),
    )
    expect(socket?.send).toHaveBeenNthCalledWith(2, JSON.stringify({ type: 'ping' }))
  })

  it('dispatches matching broadcast messages and ignores pong messages', async () => {
    const client = createMockClient()
    const onMessage = vi.fn()
    const onAnyMessage = vi.fn()
    const connection = createBroadcastConnection(client, { channelId: 'channel_123' })

    const unsubscribe = connection.subscribe('message.created', onMessage)
    connection.subscribeAll(onAnyMessage)

    const socket = await connectAndOpen(connection)

    const message: BroadcastMessage = {
      data: { id: 'msg_123' },
      event: 'message.created',
    }

    socket?.receive(JSON.stringify({ type: 'pong' }))
    socket?.receive(JSON.stringify({ data: { id: 'other' }, event: 'message.updated' }))
    socket?.receive(JSON.stringify(message))
    unsubscribe()
    socket?.receive(JSON.stringify(message))

    expect(onMessage).toHaveBeenCalledOnce()
    expect(onMessage).toHaveBeenCalledWith(message)
    expect(onAnyMessage).toHaveBeenCalledTimes(3)
  })

  it('reports malformed broadcast messages through onError', async () => {
    const onError = vi.fn()
    const connection = createBroadcastConnection(createMockClient(), {
      channelId: 'channel_123',
      onError,
    })

    const socket = await connectAndOpen(connection)

    socket?.receive('not-json')

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Failed to parse broadcast message: not-json' }),
    )
  })

  it('rejects connection errors during initial connect', async () => {
    const onError = vi.fn()
    const connection = createBroadcastConnection(createMockClient(), {
      channelId: 'channel_123',
      onError,
    })

    const connectPromise = connection.connect()
    const socket = await waitForSocket()
    socket.fail()

    await expect(connectPromise).rejects.toThrow('WebSocket connection error')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'WebSocket connection error' }))
  })

  it('reports socket errors after the connection is already open', async () => {
    const onError = vi.fn()
    const connection = createBroadcastConnection(createMockClient(), {
      channelId: 'channel_123',
      onError,
    })
    const socket = await connectAndOpen(connection)

    socket.fail()

    expect(connection.state).toBe('connected')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'WebSocket connection error' }))
  })

  it('reconnects after an unintentional close', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const states: ConnectionState[] = []
    const connection = createBroadcastConnection(createMockClient(), {
      channelId: 'channel_123',
      heartbeatInterval: 100,
      onStateChange: state => states.push(state),
      reconnectBaseDelay: 10,
      reconnectMaxDelay: 10,
    })

    const socket = await connectAndOpen(connection)

    socket.closeFromServer()
    expect(connection.state).toBe('reconnecting')

    await vi.advanceTimersByTimeAsync(10)
    const nextSocket = await waitForSocket(1)
    nextSocket.open()

    expect(connection.state).toBe('connected')
    expect(states).toContain('reconnecting')
  })

  it('reports reconnect failures and keeps retrying', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const onError = vi.fn()
    const client = createMockClient()
    vi.mocked(client.fetch).mockResolvedValueOnce('first_token').mockRejectedValueOnce('token failure')

    const connection = createBroadcastConnection(client, {
      channelId: 'channel_123',
      onError,
      reconnectBaseDelay: 10,
      reconnectMaxDelay: 10,
    })

    const socket = await connectAndOpen(connection)

    socket.closeFromServer()
    await vi.advanceTimersByTimeAsync(10)

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'token failure' }))
    expect(connection.state).toBe('reconnecting')
  })

  it('reports reconnect Error instances and keeps retrying', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const onError = vi.fn()
    const client = createMockClient()
    vi.mocked(client.fetch).mockResolvedValueOnce('first_token').mockRejectedValueOnce(new Error('token failed'))

    const connection = createBroadcastConnection(client, {
      channelId: 'channel_123',
      onError,
      reconnectBaseDelay: 10,
      reconnectMaxDelay: 10,
    })

    const socket = await connectAndOpen(connection)

    socket.closeFromServer()
    await vi.advanceTimersByTimeAsync(10)

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'token failed' }))
  })

  it('stops reconnecting after the configured attempt limit', async () => {
    const connection = createBroadcastConnection(createMockClient(), {
      channelId: 'channel_123',
      maxReconnectAttempts: 0,
    })

    const socket = await connectAndOpen(connection)

    socket.closeFromServer()

    expect(connection.state).toBe('disconnected')
  })

  it('does not reconnect when auto reconnect is disabled', async () => {
    const connection = createBroadcastConnection(createMockClient(), {
      autoReconnect: false,
      channelId: 'channel_123',
    })

    const socket = await connectAndOpen(connection)
    socket.closeFromServer()

    expect(connection.state).toBe('disconnected')
  })

  it('clears pending reconnect timers on disconnect', async () => {
    const connection = createBroadcastConnection(createMockClient(), {
      channelId: 'channel_123',
      reconnectBaseDelay: 10,
    })

    const socket = await connectAndOpen(connection)
    socket.closeFromServer()

    connection.disconnect()
    await vi.advanceTimersByTimeAsync(10)

    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('does not reconnect after an intentional disconnect', async () => {
    const connection = createBroadcastConnection(createMockClient(), {
      channelId: 'channel_123',
      reconnectBaseDelay: 10,
    })

    const socket = await connectAndOpen(connection)

    connection.disconnect()

    expect(connection.state).toBe('disconnected')
    expect(socket?.close).toHaveBeenCalledWith(1000, 'Client disconnect')
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('does not send heartbeat pings when the socket is no longer open', async () => {
    const connection = createBroadcastConnection(createMockClient(), {
      channelId: 'channel_123',
      heartbeatInterval: 25,
    })
    const socket = await connectAndOpen(connection)

    socket.readyState = 0
    vi.advanceTimersByTime(25)

    expect(socket.send).not.toHaveBeenCalled()
  })

  it('does not publish when disconnected and ignores duplicate connect calls', async () => {
    const connection = createBroadcastConnection(createMockClient(), { channelId: 'channel_123' })

    expect(() => connection.publish('event', {})).toThrow('Cannot publish')

    const connectPromise = connection.connect()
    const duplicateConnectPromise = connection.connect()

    const socket = await waitForSocket()
    socket.open()
    await Promise.all([connectPromise, duplicateConnectPromise])

    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('rejects token generation failures before opening a socket', async () => {
    const connection = createBroadcastConnection(createFailingClient(new Error('token failed')), {
      channelId: 'channel_123',
    })

    await expect(connection.connect()).rejects.toThrow('token failed')
    expect(FakeWebSocket.instances).toHaveLength(0)
  })

  it('allows subscribeAll listeners to unsubscribe', async () => {
    const listener = vi.fn()
    const connection = createBroadcastConnection(createMockClient(), { channelId: 'channel_123' })
    const unsubscribe = connection.subscribeAll(listener)
    const socket = await connectAndOpen(connection)

    unsubscribe()
    socket.receive(JSON.stringify({ data: {}, event: 'message.created' }))

    expect(listener).not.toHaveBeenCalled()
  })
})
