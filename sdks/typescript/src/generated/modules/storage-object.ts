import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateUploadSignedUrlBody = operations['createUploadSignedUrl']['requestBody']['content']['application/json']
type CreateUploadSignedUrlData = NonNullable<
  operations['createUploadSignedUrl']['responses']['200']['content']['application/json']['data']
>
type CreateDownloadSignedUrlBody = operations['createDownloadSignedUrl']['requestBody']['content']['application/json']
type CreateDownloadSignedUrlData = NonNullable<
  operations['createDownloadSignedUrl']['responses']['200']['content']['application/json']['data']
>
type RenameData = NonNullable<
  operations['renameStorageObject']['responses']['200']['content']['application/json']['data']
>
type ArchiveData = NonNullable<
  operations['archiveStorageObject']['responses']['200']['content']['application/json']['data']
>
type RestoreData = NonNullable<
  operations['restoreStorageObject']['responses']['200']['content']['application/json']['data']
>
type DeleteData = NonNullable<
  operations['deleteStorageObject']['responses']['200']['content']['application/json']['data']
>
type ReadData = NonNullable<operations['readStorageObject']['responses']['200']['content']['application/json']['data']>
type ListData = NonNullable<
  operations['listStorageObjects']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listStorageObjects']['parameters']['query']>
type ListVersionsData = NonNullable<
  operations['listStorageObjectVersions']['responses']['200']['content']['application/json']['data']
>[number]
type ListVersionsQuery = NonNullable<operations['listStorageObjectVersions']['parameters']['query']>
type RestoreVersionBody = operations['restoreStorageObjectVersion']['requestBody']['content']['application/json']
type RestoreVersionData = NonNullable<
  operations['restoreStorageObjectVersion']['responses']['200']['content']['application/json']['data']
>
type CheckDuplicateData = NonNullable<
  operations['checkStorageObjectDuplicate']['responses']['200']['content']['application/json']['data']
>
type CheckDuplicateQuery = NonNullable<operations['checkStorageObjectDuplicate']['parameters']['query']>

export function createStorageObjects(client: ConjoinClient) {
  return {
    createUploadSignedUrl: (data: CreateUploadSignedUrlBody) =>
      client.fetch<CreateUploadSignedUrlData>('storage/storage-object/upload/signed-url', {
        method: 'POST',
        body: data,
      }),

    createDownloadSignedUrl: (data: CreateDownloadSignedUrlBody) =>
      client.fetch<CreateDownloadSignedUrlData>('storage/storage-object/download/signed-url', {
        method: 'POST',
        body: data,
      }),

    rename: (containerNameOrId: string, oldName: string, newName: string) =>
      client.fetch<RenameData>(`storage/storage-object/rename/${containerNameOrId}/${oldName}/${newName}`, {
        method: 'PATCH',
      }),

    archive: (containerNameOrId: string, objectNameOrId: string) =>
      client.fetch<ArchiveData>(`storage/storage-object/archive/${containerNameOrId}/${objectNameOrId}`, {
        method: 'PATCH',
      }),

    restore: (containerNameOrId: string, objectNameOrId: string) =>
      client.fetch<RestoreData>(`storage/storage-object/restore/${containerNameOrId}/${objectNameOrId}`, {
        method: 'PATCH',
      }),

    delete: (containerNameOrId: string, prefix: string, name: string) =>
      client.fetch<DeleteData>(`storage/storage-object/${containerNameOrId}/${prefix}/${name}`, { method: 'DELETE' }),

    read: (containerNameOrId: string, objectNameOrId: string) =>
      client.fetch<ReadData>(`storage/storage-object/details/${containerNameOrId}/${objectNameOrId}`),

    list: (containerNameOrId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`storage/storage-object/list/${containerNameOrId}`, {
        query: query as Record<string, unknown>,
      }),

    listVersions: (containerNameOrId: string, objectNameOrId: string, query?: ListVersionsQuery) =>
      client.fetchList<ListVersionsData>(`storage/storage-object/versions/${containerNameOrId}/${objectNameOrId}`, {
        query: query as Record<string, unknown>,
      }),

    restoreVersion: (containerNameOrId: string, objectNameOrId: string, data: RestoreVersionBody) =>
      client.fetch<RestoreVersionData>(
        `storage/storage-object/versions/restore/${containerNameOrId}/${objectNameOrId}`,
        { method: 'POST', body: data },
      ),

    checkDuplicate: (containerNameOrId: string, query?: CheckDuplicateQuery) =>
      client.fetch<CheckDuplicateData>(`storage/storage-object/check-duplicate/${containerNameOrId}`, {
        query: query as Record<string, unknown>,
      }),
  }
}
