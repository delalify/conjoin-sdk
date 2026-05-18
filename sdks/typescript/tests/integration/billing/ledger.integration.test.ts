import { expect } from 'vitest'
import {
  createBillingCharges,
  createBillingCoupons,
  createBillingCreditNotes,
  createBillingCreditWallets,
  createBillingDiscounts,
  createBillingReceipts,
  createBillingRefunds,
} from '../../../src/billing'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  billingChargeFixture,
  billingCouponFixture,
  billingCreditBalanceFixture,
  billingCreditGrantFixture,
  billingCreditNoteFixture,
  billingCreditWalletFixture,
  billingDiscountFixture,
  billingReceiptFixture,
  billingRefundFixture,
} from './billing-ledger-test-utils'
import {
  CHARGE_ID,
  COUPON_ID,
  CREDIT_NOTE_ID,
  CUSTOMER_ID,
  DATE_DELETED,
  DISCOUNT_ID,
  describeBillingSdkContractCases,
  ENTITY_ID,
  RECEIPT_ID,
  REQUEST_ID,
  WALLET_ID,
} from './billing-test-utils'

const createCouponBody = {
  coupon_code: 'SAVE10',
  discount_type: 'percent_off' as const,
  duration: 'once' as const,
  name: 'Save 10',
  percent_off: 10,
  reason_code: 'promotion' as const,
}
const updateCouponBody = { is_active: false }
const createCreditNoteBody = {
  amount: 500,
  currency: 'GHS' as const,
  customer_id: CUSTOMER_ID,
  reason: 'goodwill' as const,
}
const createCreditWalletBody = {
  credit_value: 1,
  currency: 'GHS' as const,
  customer_id: CUSTOMER_ID,
}
const updateCreditWalletBody = { is_active: false }
const grantCreditsBody = {
  amount: 100,
  source: 'manual' as const,
  wallet_id: WALLET_ID,
}
const createDiscountBody = {
  coupon_id: COUPON_ID,
  customer_id: CUSTOMER_ID,
}
const createRefundBody = {
  amount: 500,
  charge_id: CHARGE_ID,
  reference_id: 'refund_reference_123',
}

describeBillingSdkContractCases('Billing charge SDK contract integration', [
  {
    name: 'lists charges',
    method: 'GET',
    path: '/v1/billing/charge/{entity_id}',
    expectedPath: `/v1/billing/charge/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      'cursor[next]': 'cursor_next_123',
      limit: '1',
      'query[payment_type]': 'invoice',
      'sort[date_created]': 'desc',
    },
    response: conjoinList([billingChargeFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createBillingCharges(context.client).list(ENTITY_ID, {
        cursor: { next: 'cursor_next_123' },
        limit: 1,
        query: { payment_type: 'invoice' },
        sort: { date_created: 'desc' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [billingChargeFixture()] }),
  },
])

describeBillingSdkContractCases('Billing coupon SDK contract integration', [
  {
    name: 'creates a coupon',
    method: 'POST',
    path: '/v1/billing/coupon/create',
    expectedBody: createCouponBody,
    response: conjoinSuccess(billingCouponFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => createBillingCoupons(context.client).create(createCouponBody),
    assertResult: result => expect(result).toEqual(billingCouponFixture()),
  },
  {
    name: 'lists coupons',
    method: 'GET',
    path: '/v1/billing/coupon/',
    expectedQuery: {
      'cursor[next]': 'cursor_next_123',
      limit: '1',
      'query[coupon_code]': 'SAVE10',
      'sort[date_created]': 'desc',
    },
    response: conjoinList([billingCouponFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createBillingCoupons(context.client).list({
        cursor: { next: 'cursor_next_123' },
        limit: 1,
        query: { coupon_code: 'SAVE10' },
        sort: { date_created: 'desc' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [billingCouponFixture()] }),
  },
  {
    name: 'updates a coupon',
    method: 'PATCH',
    path: '/v1/billing/coupon/{coupon_id}',
    expectedBody: updateCouponBody,
    expectedPath: `/v1/billing/coupon/${COUPON_ID}`,
    expectedPathParams: {
      coupon_id: COUPON_ID,
    },
    response: conjoinSuccess(billingCouponFixture({ is_active: false }), { requestId: REQUEST_ID }),
    run: context => createBillingCoupons(context.client).update(COUPON_ID, updateCouponBody),
    assertResult: result => expect(result).toEqual(billingCouponFixture({ is_active: false })),
  },
  {
    name: 'deletes a coupon',
    method: 'DELETE',
    path: '/v1/billing/coupon/{coupon_id}',
    expectedPath: `/v1/billing/coupon/${COUPON_ID}`,
    expectedPathParams: {
      coupon_id: COUPON_ID,
    },
    response: conjoinSuccess(billingCouponFixture({ date_deleted: DATE_DELETED, is_active: false })),
    run: context => createBillingCoupons(context.client).delete(COUPON_ID),
    assertResult: result =>
      expect(result).toEqual(billingCouponFixture({ date_deleted: DATE_DELETED, is_active: false })),
  },
])

describeBillingSdkContractCases('Billing credit note SDK contract integration', [
  {
    name: 'creates a credit note',
    method: 'POST',
    path: '/v1/billing/credit-note/create',
    expectedBody: createCreditNoteBody,
    response: conjoinSuccess(billingCreditNoteFixture(), { status: 201 }),
    run: context => createBillingCreditNotes(context.client).create(createCreditNoteBody),
    assertResult: result => expect(result).toEqual(billingCreditNoteFixture()),
  },
  {
    name: 'lists credit notes',
    method: 'GET',
    path: '/v1/billing/credit-note/',
    expectedQuery: {
      'query[customer_id]': CUSTOMER_ID,
      'sort[date_created]': 'desc',
    },
    response: conjoinList([billingCreditNoteFixture()]),
    run: context =>
      createBillingCreditNotes(context.client).list({
        query: { customer_id: CUSTOMER_ID },
        sort: { date_created: 'desc' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [billingCreditNoteFixture()] }),
  },
  {
    name: 'voids a credit note',
    method: 'PATCH',
    path: '/v1/billing/credit-note/void/{credit_note_id}',
    expectedPath: `/v1/billing/credit-note/void/${CREDIT_NOTE_ID}`,
    expectedPathParams: {
      credit_note_id: CREDIT_NOTE_ID,
    },
    response: conjoinSuccess(billingCreditNoteFixture({ status: 'voided' })),
    run: context => createBillingCreditNotes(context.client).void(CREDIT_NOTE_ID),
    assertResult: result => expect(result).toEqual(billingCreditNoteFixture({ status: 'voided' })),
  },
  {
    name: 'reads credit note balance',
    method: 'GET',
    path: '/v1/billing/credit-note/balance/{customer_id}',
    expectedPath: `/v1/billing/credit-note/balance/${CUSTOMER_ID}`,
    expectedPathParams: {
      customer_id: CUSTOMER_ID,
    },
    response: conjoinSuccess(billingCreditBalanceFixture()),
    run: context => createBillingCreditNotes(context.client).readBalance(CUSTOMER_ID),
    assertResult: result => expect(result).toEqual(billingCreditBalanceFixture()),
  },
])

describeBillingSdkContractCases('Billing credit wallet SDK contract integration', [
  {
    name: 'creates a credit wallet',
    method: 'POST',
    path: '/v1/billing/credit-wallet/create',
    expectedBody: createCreditWalletBody,
    response: conjoinSuccess(billingCreditWalletFixture(), { status: 201 }),
    run: context => createBillingCreditWallets(context.client).create(createCreditWalletBody),
    assertResult: result => expect(result).toEqual(billingCreditWalletFixture()),
  },
  {
    name: 'lists credit wallets',
    method: 'GET',
    path: '/v1/billing/credit-wallet/',
    expectedQuery: {
      'query[customer_id]': CUSTOMER_ID,
    },
    response: conjoinList([billingCreditWalletFixture()]),
    run: context => createBillingCreditWallets(context.client).list({ query: { customer_id: CUSTOMER_ID } }),
    assertResult: result => expect(result).toMatchObject({ data: [billingCreditWalletFixture()] }),
  },
  {
    name: 'updates a credit wallet',
    method: 'PATCH',
    path: '/v1/billing/credit-wallet/{wallet_id}',
    expectedBody: updateCreditWalletBody,
    expectedPath: `/v1/billing/credit-wallet/${WALLET_ID}`,
    expectedPathParams: {
      wallet_id: WALLET_ID,
    },
    response: conjoinSuccess(billingCreditWalletFixture({ is_active: false })),
    run: context => createBillingCreditWallets(context.client).update(WALLET_ID, updateCreditWalletBody),
    assertResult: result => expect(result).toEqual(billingCreditWalletFixture({ is_active: false })),
  },
  {
    name: 'grants credits',
    method: 'POST',
    path: '/v1/billing/credit-wallet/grant',
    expectedBody: grantCreditsBody,
    response: conjoinSuccess(billingCreditGrantFixture(), { status: 201 }),
    run: context => createBillingCreditWallets(context.client).grantCredits(grantCreditsBody),
    assertResult: result => expect(result).toEqual(billingCreditGrantFixture()),
  },
])

describeBillingSdkContractCases('Billing discount SDK contract integration', [
  {
    name: 'creates a discount',
    method: 'POST',
    path: '/v1/billing/discount/create',
    expectedBody: createDiscountBody,
    response: conjoinSuccess(billingDiscountFixture(), { status: 201 }),
    run: context => createBillingDiscounts(context.client).create(createDiscountBody),
    assertResult: result => expect(result).toEqual(billingDiscountFixture()),
  },
  {
    name: 'lists discounts',
    method: 'GET',
    path: '/v1/billing/discount/',
    expectedQuery: {
      'query[customer_id]': CUSTOMER_ID,
    },
    response: conjoinList([billingDiscountFixture()]),
    run: context => createBillingDiscounts(context.client).list({ query: { customer_id: CUSTOMER_ID } }),
    assertResult: result => expect(result).toMatchObject({ data: [billingDiscountFixture()] }),
  },
  {
    name: 'deletes a discount',
    method: 'DELETE',
    path: '/v1/billing/discount/{discount_id}',
    expectedPath: `/v1/billing/discount/${DISCOUNT_ID}`,
    expectedPathParams: {
      discount_id: DISCOUNT_ID,
    },
    response: conjoinSuccess(billingDiscountFixture({ date_deleted: DATE_DELETED, is_active: false })),
    run: context => createBillingDiscounts(context.client).delete(DISCOUNT_ID),
    assertResult: result =>
      expect(result).toEqual(billingDiscountFixture({ date_deleted: DATE_DELETED, is_active: false })),
  },
])

describeBillingSdkContractCases('Billing receipt SDK contract integration', [
  {
    name: 'lists receipts',
    method: 'GET',
    path: '/v1/billing/receipt/{entity_id}/receipts',
    expectedPath: `/v1/billing/receipt/${ENTITY_ID}/receipts`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      'query[charge_id]': CHARGE_ID,
    },
    response: conjoinList([billingReceiptFixture()]),
    run: context => createBillingReceipts(context.client).list(ENTITY_ID, { query: { charge_id: CHARGE_ID } }),
    assertResult: result => expect(result).toMatchObject({ data: [billingReceiptFixture()] }),
  },
  {
    name: 'reads a receipt by charge ID',
    method: 'GET',
    path: '/v1/billing/receipt/{entity_id}/receipt/{charge_id}',
    expectedPath: `/v1/billing/receipt/${ENTITY_ID}/receipt/${CHARGE_ID}`,
    expectedPathParams: {
      charge_id: CHARGE_ID,
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingReceiptFixture()),
    run: context => createBillingReceipts(context.client).readByChargeId(ENTITY_ID, CHARGE_ID),
    assertResult: result => expect(result).toEqual(billingReceiptFixture()),
  },
  {
    name: 'reads a receipt by receipt ID',
    method: 'GET',
    path: '/v1/billing/receipt/{entity_id}/receipts/{receipt_id}',
    expectedPath: `/v1/billing/receipt/${ENTITY_ID}/receipts/${RECEIPT_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      receipt_id: RECEIPT_ID,
    },
    response: conjoinSuccess(billingReceiptFixture()),
    run: context => createBillingReceipts(context.client).readByReceiptId(ENTITY_ID, RECEIPT_ID),
    assertResult: result => expect(result).toEqual(billingReceiptFixture()),
  },
])

describeBillingSdkContractCases('Billing refund SDK contract integration', [
  {
    name: 'creates a refund',
    method: 'POST',
    path: '/v1/billing/refund/{entity_id}/create',
    expectedBody: createRefundBody,
    expectedPath: `/v1/billing/refund/${ENTITY_ID}/create`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingRefundFixture(), { status: 201 }),
    run: context => createBillingRefunds(context.client).create(ENTITY_ID, createRefundBody),
    assertResult: result => expect(result).toEqual(billingRefundFixture()),
  },
  {
    name: 'lists refunds',
    method: 'GET',
    path: '/v1/billing/refund/{entity_id}',
    expectedPath: `/v1/billing/refund/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      'query[reference_id][contains]': 'refund',
    },
    response: conjoinList([billingRefundFixture()]),
    run: context =>
      createBillingRefunds(context.client).list(ENTITY_ID, { query: { reference_id: { contains: 'refund' } } }),
    assertResult: result => expect(result).toMatchObject({ data: [billingRefundFixture()] }),
  },
])
