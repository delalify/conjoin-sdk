import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ConjoinClient, ResolvedConfig } from '../../core/types'

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

type ProfileClientProbe = {
  fetchWithResponse: () => Promise<unknown>
  fetchListWithResponse: () => Promise<unknown>
  fetchRaw: () => Promise<unknown>
  withRequestTrace: () => Promise<unknown>
}

afterEach(() => {
  vi.doUnmock('../../generated/modules/messaging-email')
  vi.resetModules()
})

describe('createMessaging profiled client wrapper', () => {
  it('injects the profile header into response, raw, and traced client calls', async () => {
    vi.doMock('../../generated/modules/messaging-email', () => ({
      createMessagingEmails: (client: ConjoinClient): ProfileClientProbe => ({
        fetchListWithResponse: () =>
          client.fetchListWithResponse('messaging/custom/list-response', {
            headers: { Existing: 'yes' },
          }),
        fetchRaw: () =>
          client.fetchRaw('messaging/custom/raw', {
            headers: { Existing: 'yes' },
          }),
        fetchWithResponse: () =>
          client.fetchWithResponse('messaging/custom/response', {
            headers: { Existing: 'yes' },
          }),
        withRequestTrace: () =>
          client.withRequestTrace(
            (scopedClient, requestId) =>
              scopedClient.fetchRaw(`messaging/custom/trace/${requestId}`, {
                headers: { Existing: 'yes' },
              }),
            { requestId: 'req_456' },
          ),
      }),
    }))

    const { createMessaging } = await import('../index')
    const client = createMockClient()
    const messaging = createMessaging(client, { profileId: 'msg_profile_123' })
    const emails = messaging.emails as unknown as ProfileClientProbe

    await emails.fetchWithResponse()
    await emails.fetchListWithResponse()
    await emails.fetchRaw()
    await emails.withRequestTrace()

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
    expect(client.withRequestTrace).toHaveBeenCalledWith(expect.any(Function), { requestId: 'req_456' })
  })
})
