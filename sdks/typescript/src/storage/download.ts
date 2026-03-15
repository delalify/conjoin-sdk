import { ConjoinStorageError } from '../core/errors'
import type { ConjoinClient } from '../core/types'
import { createStorageObjects } from '../generated/modules/storage-object'

export type DownloadOptions = {
  container: string
  path: string
  signal?: AbortSignal
}

export type DownloadResult = {
  url: string
  response: Response
  blob: () => Promise<Blob>
  arrayBuffer: () => Promise<ArrayBuffer>
  stream: () => ReadableStream<Uint8Array> | null
  text: () => Promise<string>
}

export function createStorageDownloader(client: ConjoinClient) {
  return {
    async download(options: DownloadOptions): Promise<DownloadResult> {
      const { container, path, signal } = options

      const storageApi = createStorageObjects(client)
      const signedUrlResponse = await storageApi.createDownloadSignedUrl({
        container_name_or_id: container,
        path,
      })

      const { url, headers } = signedUrlResponse

      const response = await fetch(url, {
        headers,
        signal,
      })

      if (!response.ok) {
        throw new ConjoinStorageError(
          `Download failed: ${response.status} ${response.statusText}`,
          response.status,
          url,
        )
      }

      return {
        url,
        response,
        blob: () => response.blob(),
        arrayBuffer: () => response.arrayBuffer(),
        stream: () => response.body,
        text: () => response.text(),
      }
    },
  }
}
