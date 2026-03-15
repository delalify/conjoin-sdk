import { useCallback, useMemo, useState } from 'react'
import { createStorageUploader, type UploadOptions, type UploadProgress } from '../../storage/upload'
import { useConjoinClient } from './internal/use-conjoin-client'

export function useStorageUpload() {
  const { client } = useConjoinClient()
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const uploader = useMemo(() => createStorageUploader(client), [client])

  const upload = useCallback(
    async (options: Omit<UploadOptions, 'onProgress'>) => {
      setIsUploading(true)
      setError(null)
      setProgress(null)

      try {
        await uploader.upload({
          ...options,
          onProgress: setProgress,
        })
      } catch (err) {
        const uploadError = err instanceof Error ? err : new Error(String(err))
        setError(uploadError)
        throw uploadError
      } finally {
        setIsUploading(false)
      }
    },
    [uploader],
  )

  return { upload, progress, isUploading, error }
}
