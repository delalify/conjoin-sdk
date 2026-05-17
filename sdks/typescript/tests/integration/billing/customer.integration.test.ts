import { expect } from 'vitest'
import { createBillingCustomers } from '../../../src/billing'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  billingCustomerFixture,
  CUSTOMER_ID,
  DATE_DELETED,
  describeBillingSdkContractCases,
  ENTITY_ID,
  REQUEST_ID,
} from './billing-test-utils'

const createCustomerBody = {
  address: {
    city: 'Accra',
    country: 'GH',
    line1: '1 Independence Avenue',
    postal_code: '00233',
    state: 'Greater Accra',
  },
  email: 'customer@example.com',
  invoice_settings: {
    allow_multiple_payment_methods: true,
    payment_method: 'payment_method_123',
  },
  name: 'Contract Customer',
  payment_settings: {
    default_currency: 'USD' as const,
    tax_id: 'TIN-123',
  },
  phone: '+233201234567',
  reference_id: 'customer_reference_123',
}
const updateCustomerBody = {
  email: 'renamed.customer@example.com',
  name: 'Renamed Contract Customer',
  payment_settings: {
    default_currency: 'GHS' as const,
  },
}

describeBillingSdkContractCases('Billing customer SDK contract integration', [
  {
    name: 'creates a billing customer',
    method: 'POST',
    path: '/v1/billing/customer/{entity_id}',
    expectedBody: createCustomerBody,
    expectedPath: `/v1/billing/customer/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingCustomerFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createBillingCustomers(context.client).create(ENTITY_ID, createCustomerBody),
    assertResult: result => expect(result).toEqual(billingCustomerFixture()),
  },
  {
    name: 'lists billing customers',
    method: 'GET',
    path: '/v1/billing/customer/{entity_id}',
    expectedPath: `/v1/billing/customer/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      'cursor[next]': 'cursor_next_123',
      limit: '2',
      'query[customer_id]': CUSTOMER_ID,
      'query[date_created][greater_than_or_equals]': '2026-05-01T00:00:00.000Z',
      'sort[date_created]': 'desc',
    },
    expectedRawBody: '',
    response: conjoinList([billingCustomerFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context =>
      createBillingCustomers(context.client).list(ENTITY_ID, {
        cursor: {
          next: 'cursor_next_123',
        },
        limit: 2,
        query: {
          customer_id: CUSTOMER_ID,
          date_created: {
            greater_than_or_equals: '2026-05-01T00:00:00.000Z',
          },
        },
        sort: {
          date_created: 'desc',
        },
      }),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [billingCustomerFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'updates a billing customer',
    method: 'PUT',
    path: '/v1/billing/customer/{entity_id}/{customer_id}',
    expectedBody: updateCustomerBody,
    expectedPath: `/v1/billing/customer/${ENTITY_ID}/${CUSTOMER_ID}`,
    expectedPathParams: {
      customer_id: CUSTOMER_ID,
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(
      billingCustomerFixture({
        email: 'renamed.customer@example.com',
        name: 'Renamed Contract Customer',
        payment_settings: {
          default_currency: 'GHS',
          tax_id: 'TIN-123',
        },
      }),
      { requestId: REQUEST_ID },
    ),
    run: context => createBillingCustomers(context.client).update(ENTITY_ID, CUSTOMER_ID, updateCustomerBody),
    assertResult: result =>
      expect(result).toEqual(
        billingCustomerFixture({
          email: 'renamed.customer@example.com',
          name: 'Renamed Contract Customer',
          payment_settings: {
            default_currency: 'GHS',
            tax_id: 'TIN-123',
          },
        }),
      ),
  },
  {
    name: 'archives a billing customer',
    method: 'PATCH',
    path: '/v1/billing/customer/{entity_id}/{customer_id}/archive',
    expectedPath: `/v1/billing/customer/${ENTITY_ID}/${CUSTOMER_ID}/archive`,
    expectedPathParams: {
      customer_id: CUSTOMER_ID,
      entity_id: ENTITY_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(billingCustomerFixture({ date_deleted: DATE_DELETED }), { requestId: REQUEST_ID }),
    run: context => createBillingCustomers(context.client).archive(ENTITY_ID, CUSTOMER_ID),
    assertResult: result => expect(result).toEqual(billingCustomerFixture({ date_deleted: DATE_DELETED })),
  },
  {
    name: 'restores a billing customer',
    method: 'PATCH',
    path: '/v1/billing/customer/{entity_id}/{customer_id}/restore',
    expectedPath: `/v1/billing/customer/${ENTITY_ID}/${CUSTOMER_ID}/restore`,
    expectedPathParams: {
      customer_id: CUSTOMER_ID,
      entity_id: ENTITY_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(billingCustomerFixture({ date_deleted: null }), { requestId: REQUEST_ID }),
    run: context => createBillingCustomers(context.client).restore(ENTITY_ID, CUSTOMER_ID),
    assertResult: result => expect(result).toEqual(billingCustomerFixture({ date_deleted: null })),
  },
])
