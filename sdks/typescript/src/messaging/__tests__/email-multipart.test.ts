import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createConjoinClient } from '../../core/client'
import { CONJOIN_REQUEST_ID_HEADER } from '../../core/request-tracing'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../core/version'
import { createMessaging } from '../index'

const VALID_REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'

function mockResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

describe('messaging email requests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends sendEmail as multipart/form-data without a JSON content type', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(mockResponse({ data: { message_id: 'msg_123' } }))
    const client = createConjoinClient({
      apiKey: 'ck_test_123',
      apiVersion: DEFAULT_API_VERSION,
      conjoinRequestId: VALID_REQUEST_ID,
      retry: { maxRetries: 0, backoffMs: 100 },
    })
    const messaging = createMessaging(client, { profileId: 'msg_profile_123' })

    await messaging.emails.send({
      subject: 'Welcome',
      to: ['user@example.com'],
      html: '<p>Hello</p>',
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    const body = init?.body

    expect(url).toBe('https://api.conjoin.cloud/v1/messaging/email/send')
    expect(init?.method).toBe('POST')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('subject')).toBe('Welcome')
    expect((body as FormData).get('html')).toBe('<p>Hello</p>')
    expect((body as FormData).getAll('to')).toEqual(['user@example.com'])
    expect(headers['Content-Type']).toBeUndefined()
    expect(headers.Authorization).toBe('Bearer ck_test_123')
    expect(headers['X-Conjoin-SDK-Version']).toBe(SDK_VERSION)
    expect(headers['X-Conjoin-API-Version']).toBe(DEFAULT_API_VERSION)
    expect(headers[CONJOIN_REQUEST_ID_HEADER]).toBe(VALID_REQUEST_ID)
    expect(headers['Messaging-Profile-ID']).toBe('msg_profile_123')
  })

  it('keeps JSON email endpoints as application/json requests', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(mockResponse({ success: true, data: [] }))
    const client = createConjoinClient({
      apiKey: 'ck_test_123',
      apiVersion: DEFAULT_API_VERSION,
      retry: { maxRetries: 0, backoffMs: 100 },
    })
    const messaging = createMessaging(client, { profileId: 'msg_profile_123' })

    await messaging.emails.readMessages('msg_123', { status: 'sent' } as never)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    const headers = init?.headers as Record<string, string>

    expect(url).toBe('https://api.conjoin.cloud/v1/messaging/email/messages/msg_123')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"status":"sent"}')
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers.Authorization).toBe('Bearer ck_test_123')
    expect(headers['X-Conjoin-SDK-Version']).toBe(SDK_VERSION)
    expect(headers['X-Conjoin-API-Version']).toBe(DEFAULT_API_VERSION)
    expect(headers['Messaging-Profile-ID']).toBe('msg_profile_123')
  })
})
