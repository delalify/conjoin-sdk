import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CONJOIN_REQUEST_ID_HEADER,
  generateConjoinRequestId,
  getConjoinRequestIdFromHeaders,
  isValidConjoinRequestId,
  resolveConjoinRequestId,
} from '../request-tracing'

const VALID_REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'

const mockRandomBytes = (values: Uint8Array): void => {
  vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
    if (!(array instanceof Uint8Array)) {
      throw new Error('Expected Uint8Array random byte buffer')
    }

    array.set(values)

    return array as T
  })
}

describe('request tracing', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generates valid Conjoin request IDs', () => {
    const requestId = generateConjoinRequestId()

    expect(isValidConjoinRequestId(requestId)).toBe(true)
  })

  it('generates monotonic UUIDv7 request IDs within the same millisecond', () => {
    vi.spyOn(Date, 'now').mockReturnValue(2_000_000_000_000)
    mockRandomBytes(Uint8Array.from({ length: 16 }, (_value, index) => index))

    const firstRequestId = generateConjoinRequestId()
    const secondRequestId = generateConjoinRequestId()

    expect(firstRequestId).toBe('cnj_req_01d1a94a-2000-7030-9c20-260b0c0d0e0f')
    expect(secondRequestId).toBe('cnj_req_01d1a94a-2000-7030-9c20-2a0b0c0d0e0f')
    expect(firstRequestId < secondRequestId).toBe(true)
  })

  it('preserves valid request IDs and replaces invalid values', () => {
    expect(resolveConjoinRequestId(VALID_REQUEST_ID)).toBe(VALID_REQUEST_ID)
    expect(resolveConjoinRequestId('not-valid')).not.toBe('not-valid')
    expect(isValidConjoinRequestId(resolveConjoinRequestId('not-valid'))).toBe(true)
  })

  it('reads a valid request ID from Headers', () => {
    const headers = new Headers({ [CONJOIN_REQUEST_ID_HEADER]: VALID_REQUEST_ID })

    expect(getConjoinRequestIdFromHeaders(headers)).toBe(VALID_REQUEST_ID)
  })

  it('ignores invalid request IDs from plain header maps', () => {
    expect(getConjoinRequestIdFromHeaders({ [CONJOIN_REQUEST_ID_HEADER]: 'not-valid' })).toBeUndefined()
  })
})
