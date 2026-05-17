import { expect } from 'vitest'
import { createAuthSessions } from '../../../src/auth'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  ACCOUNT_ID,
  APP_ID,
  authSessionFixture,
  CLIENT_ID,
  describeAuthSdkContractCases,
  REQUEST_ID,
  SESSION_ID,
} from './auth-test-utils'

const BULK_SESSION_ID = 'auth_session_456'
const countFixture = { count: 2 }
const refreshBody = { refresh_token: 'refresh_token_123' }
const revokeBody = { exclude_current_session: true }
const bulkRevokeBody = {
  revoke_reason: 'security_review',
  session_ids: [SESSION_ID, BULK_SESSION_ID],
}
const updateBody = {
  extends_by_seconds: 3600,
  metadata: {
    device: 'desktop',
  },
  status: 'active' as const,
}
const validateBody = {
  check_expiry: true,
  ip_address: '127.0.0.1',
  update_last_activity: true,
}
const validateFixture = {
  account_id: ACCOUNT_ID,
  session_id: SESSION_ID,
  valid: true,
}
const analyticsFixture = {
  data: [
    {
      active_sessions: 2,
      period: '2026-05-16',
    },
  ],
}

describeAuthSdkContractCases('Auth session SDK contract integration', [
  {
    name: 'reads an auth session',
    method: 'GET',
    path: '/v1/auth/session/{app_id}/session/{session_id}',
    expectedPath: `/v1/auth/session/${APP_ID}/session/${SESSION_ID}`,
    expectedPathParams: {
      app_id: APP_ID,
      session_id: SESSION_ID,
    },
    response: conjoinSuccess(authSessionFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthSessions(context.client).read(APP_ID, SESSION_ID),
    assertResult: result => expect(result).toEqual(authSessionFixture()),
  },
  {
    name: 'lists auth sessions for a client',
    method: 'GET',
    path: '/v1/auth/session/client/{client_id}/sessions',
    expectedPath: `/v1/auth/session/client/${CLIENT_ID}/sessions`,
    expectedPathParams: {
      client_id: CLIENT_ID,
    },
    expectedQuery: {
      'cursor[next]': 'cursor_next_123',
      limit: '2',
      'query[account_id]': ACCOUNT_ID,
      'query[status]': 'active',
      'sort[date_created]': 'desc',
    },
    expectedRawBody: '',
    response: conjoinList([authSessionFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context =>
      createAuthSessions(context.client).list(CLIENT_ID, {
        cursor: {
          next: 'cursor_next_123',
        },
        limit: 2,
        query: {
          account_id: ACCOUNT_ID,
          status: 'active',
        },
        sort: {
          date_created: 'desc',
        },
      }),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [authSessionFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'counts auth sessions',
    method: 'GET',
    path: '/v1/auth/session/session/count',
    expectedQuery: {
      account_id: ACCOUNT_ID,
      client_id: CLIENT_ID,
      is_expired: 'false',
      status: 'active',
    },
    expectedRawBody: '',
    response: conjoinSuccess(countFixture, { requestId: REQUEST_ID }),
    run: context =>
      createAuthSessions(context.client).count({
        account_id: ACCOUNT_ID,
        client_id: CLIENT_ID,
        is_expired: false,
        status: 'active',
      }),
    assertResult: result => expect(result).toEqual(countFixture),
  },
  {
    name: 'updates an auth session',
    method: 'PATCH',
    path: '/v1/auth/session/{app_id}/session/{session_id}/update',
    expectedBody: updateBody,
    expectedPath: `/v1/auth/session/${APP_ID}/session/${SESSION_ID}/update`,
    expectedPathParams: {
      app_id: APP_ID,
      session_id: SESSION_ID,
    },
    response: conjoinSuccess(authSessionFixture({ metadata: updateBody.metadata }), { requestId: REQUEST_ID }),
    run: context => createAuthSessions(context.client).update(APP_ID, SESSION_ID, updateBody),
    assertResult: result => expect(result).toEqual(authSessionFixture({ metadata: updateBody.metadata })),
  },
  {
    name: 'refreshes an auth session',
    method: 'POST',
    path: '/v1/auth/session/{app_id}/session/{session_id}/refresh',
    expectedBody: refreshBody,
    expectedPath: `/v1/auth/session/${APP_ID}/session/${SESSION_ID}/refresh`,
    expectedPathParams: {
      app_id: APP_ID,
      session_id: SESSION_ID,
    },
    response: conjoinSuccess(authSessionFixture(), { requestId: REQUEST_ID }),
    run: context => createAuthSessions(context.client).refresh(APP_ID, SESSION_ID, refreshBody),
    assertResult: result => expect(result).toEqual(authSessionFixture()),
  },
  {
    name: 'validates an auth session',
    method: 'POST',
    path: '/v1/auth/session/{app_id}/session/{session_id}/validate',
    expectedBody: validateBody,
    expectedPath: `/v1/auth/session/${APP_ID}/session/${SESSION_ID}/validate`,
    expectedPathParams: {
      app_id: APP_ID,
      session_id: SESSION_ID,
    },
    response: conjoinSuccess(validateFixture, { requestId: REQUEST_ID }),
    run: context => createAuthSessions(context.client).validate(APP_ID, SESSION_ID, validateBody),
    assertResult: result => expect(result).toEqual(validateFixture),
  },
  {
    name: 'revokes an auth session',
    method: 'POST',
    path: '/v1/auth/session/{app_id}/client/{client_id}/session/{session_id}/revoke',
    expectedBody: revokeBody,
    expectedPath: `/v1/auth/session/${APP_ID}/client/${CLIENT_ID}/session/${SESSION_ID}/revoke`,
    expectedPathParams: {
      app_id: APP_ID,
      client_id: CLIENT_ID,
      session_id: SESSION_ID,
    },
    response: conjoinSuccess(authSessionFixture({ revoked_reason: 'manual', status: 'ended' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createAuthSessions(context.client).revoke(APP_ID, CLIENT_ID, SESSION_ID, revokeBody),
    assertResult: result => expect(result).toEqual(authSessionFixture({ revoked_reason: 'manual', status: 'ended' })),
  },
  {
    name: 'revokes all auth sessions for an account',
    method: 'POST',
    path: '/v1/auth/session/{app_id}/account/{account_id}/sessions/revoke',
    expectedBody: revokeBody,
    expectedPath: `/v1/auth/session/${APP_ID}/account/${ACCOUNT_ID}/sessions/revoke`,
    expectedPathParams: {
      account_id: ACCOUNT_ID,
      app_id: APP_ID,
    },
    response: conjoinSuccess(authSessionFixture({ revoked_reason: 'manual', status: 'ended' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createAuthSessions(context.client).revokeAllForAccount(APP_ID, ACCOUNT_ID, revokeBody),
    assertResult: result => expect(result).toEqual(authSessionFixture({ revoked_reason: 'manual', status: 'ended' })),
  },
  {
    name: 'bulk revokes account sessions',
    method: 'POST',
    path: '/v1/auth/session/account/{account_id}/sessions/revoke/bulk',
    expectedBody: bulkRevokeBody,
    expectedPath: `/v1/auth/session/account/${ACCOUNT_ID}/sessions/revoke/bulk`,
    expectedPathParams: {
      account_id: ACCOUNT_ID,
    },
    response: conjoinSuccess(authSessionFixture({ revoked_reason: 'security_review', status: 'ended' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createAuthSessions(context.client).bulkRevokeAccount(ACCOUNT_ID, bulkRevokeBody),
    assertResult: result =>
      expect(result).toEqual(authSessionFixture({ revoked_reason: 'security_review', status: 'ended' })),
  },
  {
    name: 'bulk revokes client sessions',
    method: 'POST',
    path: '/v1/auth/session/client/{client_id}/sessions/revoke/bulk',
    expectedBody: bulkRevokeBody,
    expectedPath: `/v1/auth/session/client/${CLIENT_ID}/sessions/revoke/bulk`,
    expectedPathParams: {
      client_id: CLIENT_ID,
    },
    response: conjoinSuccess(authSessionFixture({ revoked_reason: 'security_review', status: 'ended' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createAuthSessions(context.client).bulkRevokeClient(CLIENT_ID, bulkRevokeBody),
    assertResult: result =>
      expect(result).toEqual(authSessionFixture({ revoked_reason: 'security_review', status: 'ended' })),
  },
  {
    name: 'lists auth sessions by account',
    method: 'GET',
    path: '/v1/auth/session/sessions/account',
    expectedQuery: {
      account_id: ACCOUNT_ID,
      include_expired: 'false',
      limit: '1',
      status: 'active',
    },
    expectedRawBody: '',
    response: conjoinList([authSessionFixture()], { requestId: REQUEST_ID }),
    run: context =>
      createAuthSessions(context.client).listByAccount({
        account_id: ACCOUNT_ID,
        include_expired: false,
        limit: 1,
        status: 'active',
      }),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [authSessionFixture()],
        status: 200,
      }),
  },
  {
    name: 'lists auth sessions by client',
    method: 'GET',
    path: '/v1/auth/session/sessions/client',
    expectedQuery: {
      client_id: CLIENT_ID,
      include_expired: 'true',
      limit: '1',
      status: 'ended',
    },
    expectedRawBody: '',
    response: conjoinList([authSessionFixture({ status: 'ended' })], { requestId: REQUEST_ID }),
    run: context =>
      createAuthSessions(context.client).listByClient({
        client_id: CLIENT_ID,
        include_expired: true,
        limit: 1,
        status: 'ended',
      }),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [authSessionFixture({ status: 'ended' })],
        status: 200,
      }),
  },
  {
    name: 'gets active session count',
    method: 'GET',
    path: '/v1/auth/session/session/active/count',
    expectedQuery: {
      account_id: ACCOUNT_ID,
      time_window_hours: '24',
    },
    expectedRawBody: '',
    response: conjoinSuccess(countFixture, { requestId: REQUEST_ID }),
    run: context =>
      createAuthSessions(context.client).getActiveCount({
        account_id: ACCOUNT_ID,
        time_window_hours: 24,
      }),
    assertResult: result => expect(result).toEqual(countFixture),
  },
  {
    name: 'gets active client session count',
    method: 'GET',
    path: '/v1/auth/session/session/active/client-count',
    expectedQuery: {
      client_id: CLIENT_ID,
      time_window_hours: '12',
    },
    expectedRawBody: '',
    response: conjoinSuccess(countFixture, { requestId: REQUEST_ID }),
    run: context =>
      createAuthSessions(context.client).getActiveClientCount({
        client_id: CLIENT_ID,
        time_window_hours: 12,
      }),
    assertResult: result => expect(result).toEqual(countFixture),
  },
  {
    name: 'gets session analytics',
    method: 'GET',
    path: '/v1/auth/session/session/analytics',
    expectedQuery: {
      client_ids: [CLIENT_ID, 'auth_client_456'],
      end_date: '2026-05-17T00:00:00.000Z',
      group_by: 'day',
      include_clients: 'true',
      start_date: '2026-05-16T00:00:00.000Z',
    },
    expectedRawBody: '',
    response: conjoinSuccess(analyticsFixture, { requestId: REQUEST_ID }),
    run: context =>
      createAuthSessions(context.client).getAnalytics({
        client_ids: [CLIENT_ID, 'auth_client_456'],
        end_date: '2026-05-17T00:00:00.000Z',
        group_by: 'day',
        include_clients: true,
        start_date: '2026-05-16T00:00:00.000Z',
      }),
    assertResult: result => expect(result).toEqual(analyticsFixture),
  },
])
