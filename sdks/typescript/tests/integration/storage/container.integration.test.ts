import { expect } from 'vitest'
import { createStorageContainers } from '../../../src/storage'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  CONTAINER_NAME,
  describeStorageSdkContractCases,
  REQUEST_ID,
  storageContainerFixture,
  storageContainerListQuery,
  storageExpectedContainerListQuery,
  storageImageOptimizationSettingsFixture,
} from './storage-test-utils'

const createContainerBody = {
  is_public: false,
  lifecycle_policy: {
    delete_after_days: 365,
  },
  name: CONTAINER_NAME,
  region: 'us' as const,
  storage_class: 'hot_storage' as const,
}
const updateLifecyclePolicyBody = {
  delete_after_days: 180,
}
const updateSettingsBody = {
  acl: {
    conjoin_auth_enabled: true,
  },
  image_optimization: storageImageOptimizationSettingsFixture(),
}
const requestDeletionBody = {
  grace_period_days: 14,
}
const changeClassBody = {
  storage_class: 'warm_storage' as const,
}
const updateTransitionPolicyBody = {
  is_enabled: true,
  rules: [
    {
      after_days: 30,
      from_class: 'hot_storage' as const,
      to_class: 'warm_storage' as const,
    },
  ],
}

describeStorageSdkContractCases('Storage container SDK contract integration', [
  {
    name: 'creates a storage container',
    method: 'POST',
    path: '/v1/storage/storage-container/new',
    expectedBody: createContainerBody,
    response: conjoinSuccess(storageContainerFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createStorageContainers(context.client).create(createContainerBody),
    assertResult: result => expect(result).toEqual(storageContainerFixture()),
  },
  {
    name: 'lists storage containers',
    method: 'GET',
    path: '/v1/storage/storage-container/list',
    expectedQuery: storageExpectedContainerListQuery,
    expectedRawBody: '',
    response: conjoinList([storageContainerFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createStorageContainers(context.client).list(storageContainerListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [storageContainerFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads a storage container',
    method: 'GET',
    path: '/v1/storage/storage-container/details/{container_name_or_id}',
    expectedPath: `/v1/storage/storage-container/details/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    expectedRawBody: '',
    response: conjoinSuccess(storageContainerFixture(), { requestId: REQUEST_ID }),
    run: context => createStorageContainers(context.client).read(CONTAINER_NAME),
    assertResult: result => expect(result).toEqual(storageContainerFixture()),
  },
  {
    name: 'archives a storage container',
    method: 'PATCH',
    path: '/v1/storage/storage-container/archive/{container_name_or_id}',
    expectedPath: `/v1/storage/storage-container/archive/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    expectedRawBody: '',
    response: conjoinSuccess(storageContainerFixture({ archived_date: '2026-05-16T02:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createStorageContainers(context.client).archive(CONTAINER_NAME),
    assertResult: result =>
      expect(result).toEqual(storageContainerFixture({ archived_date: '2026-05-16T02:00:00.000Z' })),
  },
  {
    name: 'restores a storage container',
    method: 'PATCH',
    path: '/v1/storage/storage-container/restore/{container_name_or_id}',
    expectedPath: `/v1/storage/storage-container/restore/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    expectedRawBody: '',
    response: conjoinSuccess(storageContainerFixture({ archived_date: null }), { requestId: REQUEST_ID }),
    run: context => createStorageContainers(context.client).restore(CONTAINER_NAME),
    assertResult: result => expect(result).toEqual(storageContainerFixture({ archived_date: null })),
  },
  {
    name: 'updates a storage container lifecycle policy',
    method: 'PATCH',
    path: '/v1/storage/storage-container/lifecycle-policy/{container_name_or_id}',
    expectedBody: updateLifecyclePolicyBody,
    expectedPath: `/v1/storage/storage-container/lifecycle-policy/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    response: conjoinSuccess(
      storageContainerFixture({
        lifecycle_policy: {
          delete_after_days: 180,
        },
      }),
      { requestId: REQUEST_ID },
    ),
    run: context =>
      createStorageContainers(context.client).updateLifecyclePolicy(CONTAINER_NAME, updateLifecyclePolicyBody),
    assertResult: result =>
      expect(result).toEqual(
        storageContainerFixture({
          lifecycle_policy: {
            delete_after_days: 180,
          },
        }),
      ),
  },
  {
    name: 'updates storage container settings',
    method: 'PATCH',
    path: '/v1/storage/storage-container/settings/{container_name_or_id}',
    expectedBody: updateSettingsBody,
    expectedPath: `/v1/storage/storage-container/settings/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    response: conjoinSuccess(storageContainerFixture({ settings: updateSettingsBody }), { requestId: REQUEST_ID }),
    run: context => createStorageContainers(context.client).updateSettings(CONTAINER_NAME, updateSettingsBody),
    assertResult: result => expect(result).toEqual(storageContainerFixture({ settings: updateSettingsBody })),
  },
  {
    name: 'requests storage container deletion',
    method: 'DELETE',
    path: '/v1/storage/storage-container/{container_name_or_id}',
    expectedBody: requestDeletionBody,
    expectedPath: `/v1/storage/storage-container/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    response: conjoinSuccess(
      storageContainerFixture({
        deletion_grace_period_days: 14,
        deletion_scheduled_at: '2026-05-30T00:00:00.000Z',
        deletion_status: 'scheduled',
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => createStorageContainers(context.client).requestDeletion(CONTAINER_NAME, requestDeletionBody),
    assertResult: result =>
      expect(result).toEqual(
        storageContainerFixture({
          deletion_grace_period_days: 14,
          deletion_scheduled_at: '2026-05-30T00:00:00.000Z',
          deletion_status: 'scheduled',
        }),
      ),
  },
  {
    name: 'cancels storage container deletion',
    method: 'PATCH',
    path: '/v1/storage/storage-container/cancel-deletion/{container_name_or_id}',
    expectedPath: `/v1/storage/storage-container/cancel-deletion/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    expectedRawBody: '',
    response: conjoinSuccess(storageContainerFixture({ deletion_status: 'none' }), { requestId: REQUEST_ID }),
    run: context => createStorageContainers(context.client).cancelDeletion(CONTAINER_NAME),
    assertResult: result => expect(result).toEqual(storageContainerFixture({ deletion_status: 'none' })),
  },
  {
    name: 'changes storage container class',
    method: 'PATCH',
    path: '/v1/storage/storage-container/storage-class/{container_name_or_id}',
    expectedBody: changeClassBody,
    expectedPath: `/v1/storage/storage-container/storage-class/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    response: conjoinSuccess(storageContainerFixture({ storage_class: 'warm_storage' }), { requestId: REQUEST_ID }),
    run: context => createStorageContainers(context.client).changeClass(CONTAINER_NAME, changeClassBody),
    assertResult: result => expect(result).toEqual(storageContainerFixture({ storage_class: 'warm_storage' })),
  },
  {
    name: 'updates storage container transition policy',
    method: 'PATCH',
    path: '/v1/storage/storage-container/transition-policy/{container_name_or_id}',
    expectedBody: updateTransitionPolicyBody,
    expectedPath: `/v1/storage/storage-container/transition-policy/${CONTAINER_NAME}`,
    expectedPathParams: {
      container_name_or_id: CONTAINER_NAME,
    },
    response: conjoinSuccess(
      storageContainerFixture({
        storage_class_transition_policy: updateTransitionPolicyBody,
      }),
      { requestId: REQUEST_ID },
    ),
    run: context =>
      createStorageContainers(context.client).updateTransitionPolicy(CONTAINER_NAME, updateTransitionPolicyBody),
    assertResult: result =>
      expect(result).toEqual(
        storageContainerFixture({
          storage_class_transition_policy: updateTransitionPolicyBody,
        }),
      ),
  },
])
