import { expect } from 'vitest'
import { createBillingInvoices } from '../../../src/billing'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import { billingInvoiceFixture } from './billing-ledger-test-utils'
import {
  CUSTOMER_ID,
  conjoinMetaSuccess,
  describeBillingSdkContractCases,
  ENTITY_ID,
  INVOICE_ID,
  PAYMENT_METHOD_ID,
} from './billing-test-utils'

const createInvoiceBody = {
  customer_id: CUSTOMER_ID,
  invoicing_option: 'manual_finalisation' as const,
  reference_id: 'invoice_reference_123',
}
const updateInvoiceBody = { description: 'Updated invoice' }
const payInvoiceBody = { payment_method_id: PAYMENT_METHOD_ID }
const markPaidBody = { amount: 1000 }

describeBillingSdkContractCases('Billing invoice SDK contract integration', [
  {
    name: 'creates an invoice',
    method: 'POST',
    path: '/v1/billing/invoice/{entity_id}/create',
    expectedBody: createInvoiceBody,
    expectedPath: `/v1/billing/invoice/${ENTITY_ID}/create`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingInvoiceFixture(), { status: 201 }),
    run: context => createBillingInvoices(context.client).create(ENTITY_ID, createInvoiceBody),
    assertResult: result => expect(result).toEqual(billingInvoiceFixture()),
  },
  {
    name: 'lists invoices',
    method: 'GET',
    path: '/v1/billing/invoice/{entity_id}',
    expectedPath: `/v1/billing/invoice/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      'query[customer_id]': CUSTOMER_ID,
      'query[status]': 'draft',
    },
    response: conjoinList([billingInvoiceFixture()]),
    run: context =>
      createBillingInvoices(context.client).list(ENTITY_ID, {
        query: { customer_id: CUSTOMER_ID, status: 'draft' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [billingInvoiceFixture()] }),
  },
  {
    name: 'updates an invoice',
    method: 'PUT',
    path: '/v1/billing/invoice/{entity_id}/update/{invoice_id}',
    expectedBody: updateInvoiceBody,
    expectedPath: `/v1/billing/invoice/${ENTITY_ID}/update/${INVOICE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      invoice_id: INVOICE_ID,
    },
    response: conjoinSuccess(billingInvoiceFixture({ description: 'Updated invoice' })),
    run: context => createBillingInvoices(context.client).update(ENTITY_ID, INVOICE_ID, updateInvoiceBody),
    assertResult: result => expect(result).toEqual(billingInvoiceFixture({ description: 'Updated invoice' })),
  },
  {
    name: 'finalizes an invoice',
    method: 'PATCH',
    path: '/v1/billing/invoice/{entity_id}/finalize/{invoice_id}',
    expectedPath: `/v1/billing/invoice/${ENTITY_ID}/finalize/${INVOICE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      invoice_id: INVOICE_ID,
    },
    response: conjoinSuccess(billingInvoiceFixture({ status: 'open' })),
    run: context => createBillingInvoices(context.client).finalize(ENTITY_ID, INVOICE_ID),
    assertResult: result => expect(result).toEqual(billingInvoiceFixture({ status: 'open' })),
  },
  {
    name: 'pays an invoice',
    method: 'PATCH',
    path: '/v1/billing/invoice/{entity_id}/pay/{invoice_id}',
    expectedBody: payInvoiceBody,
    expectedPath: `/v1/billing/invoice/${ENTITY_ID}/pay/${INVOICE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      invoice_id: INVOICE_ID,
    },
    response: conjoinSuccess(billingInvoiceFixture({ amount_paid: 1000, amount_remaining: 0, is_paid: true })),
    run: context => createBillingInvoices(context.client).pay(ENTITY_ID, INVOICE_ID, payInvoiceBody),
    assertResult: result =>
      expect(result).toEqual(billingInvoiceFixture({ amount_paid: 1000, amount_remaining: 0, is_paid: true })),
  },
  {
    name: 'voids an invoice',
    method: 'PATCH',
    path: '/v1/billing/invoice/{entity_id}/void/{invoice_id}',
    expectedPath: `/v1/billing/invoice/${ENTITY_ID}/void/${INVOICE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      invoice_id: INVOICE_ID,
    },
    response: conjoinSuccess(billingInvoiceFixture({ status: 'void' })),
    run: context => createBillingInvoices(context.client).void(ENTITY_ID, INVOICE_ID),
    assertResult: result => expect(result).toEqual(billingInvoiceFixture({ status: 'void' })),
  },
  {
    name: 'marks an invoice paid',
    method: 'PATCH',
    path: '/v1/billing/invoice/{entity_id}/mark-paid/{invoice_id}',
    expectedBody: markPaidBody,
    expectedPath: `/v1/billing/invoice/${ENTITY_ID}/mark-paid/${INVOICE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      invoice_id: INVOICE_ID,
    },
    response: conjoinSuccess(billingInvoiceFixture({ amount_paid: 1000, amount_remaining: 0, is_paid: true })),
    run: context => createBillingInvoices(context.client).markPaid(ENTITY_ID, INVOICE_ID, markPaidBody),
    assertResult: result =>
      expect(result).toEqual(billingInvoiceFixture({ amount_paid: 1000, amount_remaining: 0, is_paid: true })),
  },
  {
    name: 'sends an invoice',
    method: 'POST',
    path: '/v1/billing/invoice/{entity_id}/send/{invoice_id}',
    expectedPath: `/v1/billing/invoice/${ENTITY_ID}/send/${INVOICE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      invoice_id: INVOICE_ID,
    },
    response: conjoinSuccess(billingInvoiceFixture()),
    run: context => createBillingInvoices(context.client).send(ENTITY_ID, INVOICE_ID),
    assertResult: result => expect(result).toEqual(billingInvoiceFixture()),
  },
  {
    name: 'reads an invoice PDF',
    method: 'GET',
    path: '/v1/billing/invoice/{entity_id}/pdf/{invoice_id}',
    expectedPath: `/v1/billing/invoice/${ENTITY_ID}/pdf/${INVOICE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      invoice_id: INVOICE_ID,
    },
    response: conjoinMetaSuccess(),
    run: context => createBillingInvoices(context.client).readPdf(ENTITY_ID, INVOICE_ID),
    assertResult: result => expect(result).toBeUndefined(),
  },
])
