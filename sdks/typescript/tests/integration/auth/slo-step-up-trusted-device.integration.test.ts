import { expect } from 'vitest'
import { createAuthSLOs, createAuthStepUps, createAuthTrustedDevices } from '../../../src/auth'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  ACCOUNT_ID,
  APP_ID,
  authTrustedDeviceFixture,
  describeAuthSdkContractCases,
  REQUEST_ID,
  SESSION_ID,
  TRUSTED_DEVICE_ID,
} from './auth-test-utils'

const oidcLogoutBody = {
  end_session_endpoint: 'https://example.com/oauth/logout',
  id_token_hint: 'id_token_123',
  post_logout_redirect_uri: 'https://example.com/logged-out',
}
const samlSpLogoutBody = {
  issuer: 'https://example.com/saml',
  name_id: 'owner@example.com',
  session_index: 'session_index_123',
  slo_url: 'https://example.com/saml/logout',
}
const samlIdpLogoutBody = {
  issuer: 'https://example.com/saml',
  saml_request: 'saml_request_123',
}
const logoutFixture = {
  logout_url: 'https://example.com/logout',
  status: 'redirect_required',
}
const stepUpRequestBody = {
  operation_id: 'billing.payout',
  session_id: SESSION_ID,
}
const stepUpVerifyBody = {
  code: '123456',
  method: 'totp',
  operation_id: 'billing.payout',
  session_id: SESSION_ID,
  ttl_seconds: 300,
}
const stepUpValidateBody = {
  operation_id: 'billing.payout',
  session_id: SESSION_ID,
  token: 'step_up_token_123',
}
const stepUpFixture = {
  available_methods: ['totp'],
  challenge_id: 'step_up_challenge_123',
  status: 'verified',
  token: 'step_up_token_123',
}

describeAuthSdkContractCases('Auth SLO SDK contract integration', [
  {
    name: 'performs OIDC logout',
    method: 'POST',
    path: '/v1/auth/slo/{app_id}/account/{account_id}/slo/oidc',
    expectedBody: oidcLogoutBody,
    expectedPath: `/v1/auth/slo/${APP_ID}/account/${ACCOUNT_ID}/slo/oidc`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess(logoutFixture, { requestId: REQUEST_ID }),
    run: context => createAuthSLOs(context.client).oidcLogout(APP_ID, ACCOUNT_ID, oidcLogoutBody),
    assertResult: result => expect(result).toEqual(logoutFixture),
  },
  {
    name: 'performs SP-initiated SAML logout',
    method: 'POST',
    path: '/v1/auth/slo/{app_id}/account/{account_id}/slo/saml/sp-initiated',
    expectedBody: samlSpLogoutBody,
    expectedPath: `/v1/auth/slo/${APP_ID}/account/${ACCOUNT_ID}/slo/saml/sp-initiated`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess(logoutFixture, { requestId: REQUEST_ID }),
    run: context => createAuthSLOs(context.client).samlSpLogout(APP_ID, ACCOUNT_ID, samlSpLogoutBody),
    assertResult: result => expect(result).toEqual(logoutFixture),
  },
  {
    name: 'performs IdP-initiated SAML logout',
    method: 'POST',
    path: '/v1/auth/slo/{app_id}/slo/saml/idp-initiated',
    expectedBody: samlIdpLogoutBody,
    expectedPath: `/v1/auth/slo/${APP_ID}/slo/saml/idp-initiated`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess(logoutFixture, { requestId: REQUEST_ID }),
    run: context => createAuthSLOs(context.client).samlIdpLogout(APP_ID, samlIdpLogoutBody),
    assertResult: result => expect(result).toEqual(logoutFixture),
  },
])

describeAuthSdkContractCases('Auth step-up and trusted device SDK contract integration', [
  {
    name: 'requests step-up authentication',
    method: 'POST',
    path: '/v1/auth/step-up/{app_id}/account/{account_id}/step-up/request',
    expectedBody: stepUpRequestBody,
    expectedPath: `/v1/auth/step-up/${APP_ID}/account/${ACCOUNT_ID}/step-up/request`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess(stepUpFixture, { requestId: REQUEST_ID }),
    run: context => createAuthStepUps(context.client).request(APP_ID, ACCOUNT_ID, stepUpRequestBody),
    assertResult: result => expect(result).toEqual(stepUpFixture),
  },
  {
    name: 'verifies step-up authentication',
    method: 'POST',
    path: '/v1/auth/step-up/{app_id}/account/{account_id}/step-up/verify',
    expectedBody: stepUpVerifyBody,
    expectedPath: `/v1/auth/step-up/${APP_ID}/account/${ACCOUNT_ID}/step-up/verify`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess(stepUpFixture, { requestId: REQUEST_ID }),
    run: context => createAuthStepUps(context.client).verify(APP_ID, ACCOUNT_ID, stepUpVerifyBody),
    assertResult: result => expect(result).toEqual(stepUpFixture),
  },
  {
    name: 'validates step-up authentication',
    method: 'POST',
    path: '/v1/auth/step-up/{app_id}/account/{account_id}/step-up/validate',
    expectedBody: stepUpValidateBody,
    expectedPath: `/v1/auth/step-up/${APP_ID}/account/${ACCOUNT_ID}/step-up/validate`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess(stepUpFixture, { requestId: REQUEST_ID }),
    run: context => createAuthStepUps(context.client).validate(APP_ID, ACCOUNT_ID, stepUpValidateBody),
    assertResult: result => expect(result).toEqual(stepUpFixture),
  },
  {
    name: 'lists trusted devices',
    method: 'GET',
    path: '/v1/auth/trusted-device/{app_id}/account/{account_id}/trusted-devices',
    expectedPath: `/v1/auth/trusted-device/${APP_ID}/account/${ACCOUNT_ID}/trusted-devices`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    expectedQuery: { limit: '1', 'sort[date_created]': 'desc' },
    expectedRawBody: '',
    response: conjoinList([authTrustedDeviceFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthTrustedDevices(context.client).list(APP_ID, ACCOUNT_ID, { limit: 1, sort: { date_created: 'desc' } }),
    assertResult: result => expect(result).toEqual({ success: true, data: [authTrustedDeviceFixture()], status: 200 }),
  },
  {
    name: 'revokes a trusted device',
    method: 'POST',
    path: '/v1/auth/trusted-device/{app_id}/account/{account_id}/trusted-devices/{trusted_device_id}/revoke',
    expectedPath: `/v1/auth/trusted-device/${APP_ID}/account/${ACCOUNT_ID}/trusted-devices/${TRUSTED_DEVICE_ID}/revoke`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID, trusted_device_id: TRUSTED_DEVICE_ID },
    response: conjoinSuccess(authTrustedDeviceFixture({ status: 'revoked' }), { requestId: REQUEST_ID }),
    run: context => createAuthTrustedDevices(context.client).revoke(APP_ID, ACCOUNT_ID, TRUSTED_DEVICE_ID),
    assertResult: result => expect(result).toEqual(authTrustedDeviceFixture({ status: 'revoked' })),
  },
  {
    name: 'revokes all trusted devices',
    method: 'POST',
    path: '/v1/auth/trusted-device/{app_id}/account/{account_id}/trusted-devices/revoke-all',
    expectedPath: `/v1/auth/trusted-device/${APP_ID}/account/${ACCOUNT_ID}/trusted-devices/revoke-all`,
    expectedPathParams: { account_id: ACCOUNT_ID, app_id: APP_ID },
    response: conjoinSuccess({ revoked_count: 2 }, { requestId: REQUEST_ID }),
    run: context => createAuthTrustedDevices(context.client).revokeAll(APP_ID, ACCOUNT_ID),
    assertResult: result => expect(result).toEqual({ revoked_count: 2 }),
  },
])
