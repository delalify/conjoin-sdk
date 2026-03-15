import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyWebhook } from '../webhooks'

function computeSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

const TEST_SECRET = 'whsec_test_secret_key_12345'
const TEST_PAYLOAD = JSON.stringify({
  type: 'account.created',
  data: { id: 'acc_123', email: 'user@example.com' },
})

describe('verifyWebhook', () => {
  it('returns true for valid signature', () => {
    const signature = computeSignature(TEST_PAYLOAD, TEST_SECRET)
    expect(verifyWebhook(TEST_PAYLOAD, signature, TEST_SECRET)).toBe(true)
  })

  it('returns false for invalid signature', () => {
    const badSignature = 'a'.repeat(64)
    expect(verifyWebhook(TEST_PAYLOAD, badSignature, TEST_SECRET)).toBe(false)
  })

  it('returns false for wrong secret', () => {
    const signature = computeSignature(TEST_PAYLOAD, TEST_SECRET)
    expect(verifyWebhook(TEST_PAYLOAD, signature, 'wrong_secret')).toBe(false)
  })

  it('returns false for tampered payload', () => {
    const signature = computeSignature(TEST_PAYLOAD, TEST_SECRET)
    const tampered = JSON.stringify({ type: 'account.deleted', data: { id: 'acc_123' } })
    expect(verifyWebhook(tampered, signature, TEST_SECRET)).toBe(false)
  })

  it('handles different-length signatures', () => {
    expect(verifyWebhook(TEST_PAYLOAD, 'tooshort', TEST_SECRET)).toBe(false)
  })

  it('handles Buffer payloads', () => {
    const buffer = Buffer.from(TEST_PAYLOAD)
    const signature = computeSignature(TEST_PAYLOAD, TEST_SECRET)
    expect(verifyWebhook(buffer, signature, TEST_SECRET)).toBe(true)
  })

  it('rejects empty signature', () => {
    expect(verifyWebhook(TEST_PAYLOAD, '', TEST_SECRET)).toBe(false)
  })

  it('produces consistent results for the same inputs', () => {
    const signature = computeSignature(TEST_PAYLOAD, TEST_SECRET)
    const result1 = verifyWebhook(TEST_PAYLOAD, signature, TEST_SECRET)
    const result2 = verifyWebhook(TEST_PAYLOAD, signature, TEST_SECRET)
    expect(result1).toBe(true)
    expect(result2).toBe(true)
  })
})
