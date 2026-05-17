import { expect } from 'vitest'
import { createStorageObjects } from '../../../src/storage'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  CONTAINER_NAME,
  describeStorageSdkContractCases,
  OBJECT_NAME,
  REQUEST_ID,
  storageExpectedObjectListQuery,
  storageExpectedVersionListQuery,
  storageObjectFixture,
  storageObjectListQuery,
  storageObjectVersionFixture,
  storageVersionListQuery,
  VERSION_ID,
} from './storage-test-utils'

const createUploadSignedUrlBody = {
  container_name_or_id: CONTAINER_NAME,
  content_type: 'text/plain',
  expires_in_minutes: 15,
  file_size: 128,
  path: `docs/${OBJECT_NAME}`,
}
const createDownloadSignedUrlBody = {
  container_name_or_id: CONTAINER_NAME,
  path: `docs/${OBJECT_NAME}`,
}
const createUploadSignedUrlResponse = {
  required_fields: {
    headers: {
      'content-type': 'text/plain',
    },
    method: 'PUT' as const,
  },
  upload_mode: 'single' as const,
  upload_url: 'https://storage.example.com/upload',
}
const createDownloadSignedUrlResponse = {
  headers: {
    accept: 'text/plain',
  },
  url: 'https://storage.example.com/download',
}
const restoreVersionBody = {
  version_id: VERSION_ID,
}
const duplicateQuery = {
  md5_hash: 'md5-contract',
}
const expectedDuplicateQuery = {
  md5_hash: 'md5-contract',
}
const OBJECT_PREFIX = 'docs'
const RENAMED_OBJECT_NAME = 'renamed-object.txt'

describeStorageSdkContractCases('Storage object SDK contract integration', [
  {
    name: 'creates a storage object upload signed URL',
    method: 'POST',
    path: '/v1/storage/storage-object/upload/signed-url',
    expectedBody: createUploadSignedUrlBody,
    response: conjoinSuccess(createUploadSignedUrlResponse, { requestId: REQUEST_ID }),
    run: context => createStorageObjects(context.client).createUploadSignedUrl(createUploadSignedUrlBody),
    assertResult: result => expect(result).toEqual(createUploadSignedUrlResponse),
  },
  {
    name: 'creates a storage object download signed URL',
    method: 'POST',
    path: '/v1/storage/storage-object/download/signed-url',
    expectedBody: createDownloadSignedUrlBody,
    response: conjoinSuccess(createDownloadSignedUrlResponse, { requestId: REQUEST_ID }),
    run: context => createStorageObjects(context.client).createDownloadSignedUrl(createDownloadSignedUrlBody),
    assertResult: result => expect(result).toEqual(createDownloadSignedUrlResponse),
  },
  {
    name: 'renames a storage object',
    method: 'PATCH',
    path: '/v1/storage/storage-object/rename/{container_name_or_id}/{old_name}/{new_name}',
    expectedPath: `/v1/storage/storage-object/rename/${CONTAINER_NAME}/${OBJECT_NAME}/${RENAMED_OBJECT_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
      new_name: RENAMED_OBJECT_NAME,
      old_name: OBJECT_NAME,
    },
    expectedRawBody: '',
    response: conjoinSuccess(storageObjectFixture({ name: RENAMED_OBJECT_NAME }), { requestId: REQUEST_ID }),
    run: context => createStorageObjects(context.client).rename(CONTAINER_NAME, OBJECT_NAME, RENAMED_OBJECT_NAME),
    assertResult: result => expect(result).toEqual(storageObjectFixture({ name: RENAMED_OBJECT_NAME })),
  },
  {
    name: 'archives a storage object',
    method: 'PATCH',
    path: '/v1/storage/storage-object/archive/{container_name_or_id}/{object_name_or_id}',
    expectedPath: `/v1/storage/storage-object/archive/${CONTAINER_NAME}/${OBJECT_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
      object_name_or_id: OBJECT_NAME,
    },
    expectedRawBody: '',
    response: conjoinSuccess(storageObjectFixture({ archived_date: '2026-05-16T02:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createStorageObjects(context.client).archive(CONTAINER_NAME, OBJECT_NAME),
    assertResult: result => expect(result).toEqual(storageObjectFixture({ archived_date: '2026-05-16T02:00:00.000Z' })),
  },
  {
    name: 'restores a storage object',
    method: 'PATCH',
    path: '/v1/storage/storage-object/restore/{container_name_or_id}/{object_name_or_id}',
    expectedPath: `/v1/storage/storage-object/restore/${CONTAINER_NAME}/${OBJECT_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
      object_name_or_id: OBJECT_NAME,
    },
    expectedRawBody: '',
    response: conjoinSuccess(storageObjectFixture({ archived_date: null }), { requestId: REQUEST_ID }),
    run: context => createStorageObjects(context.client).restore(CONTAINER_NAME, OBJECT_NAME),
    assertResult: result => expect(result).toEqual(storageObjectFixture({ archived_date: null })),
  },
  {
    name: 'deletes a storage object',
    method: 'DELETE',
    path: '/v1/storage/storage-object/{container_name_or_id}/{prefix}/{name}',
    expectedPath: `/v1/storage/storage-object/${CONTAINER_NAME}/${OBJECT_PREFIX}/${OBJECT_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
      name: OBJECT_NAME,
      prefix: OBJECT_PREFIX,
    },
    expectedRawBody: '',
    response: conjoinSuccess(storageObjectFixture({ archived_date: '2026-05-16T02:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createStorageObjects(context.client).delete(CONTAINER_NAME, OBJECT_PREFIX, OBJECT_NAME),
    assertResult: result => expect(result).toEqual(storageObjectFixture({ archived_date: '2026-05-16T02:00:00.000Z' })),
  },
  {
    name: 'reads a storage object',
    method: 'GET',
    path: '/v1/storage/storage-object/details/{container_name_or_id}/{object_name_or_id}',
    expectedPath: `/v1/storage/storage-object/details/${CONTAINER_NAME}/${OBJECT_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
      object_name_or_id: OBJECT_NAME,
    },
    expectedRawBody: '',
    response: conjoinSuccess(storageObjectFixture(), { requestId: REQUEST_ID }),
    run: context => createStorageObjects(context.client).read(CONTAINER_NAME, OBJECT_NAME),
    assertResult: result => expect(result).toEqual(storageObjectFixture()),
  },
  {
    name: 'lists storage objects',
    method: 'GET',
    path: '/v1/storage/storage-object/list/{container_name_or_id}',
    expectedPath: `/v1/storage/storage-object/list/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    expectedQuery: storageExpectedObjectListQuery,
    expectedRawBody: '',
    response: conjoinList([storageObjectFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createStorageObjects(context.client).list(CONTAINER_NAME, storageObjectListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [storageObjectFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'lists storage object versions',
    method: 'GET',
    path: '/v1/storage/storage-object/versions/{container_name_or_id}/{object_name_or_id}',
    expectedPath: `/v1/storage/storage-object/versions/${CONTAINER_NAME}/${OBJECT_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
      object_name_or_id: OBJECT_NAME,
    },
    expectedQuery: storageExpectedVersionListQuery,
    expectedRawBody: '',
    response: conjoinList([storageObjectVersionFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context =>
      createStorageObjects(context.client).listVersions(CONTAINER_NAME, OBJECT_NAME, storageVersionListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [storageObjectVersionFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'restores a storage object version',
    method: 'POST',
    path: '/v1/storage/storage-object/versions/restore/{container_name_or_id}/{object_name_or_id}',
    expectedBody: restoreVersionBody,
    expectedPath: `/v1/storage/storage-object/versions/restore/${CONTAINER_NAME}/${OBJECT_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
      object_name_or_id: OBJECT_NAME,
    },
    response: conjoinSuccess(storageObjectVersionFixture(), { requestId: REQUEST_ID }),
    run: context =>
      createStorageObjects(context.client).restoreVersion(CONTAINER_NAME, OBJECT_NAME, restoreVersionBody),
    assertResult: result => expect(result).toEqual(storageObjectVersionFixture()),
  },
  {
    name: 'checks a storage object duplicate',
    method: 'GET',
    path: '/v1/storage/storage-object/check-duplicate/{container_name_or_id}',
    expectedPath: `/v1/storage/storage-object/check-duplicate/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    expectedQuery: expectedDuplicateQuery,
    expectedRawBody: '',
    response: conjoinSuccess(storageObjectFixture({ duplicate_of: 'object_456' }), { requestId: REQUEST_ID }),
    run: context => createStorageObjects(context.client).checkDuplicate(CONTAINER_NAME, duplicateQuery),
    assertResult: result => expect(result).toEqual(storageObjectFixture({ duplicate_of: 'object_456' })),
  },
])
