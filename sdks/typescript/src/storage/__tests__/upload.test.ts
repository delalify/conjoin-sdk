import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConjoinStorageError } from '../../core/errors'
import type { ConjoinClient, ResolvedConfig } from '../../core/types'
import { DEFAULT_API_VERSION } from '../../core/version'
import { createStorageObjects } from '../../generated/modules/storage-object'
import { createStorageUploader } from '../upload'

const config: ResolvedConfig = Object.freeze({
  apiKey: 'ck_test_123',
  baseUrl: 'https://api.conjoin.cloud',
  apiVersion: DEFAULT_API_VERSION,
  timeout: 30_000,
  retry: Object.freeze({ maxRetries: 0, backoffMs: 100 }),
})

function createMockClient(fetchImpl?: ConjoinClient['fetch']): ConjoinClient {
  return {
    config,
    fetch: fetchImpl ?? vi.fn(),
    fetchWithResponse: vi.fn(),
    fetchList: vi.fn(),
    fetchListWithResponse: vi.fn(),
    fetchRaw: vi.fn(),
    withRequestTrace: vi.fn(),
  }
}

let fetchSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
})

afterEach(() => {
  vi.restoreAllMocks()
})

const CHUNK_SIZE = 256 * 1024

describe('createStorageUploader', () => {
  it('uses the same upload signed-url endpoint as the generated storage object resource', async () => {
    const client = createMockClient(
      vi.fn().mockResolvedValue({
        upload_url: 'https://storage.example.com/upload',
        required_fields: { method: 'PUT' as const, headers: {} },
        upload_mode: 'single' as const,
      }),
    )

    fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

    await createStorageObjects(client).createUploadSignedUrl({
      container_name_or_id: 'bucket',
      path: 'file.txt',
      content_type: 'text/plain',
      file_size: 4,
    })
    const generatedPath = vi.mocked(client.fetch).mock.calls[0]?.[0]

    await createStorageUploader(client).upload({
      container: 'bucket',
      path: 'file.txt',
      contentType: 'text/plain',
      body: new Uint8Array([1, 2, 3, 4]),
    })

    expect(vi.mocked(client.fetch).mock.calls[1]?.[0]).toBe(generatedPath)
  })

  describe('single upload flow', () => {
    it('sends the file to the signed URL with correct method and headers', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.googleapis.com/bucket/object',
          required_fields: {
            method: 'PUT' as const,
            headers: { 'x-goog-content-length-range': '0,5242880' },
          },
          upload_mode: 'single' as const,
        }),
      )

      fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

      const uploader = createStorageUploader(client)
      const body = new Uint8Array([1, 2, 3, 4])

      await uploader.upload({
        container: 'my-bucket',
        path: 'photos/cat.jpg',
        contentType: 'image/jpeg',
        body,
      })

      expect(client.fetch).toHaveBeenCalledWith('storage/storage-object/upload/signed-url', {
        method: 'POST',
        body: {
          container_name_or_id: 'my-bucket',
          path: 'photos/cat.jpg',
          content_type: 'image/jpeg',
          file_size: 4,
          expires_in_minutes: undefined,
        },
      })

      expect(fetchSpy).toHaveBeenCalledOnce()
      const [url, init] = fetchSpy.mock.calls[0]
      expect(url).toBe('https://storage.googleapis.com/bucket/object')
      expect(init.method).toBe('PUT')
      expect(init.headers).toEqual({ 'x-goog-content-length-range': '0,5242880' })
      expect(init.body).toBeInstanceOf(Blob)
    })

    it('fires onProgress at 0% and 100%', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.example.com/upload',
          required_fields: { method: 'PUT' as const, headers: {} },
          upload_mode: 'single' as const,
        }),
      )

      fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

      const onProgress = vi.fn()
      const uploader = createStorageUploader(client)

      await uploader.upload({
        container: 'test',
        path: 'file.txt',
        contentType: 'text/plain',
        body: new Uint8Array([1, 2, 3]),
        onProgress,
      })

      expect(onProgress).toHaveBeenCalledTimes(2)
      expect(onProgress).toHaveBeenNthCalledWith(1, { loaded: 0, total: 3, percentage: 0 })
      expect(onProgress).toHaveBeenNthCalledWith(2, { loaded: 3, total: 3, percentage: 100 })
    })

    it('throws ConjoinStorageError on GCS failure', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.example.com/upload',
          required_fields: { method: 'PUT' as const, headers: {} },
          upload_mode: 'single' as const,
        }),
      )

      fetchSpy.mockResolvedValue(new Response('Forbidden', { status: 403, statusText: 'Forbidden' }))

      const uploader = createStorageUploader(client)

      try {
        await uploader.upload({
          container: 'test',
          path: 'file.txt',
          contentType: 'text/plain',
          body: new Uint8Array([1]),
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ConjoinStorageError)
        const storageErr = err as ConjoinStorageError
        expect(storageErr.status).toBe(403)
        expect(storageErr.storageUrl).toBe('https://storage.example.com/upload')
        expect(storageErr.uploadMode).toBe('single')
      }
    })
  })

  describe('resumable upload flow', () => {
    const totalSize = CHUNK_SIZE * 2

    function setupResumableClient() {
      return createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.googleapis.com/resumable/upload',
          required_fields: {
            method: 'POST' as const,
            headers: { 'x-goog-resumable': 'start' },
          },
          upload_mode: 'resumable' as const,
        }),
      )
    }

    it('initiates session and uploads chunks with correct Content-Range', async () => {
      const client = setupResumableClient()
      const sessionUri = 'https://storage.googleapis.com/upload?upload_id=abc123'

      fetchSpy
        .mockResolvedValueOnce(new Response(null, { status: 200, headers: { Location: sessionUri } }))
        .mockResolvedValueOnce(new Response(null, { status: 308, headers: { Range: `bytes=0-${CHUNK_SIZE - 1}` } }))
        .mockResolvedValueOnce(new Response(null, { status: 200 }))

      const uploader = createStorageUploader(client)

      await uploader.upload({
        container: 'bucket',
        path: 'large-file.bin',
        contentType: 'application/octet-stream',
        body: new Uint8Array(totalSize),
        chunkSize: CHUNK_SIZE,
      })

      expect(fetchSpy).toHaveBeenCalledTimes(3)

      const [initUrl, initOpts] = fetchSpy.mock.calls[0]
      expect(initUrl).toBe('https://storage.googleapis.com/resumable/upload')
      expect(initOpts.method).toBe('POST')

      const [chunk1Url, chunk1Opts] = fetchSpy.mock.calls[1]
      expect(chunk1Url).toBe(sessionUri)
      expect(chunk1Opts.method).toBe('PUT')
      expect(chunk1Opts.headers['Content-Range']).toBe(`bytes 0-${CHUNK_SIZE - 1}/${totalSize}`)

      const [chunk2Url, chunk2Opts] = fetchSpy.mock.calls[2]
      expect(chunk2Url).toBe(sessionUri)
      expect(chunk2Opts.headers['Content-Range']).toBe(`bytes ${CHUNK_SIZE}-${totalSize - 1}/${totalSize}`)
    })

    it('fires onProgress after each chunk using server-confirmed Range', async () => {
      const client = setupResumableClient()
      const sessionUri = 'https://storage.googleapis.com/upload?upload_id=prog'

      fetchSpy
        .mockResolvedValueOnce(new Response(null, { status: 200, headers: { Location: sessionUri } }))
        .mockResolvedValueOnce(new Response(null, { status: 308, headers: { Range: `bytes=0-${CHUNK_SIZE - 1}` } }))
        .mockResolvedValueOnce(new Response(null, { status: 200 }))

      const onProgress = vi.fn()
      const uploader = createStorageUploader(client)

      await uploader.upload({
        container: 'bucket',
        path: 'file.bin',
        contentType: 'application/octet-stream',
        body: new Uint8Array(totalSize),
        chunkSize: CHUNK_SIZE,
        onProgress,
      })

      expect(onProgress).toHaveBeenCalledTimes(3)
      expect(onProgress).toHaveBeenNthCalledWith(1, { loaded: 0, total: totalSize, percentage: 0 })
      expect(onProgress).toHaveBeenNthCalledWith(2, { loaded: CHUNK_SIZE, total: totalSize, percentage: 50 })
      expect(onProgress).toHaveBeenNthCalledWith(3, { loaded: totalSize, total: totalSize, percentage: 100 })
    })

    it('throws ConjoinStorageError on session initiation failure', async () => {
      const client = setupResumableClient()

      fetchSpy.mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }))

      const uploader = createStorageUploader(client)

      await expect(
        uploader.upload({
          container: 'bucket',
          path: 'file.bin',
          contentType: 'application/octet-stream',
          body: new Uint8Array(totalSize),
        }),
      ).rejects.toThrow(ConjoinStorageError)
    })

    it('throws ConjoinStorageError when session URI is missing', async () => {
      const client = setupResumableClient()

      fetchSpy.mockResolvedValueOnce(new Response(null, { status: 200 }))

      const uploader = createStorageUploader(client)

      await expect(
        uploader.upload({
          container: 'bucket',
          path: 'file.bin',
          contentType: 'application/octet-stream',
          body: new Uint8Array(totalSize),
        }),
      ).rejects.toThrow('session URI')
    })

    it('throws ConjoinStorageError on chunk upload failure', async () => {
      const client = setupResumableClient()
      const sessionUri = 'https://storage.googleapis.com/upload?upload_id=fail'

      fetchSpy
        .mockResolvedValueOnce(new Response(null, { status: 200, headers: { Location: sessionUri } }))
        .mockResolvedValueOnce(new Response('Server Error', { status: 500, statusText: 'Internal Server Error' }))

      const uploader = createStorageUploader(client)

      try {
        await uploader.upload({
          container: 'bucket',
          path: 'file.bin',
          contentType: 'application/octet-stream',
          body: new Uint8Array(totalSize),
          chunkSize: CHUNK_SIZE,
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ConjoinStorageError)
        const storageErr = err as ConjoinStorageError
        expect(storageErr.status).toBe(500)
        expect(storageErr.uploadMode).toBe('resumable')
      }
    })
  })

  describe('input size detection', () => {
    it('detects size from Blob', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.example.com/upload',
          required_fields: { method: 'PUT' as const, headers: {} },
          upload_mode: 'single' as const,
        }),
      )
      fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

      const uploader = createStorageUploader(client)
      await uploader.upload({
        container: 'test',
        path: 'file.txt',
        contentType: 'text/plain',
        body: new Blob(['hello world']),
      })

      expect(client.fetch).toHaveBeenCalledWith(
        'storage/storage-object/upload/signed-url',
        expect.objectContaining({
          body: expect.objectContaining({ file_size: 11 }),
        }),
      )
    })

    it('detects size from ArrayBuffer', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.example.com/upload',
          required_fields: { method: 'PUT' as const, headers: {} },
          upload_mode: 'single' as const,
        }),
      )
      fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

      const uploader = createStorageUploader(client)
      await uploader.upload({
        container: 'test',
        path: 'file.txt',
        contentType: 'text/plain',
        body: new ArrayBuffer(16),
      })

      expect(client.fetch).toHaveBeenCalledWith(
        'storage/storage-object/upload/signed-url',
        expect.objectContaining({
          body: expect.objectContaining({ file_size: 16 }),
        }),
      )
    })

    it('detects size from Buffer', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.example.com/upload',
          required_fields: { method: 'PUT' as const, headers: {} },
          upload_mode: 'single' as const,
        }),
      )
      fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

      const uploader = createStorageUploader(client)
      await uploader.upload({
        container: 'test',
        path: 'file.txt',
        contentType: 'text/plain',
        body: Buffer.from('hello'),
      })

      expect(client.fetch).toHaveBeenCalledWith(
        'storage/storage-object/upload/signed-url',
        expect.objectContaining({
          body: expect.objectContaining({ file_size: 5 }),
        }),
      )
    })

    it('copies SharedArrayBuffer-backed Uint8Array bodies before upload', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.example.com/upload',
          required_fields: { method: 'PUT' as const, headers: {} },
          upload_mode: 'single' as const,
        }),
      )
      fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

      const shared = new SharedArrayBuffer(3)
      const body = new Uint8Array(shared)
      body.set([1, 2, 3])

      const uploader = createStorageUploader(client)
      await uploader.upload({
        container: 'test',
        path: 'file.txt',
        contentType: 'text/plain',
        body,
      })

      const request = fetchSpy.mock.calls[0]?.[1]
      expect(request?.body).toBeInstanceOf(Blob)
      expect((request?.body as Blob).size).toBe(3)
    })

    it('uploads a ReadableStream as a single Blob when fileSize is provided', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.example.com/upload',
          required_fields: { method: 'PUT' as const, headers: {} },
          upload_mode: 'single' as const,
        }),
      )
      fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

      const uploader = createStorageUploader(client)
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2]))
          controller.enqueue(new Uint8Array([3]))
          controller.close()
        },
      })

      await uploader.upload({
        container: 'test',
        path: 'file.txt',
        contentType: 'text/plain',
        body,
        fileSize: 3,
      })

      const request = fetchSpy.mock.calls[0]?.[1]
      expect(request?.body).toBeInstanceOf(Blob)
      expect((request?.body as Blob).size).toBe(3)
    })

    it('throws when ReadableStream has no fileSize', async () => {
      const client = createMockClient()
      const uploader = createStorageUploader(client)
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]))
          controller.close()
        },
      })

      await expect(
        uploader.upload({
          container: 'test',
          path: 'file.txt',
          contentType: 'text/plain',
          body: stream,
        }),
      ).rejects.toThrow('fileSize is required when body is a ReadableStream')
    })
  })

  describe('chunk size validation', () => {
    it('rejects chunkSize that is not a multiple of 256 KiB', async () => {
      const client = createMockClient()
      const uploader = createStorageUploader(client)

      await expect(
        uploader.upload({
          container: 'test',
          path: 'file.bin',
          contentType: 'application/octet-stream',
          body: new Uint8Array(100),
          chunkSize: 1000,
        }),
      ).rejects.toThrow('chunkSize must be a multiple of')
    })
  })

  describe('abort signal', () => {
    it('passes abort signal to GCS fetch calls', async () => {
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.example.com/upload',
          required_fields: { method: 'PUT' as const, headers: {} },
          upload_mode: 'single' as const,
        }),
      )

      fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

      const controller = new AbortController()
      const uploader = createStorageUploader(client)

      await uploader.upload({
        container: 'test',
        path: 'file.txt',
        contentType: 'text/plain',
        body: new Uint8Array([1]),
        signal: controller.signal,
      })

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://storage.example.com/upload',
        expect.objectContaining({ signal: controller.signal }),
      )
    })
  })

  describe('ReadableStream resumable upload', () => {
    it('buffers stream chunks into aligned upload chunks and uploads the remainder', async () => {
      const totalSize = CHUNK_SIZE + 2
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.googleapis.com/resumable/upload',
          required_fields: {
            method: 'POST' as const,
            headers: { 'x-goog-resumable': 'start' },
          },
          upload_mode: 'resumable' as const,
        }),
      )
      const sessionUri = 'https://storage.googleapis.com/upload?upload_id=stream'

      fetchSpy
        .mockResolvedValueOnce(new Response(null, { status: 200, headers: { Location: sessionUri } }))
        .mockResolvedValueOnce(new Response(null, { status: 308 }))
        .mockResolvedValueOnce(new Response(null, { status: 200 }))

      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(CHUNK_SIZE - 1))
          controller.enqueue(new Uint8Array([1, 2, 3]))
          controller.close()
        },
      })

      const uploader = createStorageUploader(client)
      await uploader.upload({
        container: 'bucket',
        path: 'file.bin',
        contentType: 'application/octet-stream',
        body,
        chunkSize: CHUNK_SIZE,
        fileSize: totalSize,
      })

      expect(fetchSpy).toHaveBeenCalledTimes(3)
      expect(fetchSpy.mock.calls[1]?.[1].headers['Content-Range']).toBe(`bytes 0-${CHUNK_SIZE - 1}/${totalSize}`)
      expect(fetchSpy.mock.calls[2]?.[1].headers['Content-Range']).toBe(`bytes 0-1/${totalSize}`)
    })

    it('handles exact stream chunk boundaries and invalid resumable Range headers', async () => {
      const totalSize = CHUNK_SIZE
      const client = createMockClient(
        vi.fn().mockResolvedValue({
          upload_url: 'https://storage.googleapis.com/resumable/upload',
          required_fields: {
            method: 'POST' as const,
            headers: { 'x-goog-resumable': 'start' },
          },
          upload_mode: 'resumable' as const,
        }),
      )
      const sessionUri = 'https://storage.googleapis.com/upload?upload_id=invalid-range'

      fetchSpy
        .mockResolvedValueOnce(new Response(null, { status: 200, headers: { Location: sessionUri } }))
        .mockResolvedValueOnce(new Response(null, { status: 308, headers: { Range: 'invalid' } }))

      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(CHUNK_SIZE))
          controller.close()
        },
      })

      const uploader = createStorageUploader(client)
      await uploader.upload({
        container: 'bucket',
        path: 'file.bin',
        contentType: 'application/octet-stream',
        body,
        chunkSize: CHUNK_SIZE,
        fileSize: totalSize,
      })

      expect(fetchSpy).toHaveBeenCalledTimes(2)
      expect(fetchSpy.mock.calls[1]?.[1].headers['Content-Range']).toBe(`bytes 0-${CHUNK_SIZE - 1}/${totalSize}`)
    })
  })
})
