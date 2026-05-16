import { describe, expect, it } from 'vitest'
import { createConjoinServer } from '../index'

const VALID_REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'

describe('createConjoinServer', () => {
  it('uses an explicit Conjoin request ID when provided', () => {
    const client = createConjoinServer({
      apiKey: 'sk_test_123',
      conjoinRequestId: VALID_REQUEST_ID,
    })

    expect(client.config.conjoinRequestId).toBe(VALID_REQUEST_ID)
  })

  it('propagates a valid incoming Conjoin request ID from request headers', () => {
    const client = createConjoinServer({
      apiKey: 'sk_test_123',
      request: {
        headers: {
          'conjoin-request-id': VALID_REQUEST_ID,
        },
      },
    })

    expect(client.config.conjoinRequestId).toBe(VALID_REQUEST_ID)
  })

  it('ignores invalid incoming Conjoin request IDs', () => {
    const client = createConjoinServer({
      apiKey: 'sk_test_123',
      request: {
        headers: {
          'conjoin-request-id': 'not-valid',
        },
      },
    })

    expect(client.config.conjoinRequestId).toBeUndefined()
  })
})
