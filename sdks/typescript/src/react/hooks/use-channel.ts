import { useCallback, useEffect, useRef, useState } from 'react'
import { createConjoinClient } from '../../core/client'
import { type BroadcastConnection, createBroadcastConnection } from '../../relay/broadcast'
import type { BroadcastMessage, ConnectionState } from '../../relay/types'
import { useConjoinClient } from './internal/use-conjoin-client'

type PresenceMember = {
  id: string
  name?: string
  avatar_url?: string
}

type UseChannelOptions<TResolve extends 'conjoin-auth' | ((ids: string[]) => Promise<PresenceMember[]>) | undefined> = {
  channelId: string
  autoConnect?: boolean
  maxMessages?: number
  resolvePresence?: TResolve
}

type UseChannelReturn<TResolve> = {
  status: ConnectionState
  error: Error | null
  publish: (event: string, data: unknown) => void
  messages: BroadcastMessage[]
  members: TResolve extends undefined ? string[] : PresenceMember[]
  unsubscribe: () => void
}

const DEFAULT_MAX_MESSAGES = 200

export function useChannel<
  TResolve extends 'conjoin-auth' | ((ids: string[]) => Promise<PresenceMember[]>) | undefined = undefined,
>(options: UseChannelOptions<TResolve>): UseChannelReturn<TResolve> {
  const { channelId, autoConnect = true, maxMessages = DEFAULT_MAX_MESSAGES, resolvePresence } = options
  const { client, sdkConfig } = useConjoinClient()

  const [status, setStatus] = useState<ConnectionState>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [messages, setMessages] = useState<BroadcastMessage[]>([])
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [resolvedMembers, setResolvedMembers] = useState<PresenceMember[]>([])

  const connectionRef = useRef<BroadcastConnection | null>(null)

  useEffect(() => {
    const relayUrl = sdkConfig?.relay.url
    const relayBaseUrl = relayUrl ? relayUrl.replace(/^ws/, 'http') : client.config.baseUrl

    const relayClient =
      relayBaseUrl !== client.config.baseUrl
        ? createConjoinClient({
            publishableKey: client.config.publishableKey,
            apiKey: client.config.apiKey,
            baseUrl: relayBaseUrl,
          })
        : client

    const connection = createBroadcastConnection(relayClient, {
      channelId,
      onStateChange: setStatus,
      onError: setError,
    })

    connectionRef.current = connection

    const unsubAll = connection.subscribeAll((message: BroadcastMessage) => {
      if (message.event === 'presence:join' && message.sender) {
        const senderId = message.sender
        setMemberIds(prev => (prev.includes(senderId) ? prev : [...prev, senderId]))
      } else if (message.event === 'presence:leave' && message.sender) {
        const senderId = message.sender
        setMemberIds(prev => prev.filter(id => id !== senderId))
      } else {
        setMessages(prev => {
          const next = [...prev, message]
          return next.length > maxMessages ? next.slice(-maxMessages) : next
        })
      }
    })

    if (autoConnect) {
      connection.connect().catch(setError)
    }

    return () => {
      unsubAll()
      connection.disconnect()
      connectionRef.current = null
    }
  }, [client, channelId, sdkConfig?.relay.url, autoConnect, maxMessages])

  useEffect(() => {
    if (!resolvePresence || memberIds.length === 0) return

    if (resolvePresence === 'conjoin-auth') {
      const authDomain = sdkConfig?.auth.domain
      if (!authDomain) return

      fetch(`https://${authDomain}/v1/auth/accounts/batch`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: memberIds }),
      })
        .then(r => {
          if (!r.ok) throw new Error('Failed to resolve presence')
          return r.json()
        })
        .then(body => {
          setResolvedMembers((body as { data: PresenceMember[] }).data)
        })
        .catch(() => {})
    } else if (typeof resolvePresence === 'function') {
      resolvePresence(memberIds)
        .then(setResolvedMembers)
        .catch(() => {})
    }
  }, [memberIds, resolvePresence, sdkConfig?.auth.domain])

  const publish = useCallback((event: string, data: unknown) => {
    connectionRef.current?.publish(event, data)
  }, [])

  const unsubscribe = useCallback(() => {
    connectionRef.current?.disconnect()
  }, [])

  const members = (resolvePresence ? resolvedMembers : memberIds) as UseChannelReturn<TResolve>['members']

  return { status, error, publish, messages, members, unsubscribe }
}
