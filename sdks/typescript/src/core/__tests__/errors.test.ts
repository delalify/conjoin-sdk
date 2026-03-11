import { describe, expect, it } from 'vitest'
import {
  ConjoinAuthenticationError,
  ConjoinError,
  ConjoinNetworkError,
  ConjoinRateLimitError,
  ConjoinTimeoutError,
  ConjoinValidationError,
} from '../errors'

describe('ConjoinError', () => {
  it('stores status, code, and requestId', () => {
    const err = new ConjoinError('something went wrong', 500, 'api_error', 'req_123')
    expect(err.message).toBe('something went wrong')
    expect(err.status).toBe(500)
    expect(err.code).toBe('api_error')
    expect(err.requestId).toBe('req_123')
    expect(err.name).toBe('ConjoinError')
  })

  it('is instanceof Error', () => {
    const err = new ConjoinError('fail', 500, 'api_error')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ConjoinError)
  })
})

describe('ConjoinAuthenticationError', () => {
  it('sets status 401 and correct code', () => {
    const err = new ConjoinAuthenticationError('invalid key', 'req_456')
    expect(err.status).toBe(401)
    expect(err.code).toBe('authentication_error')
    expect(err.requestId).toBe('req_456')
    expect(err.name).toBe('ConjoinAuthenticationError')
  })

  it('is instanceof ConjoinError', () => {
    const err = new ConjoinAuthenticationError('invalid key')
    expect(err).toBeInstanceOf(ConjoinError)
    expect(err).toBeInstanceOf(ConjoinAuthenticationError)
  })
})

describe('ConjoinRateLimitError', () => {
  it('stores retryAfter', () => {
    const err = new ConjoinRateLimitError('too many requests', 30, 'req_789')
    expect(err.status).toBe(429)
    expect(err.retryAfter).toBe(30)
    expect(err.code).toBe('rate_limit_error')
    expect(err.name).toBe('ConjoinRateLimitError')
  })

  it('is instanceof ConjoinError', () => {
    const err = new ConjoinRateLimitError('slow down')
    expect(err).toBeInstanceOf(ConjoinError)
  })
})

describe('ConjoinValidationError', () => {
  it('stores field errors', () => {
    const errors = [
      { message: 'required', path: 'name' },
      { message: 'invalid format', path: 'email' },
    ]
    const err = new ConjoinValidationError('validation failed', 422, errors, 'req_abc')
    expect(err.status).toBe(422)
    expect(err.errors).toEqual(errors)
    expect(err.code).toBe('validation_error')
    expect(err.name).toBe('ConjoinValidationError')
  })

  it('is instanceof ConjoinError', () => {
    const err = new ConjoinValidationError('bad input', 400, [])
    expect(err).toBeInstanceOf(ConjoinError)
  })
})

describe('ConjoinNetworkError', () => {
  it('sets status 0 and network_error code', () => {
    const err = new ConjoinNetworkError('fetch failed')
    expect(err.status).toBe(0)
    expect(err.code).toBe('network_error')
    expect(err.name).toBe('ConjoinNetworkError')
  })

  it('is instanceof ConjoinError', () => {
    const err = new ConjoinNetworkError('offline')
    expect(err).toBeInstanceOf(ConjoinError)
  })
})

describe('ConjoinTimeoutError', () => {
  it('sets status 0 and timeout_error code', () => {
    const err = new ConjoinTimeoutError('timed out')
    expect(err.status).toBe(0)
    expect(err.code).toBe('timeout_error')
    expect(err.name).toBe('ConjoinTimeoutError')
  })

  it('is instanceof ConjoinError', () => {
    const err = new ConjoinTimeoutError('too slow')
    expect(err).toBeInstanceOf(ConjoinError)
  })
})
