import { ConjoinStorageError } from '../core/errors'
import type { ConjoinClient } from '../core/types'
import { createStorageObjects } from '../generated/modules/storage-object'

export type UploadInput = File | Blob | Buffer | ReadableStream<Uint8Array> | ArrayBuffer | Uint8Array

export type UploadProgress = {
  loaded: number
  total: number
  percentage: number
}

export type UploadOptions = {
  container: string
  path: string
  contentType: string
  body: UploadInput
  fileSize?: number
  expiresInMinutes?: number
  chunkSize?: number
  signal?: AbortSignal
  onProgress?: (progress: UploadProgress) => void
}

const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024
const CHUNK_ALIGNMENT = 256 * 1024

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer instanceof ArrayBuffer
    ? view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)
    : (new Uint8Array(view).buffer as ArrayBuffer)
}

function getInputSize(input: UploadInput, fileSize?: number): number {
  if (fileSize !== undefined) return fileSize
  if (input instanceof Blob) return input.size
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) return input.byteLength
  if (input instanceof ArrayBuffer) return input.byteLength
  if (input instanceof Uint8Array) return input.byteLength
  throw new Error('fileSize is required when body is a ReadableStream')
}

async function inputToBlob(input: UploadInput): Promise<Blob> {
  if (input instanceof Blob) return input
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) return new Blob([toArrayBuffer(input)])
  if (input instanceof ArrayBuffer) return new Blob([input])
  if (input instanceof Uint8Array) return new Blob([toArrayBuffer(input)])
  const reader = input.getReader()
  const parts: ArrayBuffer[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) parts.push(toArrayBuffer(value))
  }
  return new Blob(parts)
}

async function* inputToChunks(input: UploadInput, chunkSize: number): AsyncGenerator<Blob> {
  if (input instanceof ReadableStream) {
    const reader = input.getReader()
    let buffer = new Uint8Array(0)

    for (;;) {
      const { done, value } = await reader.read()

      if (value) {
        const combined = new Uint8Array(buffer.byteLength + value.byteLength)
        combined.set(buffer, 0)
        combined.set(value, buffer.byteLength)
        buffer = combined
      }

      while (buffer.byteLength >= chunkSize) {
        yield new Blob([toArrayBuffer(buffer.slice(0, chunkSize))])
        buffer = buffer.slice(chunkSize)
      }

      if (done) {
        if (buffer.byteLength > 0) {
          yield new Blob([toArrayBuffer(buffer)])
        }
        break
      }
    }
    return
  }

  const blob = await inputToBlob(input)
  const bytes = new Uint8Array(await blob.arrayBuffer())
  for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, bytes.byteLength)
    yield new Blob([toArrayBuffer(bytes.slice(offset, end))])
  }
}

async function initiateResumableSession(
  url: string,
  headers: Record<string, string>,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    signal,
  })

  if (!response.ok) {
    throw new ConjoinStorageError(
      `Failed to initiate resumable upload: ${response.status} ${response.statusText}`,
      response.status,
      url,
      'resumable',
    )
  }

  const sessionUri = response.headers.get('Location')
  if (!sessionUri) {
    throw new ConjoinStorageError(
      'Resumable upload initiation did not return a session URI',
      response.status,
      url,
      'resumable',
    )
  }

  return sessionUri
}

function parseRangeHeader(response: Response): number {
  const range = response.headers.get('Range')
  if (!range) return 0
  const match = range.match(/bytes=0-(\d+)/)
  if (!match) return 0
  return Number.parseInt(match[1], 10) + 1
}

export function createStorageUploader(client: ConjoinClient) {
  return {
    async upload(options: UploadOptions): Promise<void> {
      const { container, path, contentType, body, expiresInMinutes, signal, onProgress } = options

      const totalSize = getInputSize(body, options.fileSize)
      const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE

      if (options.chunkSize !== undefined && options.chunkSize % CHUNK_ALIGNMENT !== 0) {
        throw new Error(`chunkSize must be a multiple of ${CHUNK_ALIGNMENT} bytes (256 KiB)`)
      }

      const storageApi = createStorageObjects(client)
      const signedUrlResponse = await storageApi.createUploadSignedUrl({
        container_name_or_id: container,
        path,
        content_type: contentType,
        file_size: totalSize,
        expires_in_minutes: expiresInMinutes,
      })

      const { upload_url, required_fields, upload_mode } = signedUrlResponse

      if (upload_mode === 'single') {
        onProgress?.({ loaded: 0, total: totalSize, percentage: 0 })

        const blob = await inputToBlob(body)
        const response = await fetch(upload_url, {
          method: required_fields.method,
          headers: required_fields.headers,
          body: blob,
          signal,
        })

        if (!response.ok) {
          throw new ConjoinStorageError(
            `Upload failed: ${response.status} ${response.statusText}`,
            response.status,
            upload_url,
            'single',
          )
        }

        onProgress?.({ loaded: totalSize, total: totalSize, percentage: 100 })
        return
      }

      const sessionUri = await initiateResumableSession(upload_url, required_fields.headers, signal)

      let loaded = 0
      onProgress?.({ loaded: 0, total: totalSize, percentage: 0 })

      for await (const chunkBlob of inputToChunks(body, chunkSize)) {
        const chunkByteLength = chunkBlob.size
        const start = loaded
        const end = loaded + chunkByteLength - 1

        const response = await fetch(sessionUri, {
          method: 'PUT',
          headers: {
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Content-Length': String(chunkByteLength),
          },
          body: chunkBlob,
          signal,
        })

        if (response.status !== 308 && !response.ok) {
          throw new ConjoinStorageError(
            `Chunk upload failed: ${response.status} ${response.statusText}`,
            response.status,
            sessionUri,
            'resumable',
          )
        }

        if (response.status === 308) {
          loaded = parseRangeHeader(response)
        } else {
          loaded = totalSize
        }

        onProgress?.({
          loaded,
          total: totalSize,
          percentage: Math.round((loaded / totalSize) * 100),
        })
      }
    },
  }
}
