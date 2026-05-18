import { describe, expect, it, vi } from 'vitest'
import type { ConjoinClient, ResolvedConfig } from '../../core/types'
import { createMessaging } from '../index'

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
  fetchListWithResponse: vi.fn(),
  fetchRaw: vi.fn(),
  fetchWithResponse: vi.fn(),
  withRequestTrace: vi.fn(async callback => callback(createMockClient(), 'req_123')),
})

describe('createMessaging', () => {
  it('injects the configured messaging profile header into profiled resources', async () => {
    const client = createMockClient()
    const messaging = createMessaging(client, { profileId: 'msg_profile_123' })

    await messaging.emails.send({ to: 'user@example.com' } as never)
    await messaging.emails.readMessages('msg_123', {} as never)

    expect(client.fetch).toHaveBeenCalledWith('messaging/email/send', {
      method: 'POST',
      body: { to: 'user@example.com' },
      contentType: 'multipart/form-data',
      headers: { 'Messaging-Profile-ID': 'msg_profile_123' },
    })
    expect(client.fetchList).toHaveBeenCalledWith('messaging/email/messages/msg_123', {
      method: 'POST',
      body: {},
      headers: { 'Messaging-Profile-ID': 'msg_profile_123' },
    })
  })

  it('does not inject the messaging profile header into profile management resources', async () => {
    const client = createMockClient()
    const messaging = createMessaging(client, { profileId: 'msg_profile_123' })

    await messaging.profiles.read('msg_profile_123')

    expect(client.fetch).toHaveBeenCalledWith('messaging/profiles/msg_profile_123')
  })
})
