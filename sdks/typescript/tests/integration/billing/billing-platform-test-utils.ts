import {
  CUSTOMER_ID,
  DATE_CREATED,
  DATE_UPDATED,
  ENTITY_ID,
  FEATURE_ID,
  FEATURE_KEY,
  SCHEDULE_ID,
  SUBSCRIPTION_ID,
} from './billing-test-utils'

export const billingEntityFixture = (overrides: Record<string, unknown> = {}) => ({
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  entity_id: ENTITY_ID,
  is_active: true,
  ...overrides,
})

export const billingEntitlementFeatureFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: 'account_123',
  conjoin_project_id: 'project_123',
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  description: 'Seat access',
  feature_id: FEATURE_ID,
  is_active: true,
  key: FEATURE_KEY,
  live_mode: false,
  name: 'Seats',
  type: 'metered',
  ...overrides,
})

export const billingEntitlementOverrideFixture = (overrides: Record<string, unknown> = {}) => ({
  conjoin_account_id: 'account_123',
  conjoin_project_id: 'project_123',
  customer_id: CUSTOMER_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  effective_from: DATE_CREATED,
  entity_id: ENTITY_ID,
  feature_id: FEATURE_ID,
  included_units: 25,
  is_active: true,
  live_mode: false,
  override_id: 'override_123',
  reason: 'contract test',
  soft_limit: false,
  value_type: 'numeric',
  ...overrides,
})

export const billingEntitlementCheckFixture = (overrides: Record<string, unknown> = {}) => ({
  allowed: true,
  balance: 10,
  consumed: 1,
  feature_id: FEATURE_ID,
  feature_key: FEATURE_KEY,
  feature_type: 'metered',
  granted_by: ['subscription'],
  limit: 25,
  used: 15,
  ...overrides,
})

export const billingFeatureUsageFixture = (overrides: Record<string, unknown> = {}) => ({
  customer_id: CUSTOMER_ID,
  feature_id: FEATURE_ID,
  tracked: true,
  value: 1,
  ...overrides,
})

export const billingSettingsFixture = (overrides: Record<string, unknown> = {}) => ({
  auto_receipt_generation: true,
  cancellation_fallback_behavior: 'no_fallback',
  conjoin_account_id: 'account_123',
  conjoin_project_id: 'project_123',
  credit_auto_apply: true,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  incompatible_addon_behavior: 'block',
  live_mode: false,
  settings_id: 'settings_123',
  tax_reporting_enabled: true,
  ...overrides,
})

export const billingSubscriptionFixture = (overrides: Record<string, unknown> = {}) => ({
  currency: 'GHS',
  customer_id: CUSTOMER_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  entity_id: ENTITY_ID,
  invoicing_option: 'automatic_charge',
  live_mode: false,
  payment_strategy: 'allow_incomplete',
  plans: [],
  reference_id: 'subscription_reference_123',
  start_date: DATE_CREATED,
  status: 'active',
  subscription_id: SUBSCRIPTION_ID,
  ...overrides,
})

export const billingSubscriptionCycleFixture = (overrides: Record<string, unknown> = {}) => ({
  amount: 1000,
  conjoin_account_id: 'account_123',
  conjoin_project_id: 'project_123',
  currency: 'GHS',
  cycle_id: 'cycle_123',
  cycle_sequence: 1,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  entity_id: ENTITY_ID,
  live_mode: false,
  period_end: '2026-06-16T00:00:00.000Z',
  period_start: DATE_CREATED,
  status: 'open',
  subscription_id: SUBSCRIPTION_ID,
  ...overrides,
})

export const billingSubscriptionScheduleFixture = (overrides: Record<string, unknown> = {}) => ({
  customer_id: CUSTOMER_ID,
  date_created: DATE_CREATED,
  end_behavior: 'release',
  entity_id: ENTITY_ID,
  live_mode: false,
  phases: [],
  schedule_id: SCHEDULE_ID,
  status: 'active',
  subscription_id: SUBSCRIPTION_ID,
  ...overrides,
})

export const billingTaxJurisdictionFixture = (overrides: Record<string, unknown> = {}) => ({
  country: 'GH',
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  effective_from: DATE_CREATED,
  is_active: true,
  jurisdiction_id: 'tax_jurisdiction_123',
  live_mode: false,
  rate: 12.5,
  tax_type: 'vat',
  timezone: 'Africa/Accra',
  ...overrides,
})

export const billingTaxRateFixture = (overrides: Record<string, unknown> = {}) => ({
  country: 'GH',
  rate: 12.5,
  tax_type: 'vat',
  ...overrides,
})
