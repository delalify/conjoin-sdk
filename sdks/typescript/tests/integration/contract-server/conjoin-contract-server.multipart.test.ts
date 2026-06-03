import { afterEach, describe, expect, it } from 'vitest'
import type { ConjoinContractServer } from './conjoin-contract-server'
import { startConjoinContractServer } from './conjoin-contract-server'
import { conjoinSuccess } from './response-fixtures'

const EMAIL_SEND_PATH = '/v1/messaging/email/send'
const BOUNDARY = 'conjoinmultipartboundary'

const emailMessageFixture = () => ({
  accepts_replies: true,
  body: 'Hello from contract tests',
  conjoin_account_id: 'account_123',
  conjoin_project_id: 'project_123',
  date_created: '2026-05-16T00:00:00.000Z',
  date_updated: '2026-05-16T01:00:00.000Z',
  from: 'sender@example.com',
  live_mode: false,
  message_id: 'message_123',
  profile_id: 'profile_123',
  sent_at: '2026-05-16T00:00:00.000Z',
  status: 'sent',
  subject: 'Contract email',
  type: 'email',
})

const buildMultipartBody = (parts: Array<[string, string]>): string => {
  const lines: string[] = []

  for (const [name, value] of parts) {
    lines.push(`--${BOUNDARY}`)
    lines.push(`Content-Disposition: form-data; name="${name}"`)
    lines.push('')
    lines.push(value)
  }

  lines.push(`--${BOUNDARY}--`)
  lines.push('')

  return lines.join('\r\n')
}

const sendMultipart = (server: ConjoinContractServer, parts: Array<[string, string]>): Promise<Response> =>
  fetch(`${server.baseUrl}${EMAIL_SEND_PATH}`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ck_test',
      'content-type': `multipart/form-data; boundary=${BOUNDARY}`,
      'messaging-profile-id': 'profile_123',
    },
    body: buildMultipartBody(parts),
  })

describe('Conjoin contract server multipart validation', () => {
  let server: ConjoinContractServer | undefined
  let wasHandlerCalled = false

  afterEach(async () => {
    await server?.stop()
    server = undefined
    wasHandlerCalled = false
  })

  const startWithEmailSend = async (): Promise<ConjoinContractServer> => {
    const started = await startConjoinContractServer()
    started.register({
      method: 'POST',
      path: EMAIL_SEND_PATH,
      handler: () => {
        wasHandlerCalled = true

        return conjoinSuccess(emailMessageFixture(), { requestId: 'cnj_req_multipart' })
      },
    })

    return started
  }

  it('accepts a well-formed multipart send with coerced scalar, object, and array fields', async () => {
    server = await startWithEmailSend()

    const response = await sendMultipart(server, [
      ['subject', 'Hello'],
      ['from', 'sender@example.com'],
      ['to', 'person@example.com'],
      ['to', JSON.stringify({ email: 'other@example.com', name: 'Other' })],
      ['create_conversation', 'true'],
      ['default_placeholders', JSON.stringify({ greeting: 'Hi', count: 3 })],
    ])

    expect(response.status).toBe(200)
    expect(wasHandlerCalled).toBe(true)
  })

  it('rejects a multipart send missing the required subject before the handler runs', async () => {
    server = await startWithEmailSend()

    const response = await sendMultipart(server, [['from', 'sender@example.com']])

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_request_invalid',
      errors: expect.arrayContaining([expect.objectContaining({ message: expect.stringContaining('subject') })]),
    })
    expect(wasHandlerCalled).toBe(false)
  })

  it('rejects a multipart send with a non-boolean scalar value', async () => {
    server = await startWithEmailSend()

    const response = await sendMultipart(server, [
      ['subject', 'Hello'],
      ['create_conversation', 'not-a-boolean'],
    ])

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_request_invalid',
      errors: expect.arrayContaining([
        expect.objectContaining({ path: expect.stringContaining('create_conversation') }),
      ]),
    })
    expect(wasHandlerCalled).toBe(false)
  })

  it('rejects a multipart send with an invalid email format', async () => {
    server = await startWithEmailSend()

    const response = await sendMultipart(server, [
      ['subject', 'Hello'],
      ['from', 'not-an-email'],
    ])

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_request_invalid',
      errors: expect.arrayContaining([expect.objectContaining({ path: expect.stringContaining('from') })]),
    })
    expect(wasHandlerCalled).toBe(false)
  })

  it('rejects a multipart object field carrying malformed JSON', async () => {
    server = await startWithEmailSend()

    const response = await sendMultipart(server, [
      ['subject', 'Hello'],
      ['default_placeholders', '{not valid json'],
    ])

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_request_invalid',
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'body.default_placeholders', message: 'is not valid JSON' }),
      ]),
    })
    expect(wasHandlerCalled).toBe(false)
  })

  it('rejects a malformed JSON element in an object-only array field', async () => {
    server = await startWithEmailSend()

    const response = await sendMultipart(server, [
      ['subject', 'Hello'],
      ['attachments', '{not valid json'],
    ])

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'contract_request_invalid',
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'body.attachments[0]', message: 'is not valid JSON' }),
      ]),
    })
    expect(wasHandlerCalled).toBe(false)
  })
})
