import { createConjoinClient } from '../../../src/core/client'
import type { ConjoinClient } from '../../../src/core/types'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../../src/core/version'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { startConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { describeSdkContractCases, type SdkContractCase } from '../sdk-contract/run-sdk-contract-cases'

export const API_KEY = 'ck_test_billing_contract'
export const CUSTOMER_ID = 'billing_customer_123'
export const DATE_CREATED = '2026-05-16T00:00:00.000Z'
export const DATE_DELETED = '2026-05-16T02:00:00.000Z'
export const DATE_UPDATED = '2026-05-16T01:00:00.000Z'
export const ENTITY_ID = 'billing_entity_123'
export const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'

export type BillingContractTestContext = {
  client: ConjoinClient
  server: ConjoinContractServer
}

export type BillingSdkContractCase<TResult = unknown> = SdkContractCase<BillingContractTestContext, TResult>

export const startBillingContractTest = async (): Promise<BillingContractTestContext> => {
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

export const describeBillingSdkContractCases = (suiteName: string, cases: BillingSdkContractCase[]): void => {
  describeSdkContractCases({
    cases,
    defaultExpectedHeaders: {
      authorization: `Bearer ${API_KEY}`,
      'x-conjoin-api-version': DEFAULT_API_VERSION,
      'x-conjoin-sdk-version': SDK_VERSION,
    },
    startContext: startBillingContractTest,
    suiteName,
  })
}

export const billingCustomerFixture = (overrides: Record<string, unknown> = {}) => ({
  address: {
    city: 'Accra',
    country: 'GH',
    line1: '1 Independence Avenue',
    postal_code: '00233',
    state: 'Greater Accra',
  },
  customer_id: CUSTOMER_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  email: 'customer@example.com',
  entity_id: ENTITY_ID,
  invoice_settings: {
    allow_multiple_payment_methods: true,
    payment_method: 'payment_method_123',
  },
  name: 'Contract Customer',
  payment_settings: {
    default_currency: 'USD',
    tax_id: 'TIN-123',
  },
  phone: '+233201234567',
  reference_id: 'customer_reference_123',
  shipping_address: {
    city: 'Accra',
    country: 'GH',
    line1: '1 Independence Avenue',
    postal_code: '00233',
    state: 'Greater Accra',
  },
  ...overrides,
})
