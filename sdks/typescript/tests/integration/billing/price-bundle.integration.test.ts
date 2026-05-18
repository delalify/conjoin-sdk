import { expect } from 'vitest'
import { createBillingPriceBundles } from '../../../src/billing'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  billingBundleActivationBatchFixture,
  billingBundleActivationFixture,
  billingBundleTransitionsFixture,
  billingPriceBundleFixture,
} from './billing-catalog-test-utils'
import {
  ACTIVATION_ID,
  BUNDLE_REFERENCE_ID,
  CUSTOMER_ID,
  DATE_DELETED,
  describeBillingSdkContractCases,
  ENTITY_ID,
} from './billing-test-utils'

const createBundleBody = {
  items: [
    {
      default_quantity: 1,
      price_id: 'price_123',
    },
  ],
  name: 'Starter bundle',
  reference_id: BUNDLE_REFERENCE_ID,
}
const updateBundleBody = { name: 'Updated bundle' }
const activateBundleBody = {
  bundles: [
    {
      bundle_reference: BUNDLE_REFERENCE_ID,
    },
  ],
  customer_id: CUSTOMER_ID,
}
const deactivateBundleBody = { reason: 'contract test' }

describeBillingSdkContractCases('Billing price bundle SDK contract integration', [
  {
    name: 'creates a price bundle',
    method: 'POST',
    path: '/v1/billing/price-bundle/{entity_id}',
    expectedBody: createBundleBody,
    expectedPath: `/v1/billing/price-bundle/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingPriceBundleFixture(), { status: 201 }),
    run: context => createBillingPriceBundles(context.client).create(ENTITY_ID, createBundleBody),
    assertResult: result => expect(result).toEqual(billingPriceBundleFixture()),
  },
  {
    name: 'lists price bundles',
    method: 'GET',
    path: '/v1/billing/price-bundle/{entity_id}/{reference_id}',
    expectedPath: `/v1/billing/price-bundle/${ENTITY_ID}/${BUNDLE_REFERENCE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: BUNDLE_REFERENCE_ID,
    },
    expectedQuery: {
      'query[status]': 'draft',
    },
    response: conjoinList([billingPriceBundleFixture()]),
    run: context =>
      createBillingPriceBundles(context.client).list(ENTITY_ID, BUNDLE_REFERENCE_ID, { query: { status: 'draft' } }),
    assertResult: result => expect(result).toMatchObject({ data: [billingPriceBundleFixture()] }),
  },
  {
    name: 'updates a price bundle',
    method: 'PUT',
    path: '/v1/billing/price-bundle/{entity_id}/{reference_id}',
    expectedBody: updateBundleBody,
    expectedPath: `/v1/billing/price-bundle/${ENTITY_ID}/${BUNDLE_REFERENCE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: BUNDLE_REFERENCE_ID,
    },
    response: conjoinSuccess(billingPriceBundleFixture({ name: 'Updated bundle' })),
    run: context => createBillingPriceBundles(context.client).update(ENTITY_ID, BUNDLE_REFERENCE_ID, updateBundleBody),
    assertResult: result => expect(result).toEqual(billingPriceBundleFixture({ name: 'Updated bundle' })),
  },
  {
    name: 'archives a price bundle',
    method: 'PATCH',
    path: '/v1/billing/price-bundle/{entity_id}/{reference_id}/archive',
    expectedPath: `/v1/billing/price-bundle/${ENTITY_ID}/${BUNDLE_REFERENCE_ID}/archive`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: BUNDLE_REFERENCE_ID,
    },
    response: conjoinSuccess(billingPriceBundleFixture({ date_deleted: DATE_DELETED })),
    run: context => createBillingPriceBundles(context.client).archive(ENTITY_ID, BUNDLE_REFERENCE_ID),
    assertResult: result => expect(result).toEqual(billingPriceBundleFixture({ date_deleted: DATE_DELETED })),
  },
  {
    name: 'restores a price bundle',
    method: 'PATCH',
    path: '/v1/billing/price-bundle/{entity_id}/{reference_id}/restore',
    expectedPath: `/v1/billing/price-bundle/${ENTITY_ID}/${BUNDLE_REFERENCE_ID}/restore`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: BUNDLE_REFERENCE_ID,
    },
    response: conjoinSuccess(billingPriceBundleFixture({ date_deleted: null })),
    run: context => createBillingPriceBundles(context.client).restore(ENTITY_ID, BUNDLE_REFERENCE_ID),
    assertResult: result => expect(result).toEqual(billingPriceBundleFixture({ date_deleted: null })),
  },
  {
    name: 'publishes a price bundle',
    method: 'POST',
    path: '/v1/billing/price-bundle/{entity_id}/{reference_id}/publish',
    expectedPath: `/v1/billing/price-bundle/${ENTITY_ID}/${BUNDLE_REFERENCE_ID}/publish`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: BUNDLE_REFERENCE_ID,
    },
    response: conjoinSuccess(billingPriceBundleFixture({ status: 'active' })),
    run: context => createBillingPriceBundles(context.client).publish(ENTITY_ID, BUNDLE_REFERENCE_ID),
    assertResult: result => expect(result).toEqual(billingPriceBundleFixture({ status: 'active' })),
  },
  {
    name: 'activates a price bundle',
    method: 'POST',
    path: '/v1/billing/price-bundle/{entity_id}/activate',
    expectedBody: activateBundleBody,
    expectedPath: `/v1/billing/price-bundle/${ENTITY_ID}/activate`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingBundleActivationBatchFixture(), { status: 201 }),
    run: context => createBillingPriceBundles(context.client).activate(ENTITY_ID, activateBundleBody),
    assertResult: result => expect(result).toEqual(billingBundleActivationBatchFixture()),
  },
  {
    name: 'reads price bundle activations',
    method: 'GET',
    path: '/v1/billing/price-bundle/{entity_id}/activations/{customer_id}',
    expectedPath: `/v1/billing/price-bundle/${ENTITY_ID}/activations/${CUSTOMER_ID}`,
    expectedPathParams: {
      customer_id: CUSTOMER_ID,
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      'query[status]': 'active',
    },
    response: conjoinList([billingBundleActivationFixture()]),
    run: context =>
      createBillingPriceBundles(context.client).readActivations(ENTITY_ID, CUSTOMER_ID, {
        query: { status: 'active' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [billingBundleActivationFixture()] }),
  },
  {
    name: 'deactivates a price bundle',
    method: 'POST',
    path: '/v1/billing/price-bundle/{entity_id}/deactivate/{activation_id}',
    expectedBody: deactivateBundleBody,
    expectedPath: `/v1/billing/price-bundle/${ENTITY_ID}/deactivate/${ACTIVATION_ID}`,
    expectedPathParams: {
      activation_id: ACTIVATION_ID,
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingBundleActivationFixture({ status: 'canceled' })),
    run: context =>
      createBillingPriceBundles(context.client).deactivate(ENTITY_ID, ACTIVATION_ID, deactivateBundleBody),
    assertResult: result => expect(result).toEqual(billingBundleActivationFixture({ status: 'canceled' })),
  },
  {
    name: 'reads available bundle transitions',
    method: 'GET',
    path: '/v1/billing/price-bundle/{entity_id}/transitions/{customer_id}',
    expectedPath: `/v1/billing/price-bundle/${ENTITY_ID}/transitions/${CUSTOMER_ID}`,
    expectedPathParams: {
      customer_id: CUSTOMER_ID,
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingBundleTransitionsFixture()),
    run: context => createBillingPriceBundles(context.client).readAvailableBundleTransitions(ENTITY_ID, CUSTOMER_ID),
    assertResult: result => expect(result).toEqual(billingBundleTransitionsFixture()),
  },
])
