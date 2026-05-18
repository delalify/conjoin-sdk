import { expect } from 'vitest'
import {
  createBillingPrices,
  createBillingProducts,
  createBillingSettings,
  createBillingTaxJurisdictions,
} from '../../../src/billing'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import { billingPriceFixture, billingProductFixture } from './billing-catalog-test-utils'
import {
  billingSettingsFixture,
  billingTaxJurisdictionFixture,
  billingTaxRateFixture,
} from './billing-platform-test-utils'
import {
  DATE_DELETED,
  describeBillingSdkContractCases,
  ENTITY_ID,
  PRICE_REFERENCE_ID,
  PRODUCT_ID,
  PRODUCT_REFERENCE_ID,
} from './billing-test-utils'

const createProductBody = {
  name: 'Contract Product',
  reference_id: PRODUCT_REFERENCE_ID,
  unit_label: 'seat',
}
const updateProductBody = { name: 'Updated Product' }
const createPriceBody = {
  amount: 1000,
  billing_scheme: 'per_unit' as const,
  currency: 'GHS' as const,
  product_id: PRODUCT_ID,
  reference_id: PRICE_REFERENCE_ID,
  type: 'recurring' as const,
}
const updatePriceBody = { is_active: false }
const updateSettingsBody = { credit_auto_apply: false }

describeBillingSdkContractCases('Billing product SDK contract integration', [
  {
    name: 'creates a product',
    method: 'POST',
    path: '/v1/billing/product/{entity_id}',
    expectedBody: createProductBody,
    expectedPath: `/v1/billing/product/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingProductFixture(), { status: 201 }),
    run: context => createBillingProducts(context.client).create(ENTITY_ID, createProductBody),
    assertResult: result => expect(result).toEqual(billingProductFixture()),
  },
  {
    name: 'lists products',
    method: 'GET',
    path: '/v1/billing/product/{entity_id}/{reference_id}',
    expectedPath: `/v1/billing/product/${ENTITY_ID}/${PRODUCT_REFERENCE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: PRODUCT_REFERENCE_ID,
    },
    expectedQuery: {
      'query[name][contains]': 'Contract',
    },
    response: conjoinList([billingProductFixture()]),
    run: context =>
      createBillingProducts(context.client).list(ENTITY_ID, PRODUCT_REFERENCE_ID, {
        query: { name: { contains: 'Contract' } },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [billingProductFixture()] }),
  },
  {
    name: 'updates a product',
    method: 'PUT',
    path: '/v1/billing/product/{entity_id}/{reference_id}',
    expectedBody: updateProductBody,
    expectedPath: `/v1/billing/product/${ENTITY_ID}/${PRODUCT_REFERENCE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: PRODUCT_REFERENCE_ID,
    },
    response: conjoinSuccess(billingProductFixture({ name: 'Updated Product' })),
    run: context => createBillingProducts(context.client).update(ENTITY_ID, PRODUCT_REFERENCE_ID, updateProductBody),
    assertResult: result => expect(result).toEqual(billingProductFixture({ name: 'Updated Product' })),
  },
  {
    name: 'deletes a product',
    method: 'DELETE',
    path: '/v1/billing/product/{entity_id}/{reference_id}',
    expectedPath: `/v1/billing/product/${ENTITY_ID}/${PRODUCT_REFERENCE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: PRODUCT_REFERENCE_ID,
    },
    response: conjoinSuccess(billingProductFixture({ date_deleted: DATE_DELETED, is_active: false })),
    run: context => createBillingProducts(context.client).delete(ENTITY_ID, PRODUCT_REFERENCE_ID),
    assertResult: result =>
      expect(result).toEqual(billingProductFixture({ date_deleted: DATE_DELETED, is_active: false })),
  },
  {
    name: 'archives a product',
    method: 'PATCH',
    path: '/v1/billing/product/{entity_id}/{reference_id}/archive',
    expectedPath: `/v1/billing/product/${ENTITY_ID}/${PRODUCT_REFERENCE_ID}/archive`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: PRODUCT_REFERENCE_ID,
    },
    response: conjoinSuccess(billingProductFixture({ date_deleted: DATE_DELETED })),
    run: context => createBillingProducts(context.client).archive(ENTITY_ID, PRODUCT_REFERENCE_ID),
    assertResult: result => expect(result).toEqual(billingProductFixture({ date_deleted: DATE_DELETED })),
  },
  {
    name: 'restores a product',
    method: 'PATCH',
    path: '/v1/billing/product/{entity_id}/{reference_id}/restore',
    expectedPath: `/v1/billing/product/${ENTITY_ID}/${PRODUCT_REFERENCE_ID}/restore`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: PRODUCT_REFERENCE_ID,
    },
    response: conjoinSuccess(billingProductFixture({ date_deleted: null })),
    run: context => createBillingProducts(context.client).restore(ENTITY_ID, PRODUCT_REFERENCE_ID),
    assertResult: result => expect(result).toEqual(billingProductFixture({ date_deleted: null })),
  },
])

describeBillingSdkContractCases('Billing price SDK contract integration', [
  {
    name: 'creates a price',
    method: 'POST',
    path: '/v1/billing/price/{entity_id}',
    expectedBody: createPriceBody,
    expectedPath: `/v1/billing/price/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingPriceFixture(), { status: 201 }),
    run: context => createBillingPrices(context.client).create(ENTITY_ID, createPriceBody),
    assertResult: result => expect(result).toEqual(billingPriceFixture()),
  },
  {
    name: 'lists prices',
    method: 'GET',
    path: '/v1/billing/price/{entity_id}/{reference_id}',
    expectedPath: `/v1/billing/price/${ENTITY_ID}/${PRICE_REFERENCE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: PRICE_REFERENCE_ID,
    },
    expectedQuery: {
      'query[currency]': 'GHS',
    },
    response: conjoinList([billingPriceFixture()]),
    run: context =>
      createBillingPrices(context.client).list(ENTITY_ID, PRICE_REFERENCE_ID, { query: { currency: 'GHS' } }),
    assertResult: result => expect(result).toMatchObject({ data: [billingPriceFixture()] }),
  },
  {
    name: 'updates a price',
    method: 'PUT',
    path: '/v1/billing/price/{entity_id}/{reference_id}',
    expectedBody: updatePriceBody,
    expectedPath: `/v1/billing/price/${ENTITY_ID}/${PRICE_REFERENCE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: PRICE_REFERENCE_ID,
    },
    response: conjoinSuccess(billingPriceFixture({ is_active: false })),
    run: context => createBillingPrices(context.client).update(ENTITY_ID, PRICE_REFERENCE_ID, updatePriceBody),
    assertResult: result => expect(result).toEqual(billingPriceFixture({ is_active: false })),
  },
  {
    name: 'deletes a price',
    method: 'DELETE',
    path: '/v1/billing/price/{entity_id}/{reference_id}',
    expectedPath: `/v1/billing/price/${ENTITY_ID}/${PRICE_REFERENCE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: PRICE_REFERENCE_ID,
    },
    response: conjoinSuccess(billingPriceFixture({ date_deleted: DATE_DELETED, is_active: false })),
    run: context => createBillingPrices(context.client).delete(ENTITY_ID, PRICE_REFERENCE_ID),
    assertResult: result =>
      expect(result).toEqual(billingPriceFixture({ date_deleted: DATE_DELETED, is_active: false })),
  },
  {
    name: 'archives a price',
    method: 'PATCH',
    path: '/v1/billing/price/{entity_id}/{reference_id}/archive',
    expectedPath: `/v1/billing/price/${ENTITY_ID}/${PRICE_REFERENCE_ID}/archive`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: PRICE_REFERENCE_ID,
    },
    response: conjoinSuccess(billingPriceFixture({ date_deleted: DATE_DELETED })),
    run: context => createBillingPrices(context.client).archive(ENTITY_ID, PRICE_REFERENCE_ID),
    assertResult: result => expect(result).toEqual(billingPriceFixture({ date_deleted: DATE_DELETED })),
  },
  {
    name: 'restores a price',
    method: 'PATCH',
    path: '/v1/billing/price/{entity_id}/{reference_id}/restore',
    expectedPath: `/v1/billing/price/${ENTITY_ID}/${PRICE_REFERENCE_ID}/restore`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: PRICE_REFERENCE_ID,
    },
    response: conjoinSuccess(billingPriceFixture({ date_deleted: null })),
    run: context => createBillingPrices(context.client).restore(ENTITY_ID, PRICE_REFERENCE_ID),
    assertResult: result => expect(result).toEqual(billingPriceFixture({ date_deleted: null })),
  },
])

describeBillingSdkContractCases('Billing settings SDK contract integration', [
  {
    name: 'reads billing settings',
    method: 'GET',
    path: '/v1/billing/settings/',
    response: conjoinSuccess(billingSettingsFixture()),
    run: context => createBillingSettings(context.client).read(),
    assertResult: result => expect(result).toEqual(billingSettingsFixture()),
  },
  {
    name: 'updates billing settings',
    method: 'PUT',
    path: '/v1/billing/settings/',
    expectedBody: updateSettingsBody,
    response: conjoinSuccess(billingSettingsFixture({ credit_auto_apply: false })),
    run: context => createBillingSettings(context.client).update(updateSettingsBody),
    assertResult: result => expect(result).toEqual(billingSettingsFixture({ credit_auto_apply: false })),
  },
])

describeBillingSdkContractCases('Billing tax jurisdiction SDK contract integration', [
  {
    name: 'lists tax jurisdictions',
    method: 'GET',
    path: '/v1/billing/tax-jurisdiction/',
    expectedQuery: {
      'query[country]': 'GH',
      'query[tax_type]': 'vat',
    },
    response: conjoinList([billingTaxJurisdictionFixture()]),
    run: context => createBillingTaxJurisdictions(context.client).list({ query: { country: 'GH', tax_type: 'vat' } }),
    assertResult: result => expect(result).toMatchObject({ data: [billingTaxJurisdictionFixture()] }),
  },
  {
    name: 'queries a tax rate',
    method: 'GET',
    path: '/v1/billing/tax-jurisdiction/query',
    expectedQuery: {
      country: 'GH',
    },
    response: conjoinSuccess(billingTaxRateFixture()),
    run: context => createBillingTaxJurisdictions(context.client).queryTaxRate({ country: 'GH' }),
    assertResult: result => expect(result).toEqual(billingTaxRateFixture()),
  },
])
