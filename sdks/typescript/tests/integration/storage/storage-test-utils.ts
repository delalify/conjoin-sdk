import { createConjoinClient } from '../../../src/core/client'
import type { ConjoinClient } from '../../../src/core/types'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../../src/core/version'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { startConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { describeSdkContractCases, type SdkContractCase } from '../sdk-contract/run-sdk-contract-cases'

export const API_KEY = 'ck_test_storage_contract'
export const CONJOIN_ACCOUNT_ID = 'account_123'
export const CONJOIN_PROJECT_ID = 'project_123'
export const CONTAINER_ID = 'storage_container_123'
export const CONTAINER_NAME = 'contract-container'
export const DATE_CREATED = '2026-05-16T00:00:00.000Z'
export const DATE_UPDATED = '2026-05-16T01:00:00.000Z'
export const OBJECT_ID = 'storage_object_123'
export const OBJECT_NAME = 'contract-object.txt'
export const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'
export const VERSION_ID = 'storage_version_123'

export type StorageContractTestContext = {
  client: ConjoinClient
  server: ConjoinContractServer
}

export type StorageSdkContractCase<TResult = unknown> = SdkContractCase<StorageContractTestContext, TResult>

export const startStorageContractTest = async (): Promise<StorageContractTestContext> => {
  const server = await startConjoinContractServer()
  const client = createConjoinClient({
    apiKey: API_KEY,
    baseUrl: server.baseUrl,
  })

  return {
    client,
    server,
  }
}

export const describeStorageSdkContractCases = (suiteName: string, cases: StorageSdkContractCase[]): void => {
  describeSdkContractCases({
    cases,
    defaultExpectedHeaders: {
      authorization: `Bearer ${API_KEY}`,
      'x-conjoin-api-version': DEFAULT_API_VERSION,
      'x-conjoin-sdk-version': SDK_VERSION,
    },
    startContext: startStorageContractTest,
    suiteName,
  })
}

export const storageContainerListQuery = {
  cursor: {
    next: 'cursor_next_123',
  },
  limit: 2,
  query: {
    name: CONTAINER_NAME,
  },
  sort: {
    date_created: 'desc' as const,
  },
}

export const storageExpectedContainerListQuery = {
  'cursor[next]': 'cursor_next_123',
  limit: '2',
  'query[name]': CONTAINER_NAME,
  'sort[date_created]': 'desc',
}

export const storageObjectListQuery = {
  cursor: {
    next: 'cursor_next_123',
  },
  has_label: 'contract',
  limit: 2,
  name: OBJECT_NAME,
  sort: {
    date_created: 'desc' as const,
  },
  sync_status: 'synced' as const,
}

export const storageExpectedObjectListQuery = {
  'cursor[next]': 'cursor_next_123',
  has_label: 'contract',
  limit: '2',
  name: OBJECT_NAME,
  'sort[date_created]': 'desc',
  sync_status: 'synced',
}

export const storageVersionListQuery = {
  cursor: {
    next: 'cursor_next_123',
  },
  limit: 2,
}

export const storageExpectedVersionListQuery = {
  'cursor[next]': 'cursor_next_123',
  limit: '2',
}

export const storageContainerFixture = (overrides: Record<string, unknown> = {}) => ({
  archived_date: null,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  container_id: CONTAINER_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  deletion_grace_period_days: 30,
  deletion_scheduled_at: null,
  deletion_status: 'none',
  is_public: false,
  lifecycle_policy: {
    delete_after_days: 365,
  },
  live_mode: false,
  metadata: {
    environment: 'contract',
  },
  migration_status: 'none',
  name: CONTAINER_NAME,
  reference_id: 'container_reference_123',
  region: 'us',
  settings: {
    acl: {
      conjoin_auth_enabled: true,
    },
    image_optimization: storageImageOptimizationSettingsFixture(),
  },
  storage_class: 'hot_storage',
  storage_class_transition_policy: {
    is_enabled: false,
    rules: [],
  },
  versioning_enabled: true,
  versioning_policy: {
    max_versions_to_keep: 10,
    version_retention_days: 90,
  },
  ...overrides,
})

export const storageImageOptimizationSettingsFixture = () => ({
  allowed_fits: ['cover' as const, 'contain' as const],
  allowed_formats: ['webp' as const, 'jpeg' as const],
  allowed_gravity_anchors: ['center' as const, 'top' as const],
  blur_enabled: true,
  border_radius_enabled: true,
  color_adjustments_enabled: true,
  dpr_settings: {
    default: 1,
    max: 3,
  },
  face_blur_enabled: true,
  face_detection_enabled: true,
  flip_enabled: true,
  grayscale_enabled: true,
  height_settings: {
    default: 720,
    max: 2160,
    min: 1,
  },
  is_enabled: true,
  metadata_mode: 'keep' as const,
  negate_enabled: true,
  progressive_jpeg_enabled: true,
  quality_settings: {
    defaultPerFormat: {
      avif: 75,
      jpeg: 80,
      png: 90,
      webp: 82,
    },
    max: 95,
  },
  rotation_enabled: true,
  save_data_quality_enabled: true,
  sharpen_enabled: true,
  still_frame_extraction_enabled: true,
  trim_enabled: true,
  watermark_enabled: false,
  width_settings: {
    default: 1280,
    max: 3840,
    min: 1,
  },
})

export const storageObjectFixture = (overrides: Record<string, unknown> = {}) => ({
  archived_date: null,
  checksum: 'sha256:contract',
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_auth_acl: [storageObjectAclFixture()],
  conjoin_project_id: CONJOIN_PROJECT_ID,
  container_id: CONTAINER_ID,
  content_type: 'text/plain',
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  description: 'Contract storage object',
  duplicate_of: null,
  generation_number: 1,
  is_public: false,
  labels: ['contract'],
  lifecycle_expires_at: null,
  live_mode: false,
  md5_hash: '0123456789abcdef0123456789abcdef',
  metadata: {
    environment: 'contract',
  },
  name: OBJECT_NAME,
  object_id: OBJECT_ID,
  object_metadata: {
    source: 'contract-test',
  },
  reference_id: 'object_reference_123',
  size: 128,
  sync_status: 'synced',
  version_id: VERSION_ID,
  ...overrides,
})

export const storageObjectAclFixture = (overrides: Record<string, unknown> = {}) => ({
  entity_id: 'auth_account_123',
  entity_type: 'conjoin_auth_account',
  role: 'viewer',
  ...overrides,
})

export const storageObjectVersionFixture = (overrides: Record<string, unknown> = {}) => ({
  checksum: 'sha256:contract',
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  container_id: CONTAINER_ID,
  content_type: 'text/plain',
  created_by: 'auth_account_123',
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  gcs_version_path: 'gs://contract-container/contract-object.txt#1',
  live_mode: false,
  md5_hash: '0123456789abcdef0123456789abcdef',
  metadata: {
    environment: 'contract',
  },
  name: OBJECT_NAME,
  object_id: OBJECT_ID,
  size: 128,
  version_id: VERSION_ID,
  ...overrides,
})
