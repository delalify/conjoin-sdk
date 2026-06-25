import { expect } from 'vitest'
import {
  createBillingEntities,
  createBillingEntitlementFeatures,
  createBillingEntitlementOverrides,
  createBillingFeatureAccesses,
} from '../../../src/billing'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  billingEntitlementCheckFixture,
  billingEntitlementFeatureFixture,
  billingEntitlementOverrideFixture,
  billingEntityFixture,
  billingFeatureUsageFixture,
} from './billing-platform-test-utils'
import {
  CUSTOMER_ID,
  conjoinMetaSuccess,
  DATE_DELETED,
  describeBillingSdkContractCases,
  ENTITY_ID,
  FEATURE_ID,
  FEATURE_KEY,
  PLAN_ID,
  SUBSCRIPTION_ID,
} from './billing-test-utils'

const createEntityBody = {
  account_data: {
    business_type: 'company' as const,
    company: {
      address: {
        city: 'Accra',
        country: 'GH',
        line1: '1 Independence Avenue',
        postal_code: '00233',
        state: 'Greater Accra',
      },
      email: 'billing@example.com',
      name: 'Conjoin Billing',
      phone_number: '+233201234567',
      registration_number: 'REG-123',
      structure: 'private_corporation' as const,
      tin: 'TIN-123',
    },
    country: 'GH',
  },
}
const updateEntityBody = {
  data: {
    payments: {
      is_enabled: true,
      statement_descriptor: 'CONJOIN',
    },
  },
  entity_id: ENTITY_ID,
}
const payoutBankAccountBody = {
  data: {
    account_holder_name: 'Conjoin Billing',
    account_holder_type: 'company' as const,
    account_number: '0001234567',
    country: 'GH',
    currency: 'GHS' as const,
    routing_number: 'GH123',
  },
  entity_id: ENTITY_ID,
}
const stripeOnboardingBody = {
  entity_id: ENTITY_ID,
  refresh_url: 'https://example.com/refresh',
  return_url: 'https://example.com/return',
}
const paystackCredentialsBody = {
  entity_id: ENTITY_ID,
  public_key: 'pk_test_123',
  secret_key: 'sk_test_123',
}
const onboardEntityBody = {
  business_name: 'Conjoin Billing',
  business_type: 'company' as const,
  country: 'GH',
  email: 'billing@example.com',
  payment_markets: [
    {
      country: 'GH',
      currency: 'GHS' as const,
    },
  ],
}
const createFeatureBody = {
  key: FEATURE_KEY,
  name: 'Seats',
  type: 'metered' as const,
}
const updateFeatureBody = { description: 'Updated seat access' }
const createOverrideBody = {
  customer_id: CUSTOMER_ID,
  feature_id: FEATURE_ID,
  included_units: 25,
  plan_id: PLAN_ID,
  subscription_id: SUBSCRIPTION_ID,
  value_type: 'numeric' as const,
}
const updateOverrideBody = { included_units: 50 }
const checkEntitlementBody = {
  customer_id: CUSTOMER_ID,
  feature_id: FEATURE_ID,
}
const trackFeatureUsageBody = {
  customer_id: CUSTOMER_ID,
  feature_id: FEATURE_ID,
  value: 1,
}

describeBillingSdkContractCases('Billing entity SDK contract integration', [
  {
    name: 'creates a billing entity',
    method: 'POST',
    path: '/v1/billing/entity/',
    expectedBody: createEntityBody,
    response: conjoinSuccess(billingEntityFixture(), { status: 201 }),
    run: context => createBillingEntities(context.client).create(createEntityBody),
    assertResult: result => expect(result).toEqual(billingEntityFixture()),
  },
  {
    name: 'reads a billing entity',
    method: 'GET',
    path: '/v1/billing/entity/',
    expectedQuery: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingEntityFixture()),
    run: context => createBillingEntities(context.client).read({ entity_id: ENTITY_ID }),
    assertResult: result => expect(result).toEqual(billingEntityFixture()),
  },
  {
    name: 'updates a billing entity',
    method: 'PATCH',
    path: '/v1/billing/entity/',
    expectedBody: updateEntityBody,
    response: conjoinSuccess(billingEntityFixture({ date_updated: '2026-05-16T03:00:00.000Z' })),
    run: context => createBillingEntities(context.client).update(updateEntityBody),
    assertResult: result => expect(result).toEqual(billingEntityFixture({ date_updated: '2026-05-16T03:00:00.000Z' })),
  },
  {
    name: 'creates a payout bank account',
    method: 'PUT',
    path: '/v1/billing/entity/payout/bank-account',
    expectedBody: payoutBankAccountBody,
    response: conjoinSuccess(billingEntityFixture()),
    run: context => createBillingEntities(context.client).createPayoutBankAccount(payoutBankAccountBody),
    assertResult: result => expect(result).toEqual(billingEntityFixture()),
  },
  {
    name: 'initiates Stripe onboarding',
    method: 'POST',
    path: '/v1/billing/entity/entities/onboarding/stripe',
    expectedBody: stripeOnboardingBody,
    response: conjoinMetaSuccess(),
    run: context => createBillingEntities(context.client).initiateStripeOnboarding(stripeOnboardingBody),
    assertResult: result => expect(result).toBeUndefined(),
  },
  {
    name: 'checks Stripe onboarding status',
    method: 'GET',
    path: '/v1/billing/entity/entities/onboarding/stripe',
    expectedQuery: {
      entity_id: ENTITY_ID,
    },
    response: conjoinMetaSuccess(),
    run: context => createBillingEntities(context.client).checkStripeOnboardingStatus({ entity_id: ENTITY_ID }),
    assertResult: result => expect(result).toBeUndefined(),
  },
  {
    name: 'submits Paystack credentials',
    method: 'POST',
    path: '/v1/billing/entity/entities/onboarding/paystack',
    expectedBody: paystackCredentialsBody,
    response: conjoinMetaSuccess(),
    run: context => createBillingEntities(context.client).submitPaystackCredentials(paystackCredentialsBody),
    assertResult: result => expect(result).toBeUndefined(),
  },
  {
    name: 'onboards billing entities',
    method: 'POST',
    path: '/v1/billing/entity/entities/onboard',
    expectedBody: onboardEntityBody,
    response: conjoinMetaSuccess(),
    run: context => createBillingEntities(context.client).onboard(onboardEntityBody),
    assertResult: result => expect(result).toBeUndefined(),
  },
])

describeBillingSdkContractCases('Billing entitlement feature SDK contract integration', [
  {
    name: 'creates an entitlement feature',
    method: 'POST',
    path: '/v1/billing/entitlement-feature/',
    expectedBody: createFeatureBody,
    response: conjoinSuccess(billingEntitlementFeatureFixture(), { status: 201 }),
    run: context => createBillingEntitlementFeatures(context.client).create(createFeatureBody),
    assertResult: result => expect(result).toEqual(billingEntitlementFeatureFixture()),
  },
  {
    name: 'lists entitlement features',
    method: 'GET',
    path: '/v1/billing/entitlement-feature/{feature_id_or_key}',
    expectedPath: `/v1/billing/entitlement-feature/${FEATURE_KEY}`,
    expectedPathParams: {
      feature_id_or_key: FEATURE_KEY,
    },
    expectedQuery: {
      'query[type]': 'metered',
    },
    response: conjoinList([billingEntitlementFeatureFixture()]),
    run: context => createBillingEntitlementFeatures(context.client).list(FEATURE_KEY, { query: { type: 'metered' } }),
    assertResult: result => expect(result).toMatchObject({ data: [billingEntitlementFeatureFixture()] }),
  },
  {
    name: 'updates an entitlement feature',
    method: 'PUT',
    path: '/v1/billing/entitlement-feature/{feature_id_or_key}',
    expectedBody: updateFeatureBody,
    expectedPath: `/v1/billing/entitlement-feature/${FEATURE_KEY}`,
    expectedPathParams: {
      feature_id_or_key: FEATURE_KEY,
    },
    response: conjoinSuccess(billingEntitlementFeatureFixture({ description: 'Updated seat access' })),
    run: context => createBillingEntitlementFeatures(context.client).update(FEATURE_KEY, updateFeatureBody),
    assertResult: result =>
      expect(result).toEqual(billingEntitlementFeatureFixture({ description: 'Updated seat access' })),
  },
  {
    name: 'archives an entitlement feature',
    method: 'PATCH',
    path: '/v1/billing/entitlement-feature/{feature_id_or_key}/archive',
    expectedPath: `/v1/billing/entitlement-feature/${FEATURE_KEY}/archive`,
    expectedPathParams: {
      feature_id_or_key: FEATURE_KEY,
    },
    response: conjoinSuccess(billingEntitlementFeatureFixture({ date_deleted: DATE_DELETED, is_active: false })),
    run: context => createBillingEntitlementFeatures(context.client).archive(FEATURE_KEY),
    assertResult: result =>
      expect(result).toEqual(billingEntitlementFeatureFixture({ date_deleted: DATE_DELETED, is_active: false })),
  },
])

describeBillingSdkContractCases('Billing entitlement override SDK contract integration', [
  {
    name: 'creates an entitlement override',
    method: 'POST',
    path: '/v1/billing/entitlement-override/{entity_id}',
    expectedBody: createOverrideBody,
    expectedPath: `/v1/billing/entitlement-override/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingEntitlementOverrideFixture(), { status: 201 }),
    run: context => createBillingEntitlementOverrides(context.client).create(ENTITY_ID, createOverrideBody),
    assertResult: result => expect(result).toEqual(billingEntitlementOverrideFixture()),
  },
  {
    name: 'lists entitlement overrides',
    method: 'GET',
    path: '/v1/billing/entitlement-override/{entity_id}',
    expectedPath: `/v1/billing/entitlement-override/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      'query[customer_id]': CUSTOMER_ID,
    },
    response: conjoinList([billingEntitlementOverrideFixture()]),
    run: context =>
      createBillingEntitlementOverrides(context.client).list(ENTITY_ID, { query: { customer_id: CUSTOMER_ID } }),
    assertResult: result => expect(result).toMatchObject({ data: [billingEntitlementOverrideFixture()] }),
  },
  {
    name: 'updates an entitlement override',
    method: 'PUT',
    path: '/v1/billing/entitlement-override/{entity_id}/{override_id}',
    expectedBody: updateOverrideBody,
    expectedPath: `/v1/billing/entitlement-override/${ENTITY_ID}/override_123`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      override_id: 'override_123',
    },
    response: conjoinSuccess(billingEntitlementOverrideFixture({ included_units: 50 })),
    run: context =>
      createBillingEntitlementOverrides(context.client).update(ENTITY_ID, 'override_123', updateOverrideBody),
    assertResult: result => expect(result).toEqual(billingEntitlementOverrideFixture({ included_units: 50 })),
  },
  {
    name: 'deletes an entitlement override',
    method: 'DELETE',
    path: '/v1/billing/entitlement-override/{entity_id}/{override_id}',
    expectedPath: `/v1/billing/entitlement-override/${ENTITY_ID}/override_123`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      override_id: 'override_123',
    },
    response: conjoinSuccess(billingEntitlementOverrideFixture({ date_deleted: DATE_DELETED, is_active: false })),
    run: context => createBillingEntitlementOverrides(context.client).delete(ENTITY_ID, 'override_123'),
    assertResult: result =>
      expect(result).toEqual(billingEntitlementOverrideFixture({ date_deleted: DATE_DELETED, is_active: false })),
  },
])

describeBillingSdkContractCases('Billing feature access SDK contract integration', [
  {
    name: 'checks billing entitlement',
    method: 'POST',
    path: '/v1/billing/check/{entity_id}',
    expectedBody: checkEntitlementBody,
    expectedPath: `/v1/billing/check/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingEntitlementCheckFixture()),
    run: context => createBillingFeatureAccesses(context.client).checkEntitlement(ENTITY_ID, checkEntitlementBody),
    assertResult: result => expect(result).toEqual(billingEntitlementCheckFixture()),
  },
  {
    name: 'tracks billing feature usage',
    method: 'POST',
    path: '/v1/billing/track/{entity_id}',
    expectedBody: trackFeatureUsageBody,
    expectedPath: `/v1/billing/track/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingFeatureUsageFixture()),
    run: context => createBillingFeatureAccesses(context.client).trackFeatureUsage(ENTITY_ID, trackFeatureUsageBody),
    assertResult: result => expect(result).toEqual(billingFeatureUsageFixture()),
  },
])
