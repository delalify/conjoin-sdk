import { expect } from 'vitest'
import { createBillingPaymentIntents, createBillingPaymentMethods } from '../../../src/billing'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import { billingPaymentIntentFixture, billingPaymentMethodFixture } from './billing-ledger-test-utils'
import { CUSTOMER_ID, describeBillingSdkContractCases, ENTITY_ID, PAYMENT_METHOD_ID } from './billing-test-utils'

const createPaymentIntentBody = {
  currency: 'GHS' as const,
  customer_id: CUSTOMER_ID,
  reference_id: 'payment_intent_reference_123',
}
const createPaymentMethodBody = {
  customer_card_email: 'customer@example.com',
  customer_id: CUSTOMER_ID,
  is_default: true,
  reference_id: 'payment_method_reference_123',
}

describeBillingSdkContractCases('Billing payment intent SDK contract integration', [
  {
    name: 'creates a payment intent',
    method: 'POST',
    path: '/v1/billing/payment-intent/{entity_id}/create',
    expectedBody: createPaymentIntentBody,
    expectedPath: `/v1/billing/payment-intent/${ENTITY_ID}/create`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingPaymentIntentFixture(), { status: 201 }),
    run: context => createBillingPaymentIntents(context.client).create(ENTITY_ID, createPaymentIntentBody),
    assertResult: result => expect(result).toEqual(billingPaymentIntentFixture()),
  },
  {
    name: 'lists payment intents',
    method: 'GET',
    path: '/v1/billing/payment-intent/{entity_id}',
    expectedPath: `/v1/billing/payment-intent/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      'query[reference_id]': 'payment_intent_reference_123',
    },
    response: conjoinList([billingPaymentIntentFixture()]),
    run: context =>
      createBillingPaymentIntents(context.client).list(ENTITY_ID, {
        query: { reference_id: 'payment_intent_reference_123' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [billingPaymentIntentFixture()] }),
  },
  {
    name: 'verifies a payment intent',
    method: 'GET',
    path: '/v1/billing/payment-intent/{entity_id}/verify/{reference_id}',
    expectedPath: '/v1/billing/payment-intent/billing_entity_123/verify/payment_intent_reference_123',
    expectedPathParams: {
      entity_id: ENTITY_ID,
      reference_id: 'payment_intent_reference_123',
    },
    response: conjoinSuccess(billingPaymentIntentFixture()),
    run: context => createBillingPaymentIntents(context.client).verify(ENTITY_ID, 'payment_intent_reference_123'),
    assertResult: result => expect(result).toEqual(billingPaymentIntentFixture()),
  },
])

describeBillingSdkContractCases('Billing payment method SDK contract integration', [
  {
    name: 'creates a payment method',
    method: 'POST',
    path: '/v1/billing/payment-method/{entity_id}/create',
    expectedBody: createPaymentMethodBody,
    expectedPath: `/v1/billing/payment-method/${ENTITY_ID}/create`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingPaymentMethodFixture(), { status: 201 }),
    run: context => createBillingPaymentMethods(context.client).create(ENTITY_ID, createPaymentMethodBody),
    assertResult: result => expect(result).toEqual(billingPaymentMethodFixture()),
  },
  {
    name: 'lists payment methods',
    method: 'GET',
    path: '/v1/billing/payment-method/{entity_id}',
    expectedPath: `/v1/billing/payment-method/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      'query[is_default]': 'true',
    },
    response: conjoinList([billingPaymentMethodFixture()]),
    run: context => createBillingPaymentMethods(context.client).list(ENTITY_ID, { query: { is_default: true } }),
    assertResult: result => expect(result).toMatchObject({ data: [billingPaymentMethodFixture()] }),
  },
  {
    name: 'deletes a payment method',
    method: 'DELETE',
    path: '/v1/billing/payment-method/{entity_id}/{payment_method_id}',
    expectedPath: `/v1/billing/payment-method/${ENTITY_ID}/${PAYMENT_METHOD_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      payment_method_id: PAYMENT_METHOD_ID,
    },
    response: conjoinSuccess(billingPaymentMethodFixture({ is_active: false })),
    run: context => createBillingPaymentMethods(context.client).delete(ENTITY_ID, PAYMENT_METHOD_ID),
    assertResult: result => expect(result).toEqual(billingPaymentMethodFixture({ is_active: false })),
  },
])
