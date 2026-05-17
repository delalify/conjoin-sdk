import {
  ACTIVATION_ID,
  BUNDLE_ID,
  BUNDLE_REFERENCE_ID,
  CUSTOMER_ID,
  DATE_CREATED,
  DATE_UPDATED,
  ENTITY_ID,
  PRICE_ID,
  PRICE_REFERENCE_ID,
  PRODUCT_ID,
  PRODUCT_REFERENCE_ID,
} from './billing-test-utils'

export const billingProductFixture = (overrides: Record<string, unknown> = {}) => ({
  billing_metadata: {},
  conjoin_account_id: 'account_123',
  conjoin_project_id: 'project_123',
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  entity_id: ENTITY_ID,
  is_active: true,
  live_mode: false,
  name: 'Contract Product',
  product_id: PRODUCT_ID,
  reference_id: PRODUCT_REFERENCE_ID,
  unit_label: 'seat',
  ...overrides,
})

export const billingPriceFixture = (overrides: Record<string, unknown> = {}) => ({
  amount: 1000,
  billing_metadata: {},
  billing_scheme: 'per_unit',
  conjoin_account_id: 'account_123',
  conjoin_project_id: 'project_123',
  currency: 'GHS',
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  entity_id: ENTITY_ID,
  is_active: true,
  live_mode: false,
  price_id: PRICE_ID,
  product_id: PRODUCT_ID,
  reference_id: PRICE_REFERENCE_ID,
  type: 'recurring',
  ...overrides,
})

export const billingPriceBundleFixture = (overrides: Record<string, unknown> = {}) => ({
  authoring_mode: 'linked',
  auto_activate: false,
  conjoin_account_id: 'account_123',
  conjoin_project_id: 'project_123',
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  entity_id: ENTITY_ID,
  is_default_tier: false,
  items: [
    {
      default_quantity: 1,
      price_id: PRICE_ID,
      quantity_adjustable: false,
      required: true,
    },
  ],
  live_mode: false,
  name: 'Starter bundle',
  price_bundle_id: BUNDLE_ID,
  reference_id: BUNDLE_REFERENCE_ID,
  status: 'draft',
  ...overrides,
})

export const billingBundleActivationFixture = (overrides: Record<string, unknown> = {}) => ({
  activation_id: ACTIVATION_ID,
  conjoin_account_id: 'account_123',
  conjoin_project_id: 'project_123',
  customer_id: CUSTOMER_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  entity_id: ENTITY_ID,
  live_mode: false,
  price_bundle_id: BUNDLE_ID,
  resolved_items: [],
  status: 'active',
  ...overrides,
})

export const billingBundleActivationBatchFixture = (overrides: Record<string, unknown> = {}) => ({
  activations: [billingBundleActivationFixture()],
  batch_id: 'bundle_batch_123',
  ...overrides,
})

export const billingBundleTransitionsFixture = (overrides: Record<string, unknown> = {}) => ({
  active_addons: {
    data: [],
    has_more: false,
  },
  available_addons: {
    data: [],
    has_more: false,
  },
  available_downgrades: {
    data: [],
    has_more: false,
  },
  available_upgrades: {
    data: [],
    has_more: false,
  },
  current_tier: null,
  customer_id: CUSTOMER_ID,
  entity_id: ENTITY_ID,
  pending_tier_change: null,
  ...overrides,
})
