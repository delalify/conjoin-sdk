import { createConjoinClient } from '../../../src/core/client'
import type { ConjoinClient } from '../../../src/core/types'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../../src/core/version'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { startConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { describeSdkContractCases, type SdkContractCase } from '../sdk-contract/run-sdk-contract-cases'

export const API_KEY = 'ck_test_cloud_contract'
export const ACCOUNT_ID = 'account_123'
export const API_KEY_ID = 'api_key_123'
export const ENTITY_ID = 'entity_123'
export const ORGANIZATION_ID = 'organization_123'
export const PROJECT_ID = 'project_123'
export const ROLE_ID = 'role_123'
export const WEBHOOK_ID = 'webhook_123'
export const ZONE_ID = 'zone_123'
export const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'
export const DATE_CREATED = '2026-05-16T00:00:00.000Z'

export type CloudContractTestContext = {
  client: ConjoinClient
  server: ConjoinContractServer
}

export type CloudSdkContractCase<TResult = unknown> = SdkContractCase<CloudContractTestContext, TResult>

export const startCloudContractTest = async (): Promise<CloudContractTestContext> => {
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

export const describeCloudSdkContractCases = (suiteName: string, cases: CloudSdkContractCase[]): void => {
  describeSdkContractCases({
    cases,
    defaultExpectedHeaders: {
      authorization: `Bearer ${API_KEY}`,
      'x-conjoin-api-version': DEFAULT_API_VERSION,
      'x-conjoin-sdk-version': SDK_VERSION,
    },
    startContext: startCloudContractTest,
    suiteName,
  })
}

export const cloudAccountFixture = (overrides: Record<string, unknown> = {}) => ({
  approved_services: [],
  billing_customer_id: 'billing_customer_123',
  billing_default_currency: 'usd',
  billing_subscription_id: 'subscription_123',
  cloud_account_id: ACCOUNT_ID,
  date_created: DATE_CREATED,
  entity_id: ENTITY_ID,
  inactivity_status: {
    actor: null,
    date: null,
    reason: null,
  },
  is_active: true,
  onboarding_status: {
    billing: {
      completed_at: DATE_CREATED,
      status: 'completed',
    },
    service_agreement: {
      completed_at: DATE_CREATED,
      status: 'completed',
    },
  },
  plan_id: 'plan_123',
  service_agreement: {
    accepted_at: DATE_CREATED,
    ip_address: '127.0.0.1',
    is_accepted: true,
  },
  services_in_use: [],
  ...overrides,
})

export const apiKeyFixture = (overrides: Record<string, unknown> = {}) => ({
  api_key_id: API_KEY_ID,
  date_created: DATE_CREATED,
  entity_id: ENTITY_ID,
  has_expired: false,
  name: 'Primary API key',
  project_id: PROJECT_ID,
  roles: ['admin'],
  test_mode: true,
  ...overrides,
})

export const auditLogFixture = (overrides: Record<string, unknown> = {}) => ({
  actor: {
    id: 'actor_123',
    role: 'admin',
    type: 'user',
  },
  audit_id: 'audit_123',
  categories: ['admin'],
  cloud_account_id: ACCOUNT_ID,
  conjoin_request_id: REQUEST_ID,
  date_created: DATE_CREATED,
  entity_id: ENTITY_ID,
  event_code: 'cloud-spend_controls-updated',
  idempotency_key: 'idempotency_123',
  organization_id: ORGANIZATION_ID,
  occurred_at: DATE_CREATED,
  payload: {},
  payload_size: 2,
  project_id: PROJECT_ID,
  recorded_at: DATE_CREATED,
  schema_version: 1,
  service: 'cloud',
  ...overrides,
})

export const brandingFixture = (overrides: Record<string, unknown> = {}) => ({
  branding_id: 'branding_123',
  date_created: DATE_CREATED,
  project_id: PROJECT_ID,
  schema_version: 1,
  ...overrides,
})

export const organizationBrandingFixture = (overrides: Record<string, unknown> = {}) => ({
  date_created: DATE_CREATED,
  organization_id: ORGANIZATION_ID,
  override_id: 'branding_override_123',
  schema_version: 1,
  ...overrides,
})

export const organizationFixture = (overrides: Record<string, unknown> = {}) => ({
  cloud_account_id: ACCOUNT_ID,
  date_created: DATE_CREATED,
  entity_id: ENTITY_ID,
  name: 'Demo organization',
  organization_id: ORGANIZATION_ID,
  ...overrides,
})

export const planFixture = (overrides: Record<string, unknown> = {}) => ({
  billing_bundle_id: 'bundle_123',
  cloud_plan_id: 'plan_123',
  currency: 'usd',
  date_created: DATE_CREATED,
  name: 'Starter',
  plan_items: [],
  slug: 'starter',
  status: 'active',
  ...overrides,
})

export const projectFixture = (overrides: Record<string, unknown> = {}) => ({
  cloud_account_id: ACCOUNT_ID,
  date_created: DATE_CREATED,
  entity_id: ENTITY_ID,
  organization_id: ORGANIZATION_ID,
  project_id: PROJECT_ID,
  tags: ['contract'],
  ...overrides,
})

export const publishableKeyFixture = (overrides: Record<string, unknown> = {}) => ({
  allowed_domains: ['example.com'],
  date_created: DATE_CREATED,
  is_active: true,
  project_id: PROJECT_ID,
  publishable_key_id: 'publishable_key_123',
  test_mode: true,
  ...overrides,
})

export const roleFixture = (overrides: Record<string, unknown> = {}) => ({
  cloud_account_id: ACCOUNT_ID,
  date_created: DATE_CREATED,
  entity_id: ENTITY_ID,
  name: 'project.admin',
  role_id: ROLE_ID,
  title: 'Project Admin',
  total_permissions: 1,
  ...overrides,
})

export const skuCatalogFixture = (overrides: Record<string, unknown> = {}) => ({
  category: 'compute',
  description: 'Compute usage',
  meter_type: 'usage',
  name: 'Compute',
  service: 'cloud',
  sku_code: 'cloud.compute',
  sku_id: 'sku_123',
  unit_label: 'request',
  ...overrides,
})

export const skuQuotaFixture = (overrides: Record<string, unknown> = {}) => ({
  cloud_sku_id: 'sku_123',
  cloud_sku_quota_id: 'quota_123',
  date_created: DATE_CREATED,
  effective_from: DATE_CREATED,
  entity_id: ENTITY_ID,
  quota_type: 'monthly',
  quota_value: 100,
  scope_id: PROJECT_ID,
  scope_type: 'project',
  unit_type: 'request',
  ...overrides,
})

export const spendControlFixture = (overrides: Record<string, unknown> = {}) => ({
  ai_circuit_breaker_limits: [],
  alert_email_enabled: true,
  alert_sms_enabled: false,
  alert_thresholds: [],
  alert_webhook_enabled: false,
  cloud_account_id: ACCOUNT_ID,
  currency: 'usd',
  date_created: DATE_CREATED,
  overage_budget_micros: 1_000_000,
  spend_control_id: 'spend_control_123',
  ...overrides,
})

export const spendControlUsageFixture = (overrides: Record<string, unknown> = {}) => ({
  ai_usage: [],
  billing_cycle_resets_at: DATE_CREATED,
  billing_period: '2026-05',
  cloud_account_id: ACCOUNT_ID,
  currency: 'usd',
  overage_budget_micros: 1_000_000,
  overage_used_micros: 250_000,
  service_overage_breakdown: [],
  ...overrides,
})

export const webhookFixture = (overrides: Record<string, unknown> = {}) => ({
  cloud_account_id: ACCOUNT_ID,
  date_created: DATE_CREATED,
  entity_id: ENTITY_ID,
  events: ['cloud-spend_controls-updated'],
  is_active: true,
  project_id: PROJECT_ID,
  url: 'https://example.com/webhook',
  webhook_id: WEBHOOK_ID,
  ...overrides,
})

export const webhookEventFixture = (overrides: Record<string, unknown> = {}) => ({
  event_id: 'event_123',
  name: 'cloud-spend_controls-updated',
  service: 'cloud',
  ...overrides,
})

export const zoneFixture = (overrides: Record<string, unknown> = {}) => ({
  cloud_account_id: ACCOUNT_ID,
  date_created: DATE_CREATED,
  dkim_authority: 'conjoin',
  dns_records: [
    {
      id: 'dns_record_123',
      last_verified: null,
      type: 'TXT',
      value: 'v=spf1 include:example.com ~all',
    },
  ],
  domain: 'example.com',
  entity_id: ENTITY_ID,
  external_dns_records: [
    {
      id: 'external_dns_record_123',
      type: 'TXT',
      value: 'external',
    },
  ],
  is_internal_zone: false,
  project_id: PROJECT_ID,
  provider_id: 'provider_123',
  status: 'pending',
  zone_id: ZONE_ID,
  ...overrides,
})
