import { expect } from 'vitest'
import { createStorageObjectACLs } from '../../../src/storage'
import { conjoinSuccess } from '../contract-server/response-fixtures'
import {
  CONTAINER_NAME,
  describeStorageSdkContractCases,
  OBJECT_NAME,
  REQUEST_ID,
  storageObjectAclFixture,
} from './storage-test-utils'

const grantObjectAclBody = {
  entries: [
    {
      entity_id: 'auth_account_123',
      entity_type: 'conjoin_auth_account' as const,
      role: 'viewer' as const,
    },
  ],
}
const revokeObjectAclBody = {
  entries: [
    {
      entity_id: 'auth_account_123',
      entity_type: 'conjoin_auth_account' as const,
    },
  ],
}
const setObjectPublicBody = {
  is_public: true,
}

describeStorageSdkContractCases('Storage object ACL SDK contract integration', [
  {
    name: 'grants storage object ACL entries',
    method: 'POST',
    path: '/v1/storage/storage-object-acl/grant/{container_name_or_id}/{object_name_or_id}',
    expectedBody: grantObjectAclBody,
    expectedPath: `/v1/storage/storage-object-acl/grant/${CONTAINER_NAME}/${OBJECT_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
      object_name_or_id: OBJECT_NAME,
    },
    response: conjoinSuccess(storageObjectAclFixture(), { requestId: REQUEST_ID }),
    run: context =>
      createStorageObjectACLs(context.client).grantObjectAcl(CONTAINER_NAME, OBJECT_NAME, grantObjectAclBody),
    assertResult: result => expect(result).toEqual(storageObjectAclFixture()),
  },
  {
    name: 'revokes storage object ACL entries',
    method: 'POST',
    path: '/v1/storage/storage-object-acl/revoke/{container_name_or_id}/{object_name_or_id}',
    expectedBody: revokeObjectAclBody,
    expectedPath: `/v1/storage/storage-object-acl/revoke/${CONTAINER_NAME}/${OBJECT_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
      object_name_or_id: OBJECT_NAME,
    },
    response: conjoinSuccess(storageObjectAclFixture(), { requestId: REQUEST_ID }),
    run: context =>
      createStorageObjectACLs(context.client).revokeObjectAcl(CONTAINER_NAME, OBJECT_NAME, revokeObjectAclBody),
    assertResult: result => expect(result).toEqual(storageObjectAclFixture()),
  },
  {
    name: 'sets storage object public access',
    method: 'PATCH',
    path: '/v1/storage/storage-object-acl/public/{container_name_or_id}/{object_name_or_id}',
    expectedBody: setObjectPublicBody,
    expectedPath: `/v1/storage/storage-object-acl/public/${CONTAINER_NAME}/${OBJECT_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
      object_name_or_id: OBJECT_NAME,
    },
    response: conjoinSuccess(storageObjectAclFixture(), { requestId: REQUEST_ID }),
    run: context =>
      createStorageObjectACLs(context.client).setObjectPublic(CONTAINER_NAME, OBJECT_NAME, setObjectPublicBody),
    assertResult: result => expect(result).toEqual(storageObjectAclFixture()),
  },
])
