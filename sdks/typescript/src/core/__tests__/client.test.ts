import { describe, expect, it } from 'vitest'
import { createConjoinClient } from '../client'
import { DEFAULT_API_VERSION } from '../version'

describe('createConjoinClient', () => {
  it('applies default config values', () => {
    const client = createConjoinClient({ apiKey: 'ck_test_123' })
    expect(client.config.apiKey).toBe('ck_test_123')
    expect(client.config.baseUrl).toBe('https://api.conjoin.cloud')
    expect(client.config.apiVersion).toBe(DEFAULT_API_VERSION)
    expect(client.config.timeout).toBe(30_000)
    expect(client.config.retry.maxRetries).toBe(3)
    expect(client.config.retry.backoffMs).toBe(500)
  })

  it('accepts custom config values', () => {
    const client = createConjoinClient({
      apiKey: 'ck_live_456',
      baseUrl: 'https://custom.api.conjoin.cloud',
      apiVersion: '2026-06-15',
      timeout: 10_000,
      retry: { maxRetries: 5, backoffMs: 1000 },
    })
    expect(client.config.baseUrl).toBe('https://custom.api.conjoin.cloud')
    expect(client.config.apiVersion).toBe('2026-06-15')
    expect(client.config.timeout).toBe(10_000)
    expect(client.config.retry.maxRetries).toBe(5)
    expect(client.config.retry.backoffMs).toBe(1000)
  })

  it('freezes the config object', () => {
    const client = createConjoinClient({ apiKey: 'ck_test_123' })
    expect(Object.isFrozen(client.config)).toBe(true)
    expect(Object.isFrozen(client.config.retry)).toBe(true)
  })

  it('exposes fetch, fetchList, and fetchRaw methods', () => {
    const client = createConjoinClient({ apiKey: 'ck_test_123' })
    expect(typeof client.fetch).toBe('function')
    expect(typeof client.fetchList).toBe('function')
    expect(typeof client.fetchRaw).toBe('function')
  })
})
