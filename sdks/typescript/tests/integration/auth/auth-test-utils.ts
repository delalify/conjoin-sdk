import { createConjoinClient } from '../../../src/core/client'
import type { ConjoinClient } from '../../../src/core/types'
import { DEFAULT_API_VERSION, SDK_VERSION } from '../../../src/core/version'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { startConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { describeSdkContractCases, type SdkContractCase } from '../sdk-contract/run-sdk-contract-cases'

export const ACCOUNT_ID = 'auth_account_123'
export const API_KEY = 'ck_test_auth_contract'
export const APP_ID = 'auth_app_123'
export const CLIENT_ID = 'auth_client_123'
export const CONJOIN_ACCOUNT_ID = 'account_123'
export const CONJOIN_PROJECT_ID = 'project_123'
export const DATE_CREATED = '2026-05-16T00:00:00.000Z'
export const DATE_UPDATED = '2026-05-16T01:00:00.000Z'
export const EXPIRES_AT = '2026-05-17T00:00:00.000Z'
export const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'
export const SESSION_ID = 'auth_session_123'

export type AuthContractTestContext = {
  client: ConjoinClient
  server: ConjoinContractServer
}

export type AuthSdkContractCase<TResult = unknown> = SdkContractCase<AuthContractTestContext, TResult>

export const startAuthContractTest = async (): Promise<AuthContractTestContext> => {
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

export const describeAuthSdkContractCases = (suiteName: string, cases: AuthSdkContractCase[]): void => {
  describeSdkContractCases({
    cases,
    defaultExpectedHeaders: {
      authorization: `Bearer ${API_KEY}`,
      'x-conjoin-api-version': DEFAULT_API_VERSION,
      'x-conjoin-sdk-version': SDK_VERSION,
    },
    startContext: startAuthContractTest,
    suiteName,
  })
}

export const authSessionFixture = (overrides: Record<string, unknown> = {}) => ({
  account_id: ACCOUNT_ID,
  app_id: APP_ID,
  client_id: CLIENT_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  expires_at: EXPIRES_AT,
  last_activity: {
    country_code: 'GH',
    initiated_at: DATE_UPDATED,
    ip: '127.0.0.1',
    latitude: 5.56,
    longitude: -0.2,
  },
  live_mode: false,
  metadata: {
    source: 'contract',
  },
  revoked_at: null,
  revoked_reason: null,
  session_id: SESSION_ID,
  status: 'active',
  ...overrides,
})
