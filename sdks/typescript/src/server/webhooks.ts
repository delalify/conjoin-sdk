import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyWebhook(payload: string | Buffer, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  const expected = hmac.digest('hex')

  if (signature.length !== expected.length) return false

  const sigBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  if (sigBuffer.length !== expectedBuffer.length) return false

  return timingSafeEqual(sigBuffer, expectedBuffer)
}
