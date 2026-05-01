import { createHmac, timingSafeEqual } from 'node:crypto'

const HEX_PATTERN = /^[0-9a-f]+$/i

export function verifyWebhook(payload: string | Buffer, signature: string, secret: string): boolean {
  if (!signature || !HEX_PATTERN.test(signature)) return false

  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  const expected = hmac.digest('hex')

  if (signature.length !== expected.length) return false

  const sigBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  if (sigBuffer.length !== expectedBuffer.length) return false

  return timingSafeEqual(sigBuffer, expectedBuffer)
}
