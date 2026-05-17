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
export const CREDENTIAL_ID = 'auth_credential_123'
export const DATE_CREATED = '2026-05-16T00:00:00.000Z'
export const DATE_UPDATED = '2026-05-16T01:00:00.000Z'
export const EXPIRES_AT = '2026-05-17T00:00:00.000Z'
export const GROUP_ID = 'auth_group_123'
export const INVITATION_ID = 'auth_invitation_123'
export const MEMBERSHIP_ID = 'auth_membership_123'
export const ORGANIZATION_ID = 'auth_organization_123'
export const PERMISSION_ID = 'auth_permission_123'
export const POLICY_ID = 'auth_policy_123'
export const PROJECT_ID = 'project_123'
export const RESOURCE_GRANT_ID = 'auth_resource_grant_123'
export const ROLE_ASSIGNMENT_LOG_ID = 'auth_role_assignment_log_123'
export const ROLE_ID = 'auth_role_123'
export const ROLE_PERMISSION_ID = 'auth_role_permission_123'
export const REQUEST_ID = 'cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1'
export const SESSION_ID = 'auth_session_123'
export const TRUSTED_DEVICE_ID = 'auth_trusted_device_123'

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

export const authAccountFixture = (overrides: Record<string, unknown> = {}) => ({
  account_id: ACCOUNT_ID,
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  emails: {
    others: [
      {
        email: 'secondary@example.com',
        verified: false,
      },
    ],
    primary: 'owner@example.com',
  },
  live_mode: false,
  metadata: {
    source: 'contract',
  },
  name: 'Auth Account',
  phones: {
    others: [
      {
        phone: '+2335550101',
        verified: false,
      },
    ],
    primary: '+2335550100',
  },
  primary_email: 'owner@example.com',
  primary_phone: '+2335550100',
  reference_id: 'account_ref_123',
  status: 'active',
  ...overrides,
})

export const authAppFixture = (overrides: Record<string, unknown> = {}) => ({
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  description: 'Contract auth app',
  live_mode: false,
  metadata: {
    source: 'contract',
  },
  name: 'Contract Auth',
  reference_id: 'app_ref_123',
  slug: 'contract-auth',
  support_email: 'support@example.com',
  ...overrides,
})

export const authCertificateFixture = (overrides: Record<string, unknown> = {}) => ({
  certificate: '-----BEGIN CERTIFICATE-----\\ncontract\\n-----END CERTIFICATE-----',
  certificate_id: 'auth_certificate_123',
  created_at: DATE_CREATED,
  expires_at: EXPIRES_AT,
  fingerprint: 'fingerprint_123',
  metadata: {
    algorithm: 'RS256',
    key_size: 2048,
    type: 'sp_signing',
  },
  status: 'active',
  updated_at: DATE_UPDATED,
  ...overrides,
})

export const authClientFixture = (overrides: Record<string, unknown> = {}) => ({
  app_id: APP_ID,
  client_id: CLIENT_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  name: 'Web client',
  ...overrides,
})

export const authCredentialFixture = (overrides: Record<string, unknown> = {}) => ({
  account_id: ACCOUNT_ID,
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  credential_id: CREDENTIAL_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  kind: 'password',
  live_mode: false,
  status: 'active',
  ...overrides,
})

export const authFlowFixture = (overrides: Record<string, unknown> = {}) => ({
  account_id: ACCOUNT_ID,
  session_id: SESSION_ID,
  status: 'complete',
  ...overrides,
})

export const authGroupFixture = (overrides: Record<string, unknown> = {}) => ({
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  group_id: GROUP_ID,
  live_mode: false,
  name: 'Operators',
  organization_id: ORGANIZATION_ID,
  roles: ['admin'],
  slug: 'operators',
  total_members: 1,
  ...overrides,
})

export const authGroupMemberFixture = (overrides: Record<string, unknown> = {}) => ({
  account_id: ACCOUNT_ID,
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  group_id: GROUP_ID,
  group_membership_id: 'auth_group_membership_123',
  live_mode: false,
  organization_id: ORGANIZATION_ID,
  status: 'active',
  ...overrides,
})

export const authInvitationFixture = (overrides: Record<string, unknown> = {}) => ({
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  email: 'invitee@example.com',
  invitation_id: INVITATION_ID,
  invited_by_account_id: ACCOUNT_ID,
  live_mode: false,
  organization_id: ORGANIZATION_ID,
  roles: ['admin'],
  status: 'pending',
  ...overrides,
})

export const authOrganizationFixture = (overrides: Record<string, unknown> = {}) => ({
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  name: 'Contract Organization',
  organization_id: ORGANIZATION_ID,
  slug: 'contract-organization',
  ...overrides,
})

export const authMembershipFixture = (overrides: Record<string, unknown> = {}) => ({
  account_id: ACCOUNT_ID,
  account_organization_id: MEMBERSHIP_ID,
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  organization_id: ORGANIZATION_ID,
  roles: ['admin'],
  status: 'active',
  ...overrides,
})

export const authPermissionFixture = (overrides: Record<string, unknown> = {}) => ({
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  identifier: 'project.read',
  key: 'project.read',
  live_mode: false,
  name: 'Read projects',
  organization_id: ORGANIZATION_ID,
  permission_id: PERMISSION_ID,
  ...overrides,
})

export const authPolicyFixture = (overrides: Record<string, unknown> = {}) => ({
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  effect: 'allow',
  live_mode: false,
  name: 'Allow project reads',
  organization_id: ORGANIZATION_ID,
  permission_keys: ['project.read'],
  policy_id: POLICY_ID,
  ...overrides,
})

export const authResourceGrantFixture = (overrides: Record<string, unknown> = {}) => ({
  account_id: ACCOUNT_ID,
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  organization_id: ORGANIZATION_ID,
  permission_keys: ['project.read'],
  granted_at: DATE_CREATED,
  resource_grant_id: RESOURCE_GRANT_ID,
  resource_id: 'resource_123',
  resource_type: 'project',
  ...overrides,
})

export const authRoleFixture = (overrides: Record<string, unknown> = {}) => ({
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  identifier: 'admin',
  key: 'admin',
  live_mode: false,
  name: 'Admin',
  organization_id: ORGANIZATION_ID,
  role_id: ROLE_ID,
  ...overrides,
})

export const authRolePermissionFixture = (overrides: Record<string, unknown> = {}) => ({
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  organization_id: ORGANIZATION_ID,
  permission_id: PERMISSION_ID,
  role_id: ROLE_ID,
  role_permission_id: ROLE_PERMISSION_ID,
  ...overrides,
})

export const authRoleAssignmentLogFixture = (overrides: Record<string, unknown> = {}) => ({
  account_id: ACCOUNT_ID,
  action: 'grant',
  assignment_log_id: ROLE_ASSIGNMENT_LOG_ID,
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  live_mode: false,
  organization_id: ORGANIZATION_ID,
  performed_at: DATE_CREATED,
  performed_by_account_id: 'actor_123',
  role_key: 'admin',
  ...overrides,
})

export const authTrustedDeviceFixture = (overrides: Record<string, unknown> = {}) => ({
  account_id: ACCOUNT_ID,
  app_id: APP_ID,
  conjoin_account_id: CONJOIN_ACCOUNT_ID,
  conjoin_project_id: CONJOIN_PROJECT_ID,
  date_created: DATE_CREATED,
  date_updated: DATE_UPDATED,
  device_fingerprint: 'device_fingerprint_123',
  live_mode: false,
  status: 'active',
  trusted_device_id: TRUSTED_DEVICE_ID,
  ...overrides,
})
