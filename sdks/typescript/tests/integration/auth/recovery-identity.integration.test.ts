import { expect } from 'vitest'
import { createAuthAccountRecoveries, createAuthDeprovisionings, createAuthIdentities } from '../../../src/auth'
import { conjoinSuccess } from '../contract-server/response-fixtures'
import { ACCOUNT_ID, APP_ID, authAccountFixture, describeAuthSdkContractCases, REQUEST_ID } from './auth-test-utils'

const recoveryBody = { token: 'recovery_token_123' }
const completeRecoveryBody = { credential_kinds_to_remove: ['mfa_totp' as const], token: 'recovery_token_123' }
const recoveryFixture = {
  account_id: ACCOUNT_ID,
  expires_at: '2026-05-17T00:00:00.000Z',
  recovery_token: 'recovery_token_123',
  status: 'pending',
}
const identityBody = {
  identity: {
    email: 'owner@example.com',
    type: 'google' as const,
    user_id: 'google_account_123',
  },
}
const discoverBody = { identifiers: { email: 'owner@example.com' } }

describeAuthSdkContractCases('Auth account recovery SDK contract integration', [
  {
    name: 'starts account recovery',
    method: 'POST',
    path: '/v1/auth/recovery/{app_id}/account/{account_id}/recovery/start',
    expectedPath: `/v1/auth/recovery/${APP_ID}/account/${ACCOUNT_ID}/recovery/start`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess(recoveryFixture, { requestId: REQUEST_ID }),
    run: context => createAuthAccountRecoveries(context.client).startRecovery(APP_ID, ACCOUNT_ID),
    assertResult: result => expect(result).toEqual(recoveryFixture),
  },
  {
    name: 'verifies account recovery',
    method: 'POST',
    path: '/v1/auth/recovery/{app_id}/account/{account_id}/recovery/verify',
    expectedBody: recoveryBody,
    expectedPath: `/v1/auth/recovery/${APP_ID}/account/${ACCOUNT_ID}/recovery/verify`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess(recoveryFixture, { requestId: REQUEST_ID }),
    run: context => createAuthAccountRecoveries(context.client).verifyRecovery(APP_ID, ACCOUNT_ID, recoveryBody),
    assertResult: result => expect(result).toEqual(recoveryFixture),
  },
  {
    name: 'completes account recovery',
    method: 'POST',
    path: '/v1/auth/recovery/{app_id}/account/{account_id}/recovery/complete',
    expectedBody: completeRecoveryBody,
    expectedPath: `/v1/auth/recovery/${APP_ID}/account/${ACCOUNT_ID}/recovery/complete`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess({ ...recoveryFixture, status: 'complete' }, { requestId: REQUEST_ID }),
    run: context =>
      createAuthAccountRecoveries(context.client).completeRecovery(APP_ID, ACCOUNT_ID, completeRecoveryBody),
    assertResult: result => expect(result).toEqual({ ...recoveryFixture, status: 'complete' }),
  },
  {
    name: 'admin resets account recovery',
    method: 'POST',
    path: '/v1/auth/recovery/{app_id}/account/{account_id}/recovery/admin-reset',
    expectedPath: `/v1/auth/recovery/${APP_ID}/account/${ACCOUNT_ID}/recovery/admin-reset`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess({ removed_credential_count: 2 }, { requestId: REQUEST_ID }),
    run: context => createAuthAccountRecoveries(context.client).adminResetAccount(APP_ID, ACCOUNT_ID),
    assertResult: result => expect(result).toEqual({ removed_credential_count: 2 }),
  },
])

describeAuthSdkContractCases('Auth identity and deprovisioning SDK contract integration', [
  {
    name: 'links an auth identity',
    method: 'POST',
    path: '/v1/auth/identity/{app_id}/account/{account_id}/identity/link',
    expectedBody: identityBody,
    expectedPath: `/v1/auth/identity/${APP_ID}/account/${ACCOUNT_ID}/identity/link`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess(authAccountFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthIdentities(context.client).link(APP_ID, ACCOUNT_ID, identityBody),
    assertResult: result => expect(result).toEqual(authAccountFixture()),
  },
  {
    name: 'unlinks an auth identity',
    method: 'POST',
    path: '/v1/auth/identity/{app_id}/account/{account_id}/identity/unlink',
    expectedBody: identityBody,
    expectedPath: `/v1/auth/identity/${APP_ID}/account/${ACCOUNT_ID}/identity/unlink`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess(authAccountFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthIdentities(context.client).unlink(APP_ID, ACCOUNT_ID, identityBody),
    assertResult: result => expect(result).toEqual(authAccountFixture()),
  },
  {
    name: 'discovers an auth account identity',
    method: 'POST',
    path: '/v1/auth/identity/{app_id}/identity/discover',
    expectedBody: discoverBody,
    expectedPath: `/v1/auth/identity/${APP_ID}/identity/discover`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess({ account_id: ACCOUNT_ID, exists: true }, { requestId: REQUEST_ID }),
    run: context => createAuthIdentities(context.client).discoverAccount(APP_ID, discoverBody),
    assertResult: result => expect(result).toEqual({ account_id: ACCOUNT_ID, exists: true }),
  },
  {
    name: 'deprovisions an auth account',
    method: 'POST',
    path: '/v1/auth/deprovisioning/{app_id}/account/{account_id}/deprovision',
    expectedPath: `/v1/auth/deprovisioning/${APP_ID}/account/${ACCOUNT_ID}/deprovision`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess({ action_taken: 'deprovisioned' }, { requestId: REQUEST_ID }),
    run: context => createAuthDeprovisionings(context.client).deprovisionAccount(APP_ID, ACCOUNT_ID),
    assertResult: result => expect(result).toEqual({ action_taken: 'deprovisioned' }),
  },
])
