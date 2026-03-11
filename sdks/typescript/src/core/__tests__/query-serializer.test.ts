import { describe, expect, it } from 'vitest'
import { serializeQuery } from '../query-serializer'

describe('serializeQuery', () => {
  it('serializes flat key-value pairs', () => {
    const result = serializeQuery({ limit: 50, status: 'active' })
    expect(result).toBe('limit=50&status=active')
  })

  it('handles nested objects with bracket notation', () => {
    const result = serializeQuery({ cursor: { next: 'abc123' } })
    expect(result).toBe('cursor%5Bnext%5D=abc123')
  })

  it('handles deeply nested objects', () => {
    const result = serializeQuery({ filter: { name: { contains: 'test' } } })
    expect(result).toBe('filter%5Bname%5D%5Bcontains%5D=test')
  })

  it('handles arrays by repeating the key', () => {
    const result = serializeQuery({ tags: ['a', 'b', 'c'] })
    expect(result).toBe('tags=a&tags=b&tags=c')
  })

  it('skips undefined values', () => {
    const result = serializeQuery({ limit: 50, cursor: undefined })
    expect(result).toBe('limit=50')
  })

  it('skips null values', () => {
    const result = serializeQuery({ limit: 50, cursor: null })
    expect(result).toBe('limit=50')
  })

  it('returns empty string for empty object', () => {
    expect(serializeQuery({})).toBe('')
  })

  it('encodes special characters', () => {
    const result = serializeQuery({ search: 'hello world&more' })
    expect(result).toBe('search=hello%20world%26more')
  })

  it('handles boolean values', () => {
    const result = serializeQuery({ active: true, archived: false })
    expect(result).toBe('active=true&archived=false')
  })
})
