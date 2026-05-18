import { expect } from 'vitest'
import { createAuthFlows, createAuthGuards } from '../../../src/auth'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  APP_ID,
  authFlowFixture,
  CLIENT_ID,
  CONJOIN_ACCOUNT_ID,
  CONJOIN_PROJECT_ID,
  DATE_CREATED,
  DATE_UPDATED,
  describeAuthSdkContractCases,
  REQUEST_ID,
} from './auth-test-utils'

const startFlowBody = {
  email: 'owner@example.com',
  password: 'correct horse battery staple',
  verification_option: 'email_verification_code' as const,
}
const completeFlowBody = { verification_result: { pin_code: '123456' } }
const startPasswordResetBody = { email: 'owner@example.com' }
const completePasswordResetBody = {
  new_password: 'better horse battery staple',
  reset_token: 'reset_token_123',
}
const guardEventFixture = {
  action_taken: 'challenge',
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  event_id: 'guard_event_123',
  event_type: 'brute_force',
  live_mode: false,
}
const guardSettingsBody = { is_enabled: true }
const guardSettingsFixture = {
  is_enabled: true,
  settings: {},
}
const trustedIpBody = { ip: '127.0.0.1' }
const anonymousIpsBody = { ips: ['127.0.0.1'] }

describeAuthSdkContractCases('Auth flow SDK contract integration', [
  {
    name: 'starts signup',
    method: 'POST',
    path: '/v1/auth/flow/{app_id}/{client_id}/signup/start',
    expectedBody: startFlowBody,
    expectedPath: `/v1/auth/flow/${APP_ID}/${CLIENT_ID}/signup/start`,
    expectedPathParams: { app_id: APP_ID, client_id: CLIENT_ID },
    response: conjoinSuccess(authFlowFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthFlows(context.client).startSignup(APP_ID, CLIENT_ID, startFlowBody),
    assertResult: result => expect(result).toEqual(authFlowFixture()),
  },
  {
    name: 'completes signup',
    method: 'POST',
    path: '/v1/auth/flow/{app_id}/{client_id}/signup/complete',
    expectedBody: completeFlowBody,
    expectedPath: `/v1/auth/flow/${APP_ID}/${CLIENT_ID}/signup/complete`,
    expectedPathParams: { app_id: APP_ID, client_id: CLIENT_ID },
    response: conjoinSuccess(authFlowFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthFlows(context.client).completeSignup(APP_ID, CLIENT_ID, completeFlowBody),
    assertResult: result => expect(result).toEqual(authFlowFixture()),
  },
  {
    name: 'starts signin',
    method: 'POST',
    path: '/v1/auth/flow/{app_id}/{client_id}/signin/start',
    expectedBody: startFlowBody,
    expectedPath: `/v1/auth/flow/${APP_ID}/${CLIENT_ID}/signin/start`,
    expectedPathParams: { app_id: APP_ID, client_id: CLIENT_ID },
    response: conjoinSuccess(authFlowFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthFlows(context.client).startSignin(APP_ID, CLIENT_ID, startFlowBody),
    assertResult: result => expect(result).toEqual(authFlowFixture()),
  },
  {
    name: 'completes signin',
    method: 'POST',
    path: '/v1/auth/flow/{app_id}/{client_id}/signin/complete',
    expectedBody: completeFlowBody,
    expectedPath: `/v1/auth/flow/${APP_ID}/${CLIENT_ID}/signin/complete`,
    expectedPathParams: { app_id: APP_ID, client_id: CLIENT_ID },
    response: conjoinSuccess(authFlowFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthFlows(context.client).completeSignin(APP_ID, CLIENT_ID, completeFlowBody),
    assertResult: result => expect(result).toEqual(authFlowFixture()),
  },
  {
    name: 'starts password reset',
    method: 'POST',
    path: '/v1/auth/flow/{app_id}/{client_id}/password/reset/start',
    expectedBody: startPasswordResetBody,
    expectedPath: `/v1/auth/flow/${APP_ID}/${CLIENT_ID}/password/reset/start`,
    expectedPathParams: { app_id: APP_ID, client_id: CLIENT_ID },
    response: conjoinSuccess(authFlowFixture({ status: 'verification_required' }), { requestId: REQUEST_ID }),
    run: context => createAuthFlows(context.client).startPasswordReset(APP_ID, CLIENT_ID, startPasswordResetBody),
    assertResult: result => expect(result).toEqual(authFlowFixture({ status: 'verification_required' })),
  },
  {
    name: 'completes password reset',
    method: 'POST',
    path: '/v1/auth/flow/{app_id}/{client_id}/password/reset/complete',
    expectedBody: completePasswordResetBody,
    expectedPath: `/v1/auth/flow/${APP_ID}/${CLIENT_ID}/password/reset/complete`,
    expectedPathParams: { app_id: APP_ID, client_id: CLIENT_ID },
    response: conjoinSuccess(authFlowFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthFlows(context.client).completePasswordReset(APP_ID, CLIENT_ID, completePasswordResetBody),
    assertResult: result => expect(result).toEqual(authFlowFixture()),
  },
])

describeAuthSdkContractCases('Auth guard SDK contract integration', [
  {
    name: 'reads guard events',
    method: 'GET',
    path: '/v1/auth/guard/{app_id}/guard/events',
    expectedPath: `/v1/auth/guard/${APP_ID}/guard/events`,
    expectedPathParams: { app_id: APP_ID },
    expectedQuery: { event_type: 'brute_force', limit: '1' },
    expectedRawBody: '',
    response: conjoinList([guardEventFixture], { requestId: REQUEST_ID }),
    run: context => createAuthGuards(context.client).readEvents(APP_ID, { event_type: 'brute_force', limit: 1 }),
    assertResult: result => expect(result).toEqual({ success: true, data: [guardEventFixture], status: 200 }),
  },
  {
    name: 'updates guard settings',
    method: 'PATCH',
    path: '/v1/auth/guard/{app_id}/guard/settings',
    expectedBody: guardSettingsBody,
    expectedPath: `/v1/auth/guard/${APP_ID}/guard/settings`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess(guardSettingsFixture, { requestId: REQUEST_ID }),
    run: context => createAuthGuards(context.client).updateSettings(APP_ID, guardSettingsBody),
    assertResult: result => expect(result).toEqual(guardSettingsFixture),
  },
  {
    name: 'adds a guard trusted IP',
    method: 'POST',
    path: '/v1/auth/guard/{app_id}/guard/trusted-ips',
    expectedBody: trustedIpBody,
    expectedPath: `/v1/auth/guard/${APP_ID}/guard/trusted-ips`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess({ added_at: '2026-05-16T00:00:00.000Z', ip: '127.0.0.1' }, { requestId: REQUEST_ID }),
    run: context => createAuthGuards(context.client).addTrustedIp(APP_ID, trustedIpBody),
    assertResult: result => expect(result).toEqual({ added_at: '2026-05-16T00:00:00.000Z', ip: '127.0.0.1' }),
  },
  {
    name: 'removes a guard trusted IP',
    method: 'POST',
    path: '/v1/auth/guard/{app_id}/guard/trusted-ips/remove',
    expectedBody: trustedIpBody,
    expectedPath: `/v1/auth/guard/${APP_ID}/guard/trusted-ips/remove`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess({ added_at: '2026-05-16T00:00:00.000Z', ip: '127.0.0.1' }, { requestId: REQUEST_ID }),
    run: context => createAuthGuards(context.client).removeTrustedIp(APP_ID, trustedIpBody),
    assertResult: result => expect(result).toEqual({ added_at: '2026-05-16T00:00:00.000Z', ip: '127.0.0.1' }),
  },
  {
    name: 'lists guard anonymous IPs',
    method: 'GET',
    path: '/v1/auth/guard/{app_id}/guard/anonymous-ips',
    expectedPath: `/v1/auth/guard/${APP_ID}/guard/anonymous-ips`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess({ ips: ['127.0.0.1'] }, { requestId: REQUEST_ID }),
    run: context => createAuthGuards(context.client).listAnonymousIps(APP_ID),
    assertResult: result => expect(result).toEqual({ ips: ['127.0.0.1'] }),
  },
  {
    name: 'adds guard anonymous IPs',
    method: 'POST',
    path: '/v1/auth/guard/{app_id}/guard/anonymous-ips',
    expectedBody: anonymousIpsBody,
    expectedPath: `/v1/auth/guard/${APP_ID}/guard/anonymous-ips`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess({ ips: ['127.0.0.1'] }, { requestId: REQUEST_ID }),
    run: context => createAuthGuards(context.client).addAnonymousIps(APP_ID, anonymousIpsBody),
    assertResult: result => expect(result).toEqual({ ips: ['127.0.0.1'] }),
  },
  {
    name: 'removes guard anonymous IPs',
    method: 'POST',
    path: '/v1/auth/guard/{app_id}/guard/anonymous-ips/remove',
    expectedBody: anonymousIpsBody,
    expectedPath: `/v1/auth/guard/${APP_ID}/guard/anonymous-ips/remove`,
    expectedPathParams: { app_id: APP_ID },
    response: conjoinSuccess({ ips: [] }, { requestId: REQUEST_ID }),
    run: context => createAuthGuards(context.client).removeAnonymousIps(APP_ID, anonymousIpsBody),
    assertResult: result => expect(result).toEqual({ ips: [] }),
  },
])
