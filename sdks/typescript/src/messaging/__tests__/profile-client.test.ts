import { describe, expect, it, vi } from 'vitest'
import type { ConjoinClient, ResolvedConfig } from '../../core/types'
import { createMessagingProfiledClient } from '../profile-client'

const config: ResolvedConfig = Object.freeze({
  apiKey: 'ck_test_123',
  apiVersion: '2026-03-31',
  baseUrl: 'https://api.conjoin.cloud',
  retry: Object.freeze({ backoffMs: 100, maxRetries: 0 }),
  timeout: 30_000,
})

const createMockClient = (): ConjoinClient => ({
  config,
  fetch: vi.fn().mockResolvedValue({}),
  fetchList: vi.fn().mockResolvedValue({ data: [], success: true }),
  fetchListWithResponse: vi.fn().mockResolvedValue({ data: { data: [], success: true }, metadata: {} }),
  fetchRaw: vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  fetchWithResponse: vi.fn().mockResolvedValue({ data: {}, metadata: {} }),
  withRequestTrace: vi.fn(async (callback, options) => callback(createMockClient(), options?.requestId ?? 'req_123')),
})

describe('createMessagingProfiledClient', () => {
  it('injects the configured profile header into fetch calls', async () => {
    const client = createMockClient()
    const profiled = createMessagingProfiledClient(client, 'msg_profile_123')

    await profiled.fetch('messaging/email/send', {
      body: { to: 'user@example.com' },
      headers: { Existing: 'yes' },
      method: 'POST',
    })
    await profiled.fetchList('messaging/email/messages/msg_123')

    expect(client.fetch).toHaveBeenCalledWith('messaging/email/send', {
      body: { to: 'user@example.com' },
      headers: {
        Existing: 'yes',
        'Messaging-Profile-ID': 'msg_profile_123',
      },
      method: 'POST',
    })
    expect(client.fetchList).toHaveBeenCalledWith('messaging/email/messages/msg_123', {
      headers: { 'Messaging-Profile-ID': 'msg_profile_123' },
    })
  })

  it('injects the configured profile header into response and raw calls', async () => {
    const client = createMockClient()
    const profiled = createMessagingProfiledClient(client, 'msg_profile_123')

    await profiled.fetchWithResponse('messaging/custom/response', { headers: { Existing: 'yes' } })
    await profiled.fetchListWithResponse('messaging/custom/list-response', { headers: { Existing: 'yes' } })
    await profiled.fetchRaw('messaging/custom/raw', { headers: { Existing: 'yes' } })

    expect(client.fetchWithResponse).toHaveBeenCalledWith('messaging/custom/response', {
      headers: {
        Existing: 'yes',
        'Messaging-Profile-ID': 'msg_profile_123',
      },
    })
    expect(client.fetchListWithResponse).toHaveBeenCalledWith('messaging/custom/list-response', {
      headers: {
        Existing: 'yes',
        'Messaging-Profile-ID': 'msg_profile_123',
      },
    })
    expect(client.fetchRaw).toHaveBeenCalledWith('messaging/custom/raw', {
      headers: {
        Existing: 'yes',
        'Messaging-Profile-ID': 'msg_profile_123',
      },
    })
  })

  it('keeps the profile header inside request trace scopes', async () => {
    const client = createMockClient()
    const profiled = createMessagingProfiledClient(client, 'msg_profile_123')

    await profiled.withRequestTrace(
      (scopedClient, requestId) =>
        scopedClient.fetchRaw(`messaging/custom/trace/${requestId}`, {
          headers: { Existing: 'yes' },
        }),
      { requestId: 'req_456' },
    )

    expect(client.withRequestTrace).toHaveBeenCalledWith(expect.any(Function), { requestId: 'req_456' })
  })
})
