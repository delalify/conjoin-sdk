import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConjoinStorageError } from '../../core/errors'
import type { ConjoinClient, ResolvedConfig } from '../../core/types'
import { createStorageDownloader } from '../download'

const config: ResolvedConfig = Object.freeze({
  apiKey: 'ck_test_123',
  baseUrl: 'https://api.conjoin.cloud',
  apiVersion: '2026-03-31',
  timeout: 30_000,
  retry: Object.freeze({ maxRetries: 0, backoffMs: 100 }),
})

function createMockClient(fetchImpl?: ConjoinClient['fetch']): ConjoinClient {
  return {
    config,
    fetch: fetchImpl ?? vi.fn(),
    fetchList: vi.fn(),
    fetchRaw: vi.fn(),
  }
}

const fetchSpy = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchSpy)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createStorageDownloader', () => {
  describe('successful download', () => {
    it('fetches from the signed URL with returned headers', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          url: 'https://storage.googleapis.com/bucket/photos/cat.jpg?signature=abc',
          headers: { 'x-custom-header': 'value' },
        }),
      )

      fetchSpy.mockResolvedValue(new Response('file contents', { status: 200 }))

      const downloader = createStorageDownloader(client)
      const result = await downloader.download({
        container: 'my-bucket',
        path: 'photos/cat.jpg',
      })

      expect(client.fetch).toHaveBeenCalledWith('storage/storage-object/download/signed-url', {
        method: 'POST',
        body: {
          container_name_or_id: 'my-bucket',
          path: 'photos/cat.jpg',
        },
      })

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://storage.googleapis.com/bucket/photos/cat.jpg?signature=abc',
        expect.objectContaining({
          headers: { 'x-custom-header': 'value' },
        }),
      )

      expect(result.url).toBe('https://storage.googleapis.com/bucket/photos/cat.jpg?signature=abc')
    })

    it('downloads without extra headers when none are returned', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          url: 'https://storage.googleapis.com/bucket/file.txt',
          headers: undefined,
        }),
      )

      fetchSpy.mockResolvedValue(new Response('hello', { status: 200 }))

      const downloader = createStorageDownloader(client)
      await downloader.download({ container: 'bucket', path: 'file.txt' })

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://storage.googleapis.com/bucket/file.txt',
        expect.objectContaining({ headers: undefined }),
      )
    })
  })

  describe('DownloadResult accessors', () => {
    it('provides blob(), arrayBuffer(), stream(), and text() from the response', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          url: 'https://storage.googleapis.com/bucket/file.txt',
        }),
      )

      fetchSpy.mockResolvedValue(new Response('file content here', { status: 200 }))

      const downloader = createStorageDownloader(client)
      const result = await downloader.download({ container: 'bucket', path: 'file.txt' })

      expect(result.response).toBeInstanceOf(Response)
      expect(result.url).toBe('https://storage.googleapis.com/bucket/file.txt')

      const text = await result.text()
      expect(text).toBe('file content here')
    })

    it('returns blob from the response', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          url: 'https://storage.example.com/file.bin',
        }),
      )

      fetchSpy.mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200 }))

      const downloader = createStorageDownloader(client)
      const result = await downloader.download({ container: 'bucket', path: 'file.bin' })

      const blob = await result.blob()
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBe(3)
    })

    it('returns arrayBuffer from the response', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          url: 'https://storage.example.com/file.bin',
        }),
      )

      fetchSpy.mockResolvedValue(new Response(new Uint8Array([10, 20, 30, 40]), { status: 200 }))

      const downloader = createStorageDownloader(client)
      const result = await downloader.download({ container: 'bucket', path: 'file.bin' })

      const buffer = await result.arrayBuffer()
      expect(buffer).toBeInstanceOf(ArrayBuffer)
      expect(buffer.byteLength).toBe(4)
    })

    it('returns a ReadableStream from stream()', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          url: 'https://storage.example.com/file.bin',
        }),
      )

      fetchSpy.mockResolvedValue(new Response('stream data', { status: 200 }))

      const downloader = createStorageDownloader(client)
      const result = await downloader.download({ container: 'bucket', path: 'file.bin' })

      const stream = result.stream()
      expect(stream).toBeTruthy()
    })
  })

  describe('error handling', () => {
    it('throws ConjoinStorageError on non-OK GCS response', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          url: 'https://storage.googleapis.com/bucket/secret.pdf',
        }),
      )

      fetchSpy.mockResolvedValue(new Response('Access Denied', { status: 403, statusText: 'Forbidden' }))

      const downloader = createStorageDownloader(client)

      try {
        await downloader.download({ container: 'bucket', path: 'secret.pdf' })
        expect.unreachable('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ConjoinStorageError)
        const storageErr = err as ConjoinStorageError
        expect(storageErr.status).toBe(403)
        expect(storageErr.storageUrl).toBe('https://storage.googleapis.com/bucket/secret.pdf')
        expect(storageErr.code).toBe('storage_error')
      }
    })

    it('throws ConjoinStorageError on 404', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          url: 'https://storage.googleapis.com/bucket/missing.txt',
        }),
      )

      fetchSpy.mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }))

      const downloader = createStorageDownloader(client)

      await expect(downloader.download({ container: 'bucket', path: 'missing.txt' })).rejects.toThrow(
        ConjoinStorageError,
      )
    })
  })

  describe('abort signal', () => {
    it('passes abort signal to the GCS fetch call', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          url: 'https://storage.googleapis.com/bucket/file.txt',
        }),
      )

      fetchSpy.mockResolvedValue(new Response('data', { status: 200 }))

      const controller = new AbortController()
      const downloader = createStorageDownloader(client)

      await downloader.download({
        container: 'bucket',
        path: 'file.txt',
        signal: controller.signal,
      })

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://storage.googleapis.com/bucket/file.txt',
        expect.objectContaining({ signal: controller.signal }),
      )
    })
  })
})
