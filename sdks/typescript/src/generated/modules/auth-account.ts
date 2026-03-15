import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createAuthAccount']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createAuthAccount']['responses']['201']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readAuthAccount']['responses']['200']['content']['application/json']['data']>
type ListData = NonNullable<operations['listAuthAccounts']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listAuthAccounts']['parameters']['query']>
type CountData = NonNullable<operations['countAuthAccounts']['responses']['200']['content']['application/json']['data']>
type CountQuery = NonNullable<operations['countAuthAccounts']['parameters']['query']>
type UpdateBody = operations['updateAuthAccount']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateAuthAccount']['responses']['200']['content']['application/json']['data']>
type UpdateMetadataBody = operations['updateAuthAccountMetadata']['requestBody']['content']['application/json']
type UpdateMetadataData = NonNullable<operations['updateAuthAccountMetadata']['responses']['200']['content']['application/json']['data']>
type UpdateStatusBody = operations['updateAuthAccountStatus']['requestBody']['content']['application/json']
type UpdateStatusData = NonNullable<operations['updateAuthAccountStatus']['responses']['200']['content']['application/json']['data']>
type AddEmailBody = operations['addAuthAccountEmail']['requestBody']['content']['application/json']
type AddEmailData = NonNullable<operations['addAuthAccountEmail']['responses']['200']['content']['application/json']['data']>
type AddPhoneBody = operations['addAuthAccountPhone']['requestBody']['content']['application/json']
type AddPhoneData = NonNullable<operations['addAuthAccountPhone']['responses']['200']['content']['application/json']['data']>
type RemoveEmailBody = operations['removeAuthAccountEmail']['requestBody']['content']['application/json']
type RemoveEmailData = NonNullable<operations['removeAuthAccountEmail']['responses']['200']['content']['application/json']['data']>
type RemovePhoneBody = operations['removeAuthAccountPhone']['requestBody']['content']['application/json']
type RemovePhoneData = NonNullable<operations['removeAuthAccountPhone']['responses']['200']['content']['application/json']['data']>
type ListOrganizationMembershipsData = NonNullable<operations['listAccountOrganizationMemberships']['responses']['200']['content']['application/json']['data']>[number]
type ListOrganizationMembershipsQuery = NonNullable<operations['listAccountOrganizationMemberships']['parameters']['query']>
type GrantOrgRoleBody = operations['grantOrgAccountRole']['requestBody']['content']['application/json']
type GrantOrgRoleData = NonNullable<operations['grantOrgAccountRole']['responses']['200']['content']['application/json']['data']>
type RevokeOrgRoleBody = operations['revokeOrgAccountRole']['requestBody']['content']['application/json']
type RevokeOrgRoleData = NonNullable<operations['revokeOrgAccountRole']['responses']['200']['content']['application/json']['data']>
type VerifyCredentialBody = operations['verifyCredential']['requestBody']['content']['application/json']
type VerifyCredentialData = NonNullable<operations['verifyCredential']['responses']['200']['content']['application/json']['data']>
type VerifyCredentialMfaTotpBody = operations['verifyCredentialMfaTotp']['requestBody']['content']['application/json']
type VerifyCredentialMfaTotpData = NonNullable<operations['verifyCredentialMfaTotp']['responses']['200']['content']['application/json']['data']>
type CountCredentialsData = NonNullable<operations['countCredentials']['responses']['200']['content']['application/json']['data']>
type CountCredentialsQuery = NonNullable<operations['countCredentials']['parameters']['query']>
type ListCredentialsData = NonNullable<operations['listCredentials']['responses']['200']['content']['application/json']['data']>[number]
type ListCredentialsQuery = NonNullable<operations['listCredentials']['parameters']['query']>
type RemoveCredentialBody = operations['removeCredential']['requestBody']['content']['application/json']
type RemoveCredentialData = NonNullable<operations['removeCredential']['responses']['200']['content']['application/json']['data']>
type GrantGlobalRoleBody = operations['grantGlobalRole']['requestBody']['content']['application/json']
type GrantGlobalRoleData = NonNullable<operations['grantGlobalRole']['responses']['200']['content']['application/json']['data']>
type RevokeGlobalRoleBody = operations['revokeGlobalRole']['requestBody']['content']['application/json']
type RevokeGlobalRoleData = NonNullable<operations['revokeGlobalRole']['responses']['200']['content']['application/json']['data']>
type DeleteBody = operations['deleteAuthAccount']['requestBody']['content']['application/json']
type DeleteData = NonNullable<operations['deleteAuthAccount']['responses']['200']['content']['application/json']['data']>
type ExportData = NonNullable<operations['exportAuthAccount']['responses']['200']['content']['application/json']['data']>
type SetCustomAttributesBody = operations['setAuthAccountCustomAttributes']['requestBody']['content']['application/json']
type SetCustomAttributesData = NonNullable<operations['setAuthAccountCustomAttributes']['responses']['200']['content']['application/json']['data']>
type MergeBody = operations['mergeAuthAccounts']['requestBody']['content']['application/json']
type MergeData = NonNullable<operations['mergeAuthAccounts']['responses']['200']['content']['application/json']['data']>

export function createAuthAccounts(client: ConjoinClient) {
  return {
    create: (appId: string, data: CreateBody) =>
      client.fetch<CreateData>(`auth/account/${appId}/account/create`, { method: 'POST', body: data }),

    read: (appId: string, accountId: string) =>
      client.fetch<ReadData>(`auth/account/${appId}/account/${accountId}`),

    list: (query?: ListQuery) =>
      client.fetchList<ListData>('auth/account/account', { query: query as Record<string, unknown> }),

    count: (query?: CountQuery) =>
      client.fetch<CountData>('auth/account/account/count', { query: query as Record<string, unknown> }),

    update: (appId: string, accountId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`auth/account/${appId}/account/${accountId}/update`, { method: 'PATCH', body: data }),

    updateMetadata: (appId: string, accountId: string, data: UpdateMetadataBody) =>
      client.fetch<UpdateMetadataData>(`auth/account/${appId}/account/${accountId}/metadata/update`, { method: 'PATCH', body: data }),

    updateStatus: (appId: string, accountId: string, data: UpdateStatusBody) =>
      client.fetch<UpdateStatusData>(`auth/account/${appId}/account/${accountId}/status/update`, { method: 'PATCH', body: data }),

    addEmail: (appId: string, accountId: string, data: AddEmailBody) =>
      client.fetch<AddEmailData>(`auth/account/${appId}/account/${accountId}/email/add`, { method: 'POST', body: data }),

    addPhone: (appId: string, accountId: string, data: AddPhoneBody) =>
      client.fetch<AddPhoneData>(`auth/account/${appId}/account/${accountId}/phone/add`, { method: 'POST', body: data }),

    removeEmail: (appId: string, accountId: string, data: RemoveEmailBody) =>
      client.fetch<RemoveEmailData>(`auth/account/${appId}/account/${accountId}/email/remove`, { method: 'POST', body: data }),

    removePhone: (appId: string, accountId: string, data: RemovePhoneBody) =>
      client.fetch<RemovePhoneData>(`auth/account/${appId}/account/${accountId}/phone/remove`, { method: 'POST', body: data }),

    listOrganizationMemberships: (appId: string, accountId: string, query?: ListOrganizationMembershipsQuery) =>
      client.fetchList<ListOrganizationMembershipsData>(`auth/account/${appId}/account/${accountId}/organizations`, { query: query as Record<string, unknown> }),

    grantOrgRole: (appId: string, organizationId: string, accountId: string, data: GrantOrgRoleBody) =>
      client.fetch<GrantOrgRoleData>(`auth/account/${appId}/organization/${organizationId}/account/${accountId}/role/grant`, { method: 'POST', body: data }),

    revokeOrgRole: (appId: string, organizationId: string, accountId: string, data: RevokeOrgRoleBody) =>
      client.fetch<RevokeOrgRoleData>(`auth/account/${appId}/organization/${organizationId}/account/${accountId}/role/revoke`, { method: 'POST', body: data }),

    verifyCredential: (appId: string, accountId: string, data: VerifyCredentialBody) =>
      client.fetch<VerifyCredentialData>(`auth/account/${appId}/account/${accountId}/credential/verify`, { method: 'POST', body: data }),

    verifyCredentialMfaTotp: (appId: string, accountId: string, data: VerifyCredentialMfaTotpBody) =>
      client.fetch<VerifyCredentialMfaTotpData>(`auth/account/${appId}/account/${accountId}/credential/mfa/totp/verify`, { method: 'POST', body: data }),

    countCredentials: (appId: string, accountId: string, query?: CountCredentialsQuery) =>
      client.fetch<CountCredentialsData>(`auth/account/${appId}/account/${accountId}/credential/count`, { query: query as Record<string, unknown> }),

    listCredentials: (appId: string, accountId: string, query?: ListCredentialsQuery) =>
      client.fetchList<ListCredentialsData>(`auth/account/${appId}/account/${accountId}/credential`, { query: query as Record<string, unknown> }),

    removeCredential: (appId: string, accountId: string, data: RemoveCredentialBody) =>
      client.fetch<RemoveCredentialData>(`auth/account/${appId}/account/${accountId}/credential/remove`, { method: 'POST', body: data }),

    grantGlobalRole: (appId: string, accountId: string, data: GrantGlobalRoleBody) =>
      client.fetch<GrantGlobalRoleData>(`auth/account/${appId}/account/${accountId}/global-role/grant`, { method: 'POST', body: data }),

    revokeGlobalRole: (appId: string, accountId: string, data: RevokeGlobalRoleBody) =>
      client.fetch<RevokeGlobalRoleData>(`auth/account/${appId}/account/${accountId}/global-role/revoke`, { method: 'POST', body: data }),

    delete: (appId: string, accountId: string, data: DeleteBody) =>
      client.fetch<DeleteData>(`auth/account/${appId}/account/${accountId}/delete`, { method: 'POST', body: data }),

    export: (appId: string, accountId: string) =>
      client.fetch<ExportData>(`auth/account/${appId}/account/${accountId}/export`),

    setCustomAttributes: (appId: string, accountId: string, data: SetCustomAttributesBody) =>
      client.fetch<SetCustomAttributesData>(`auth/account/${appId}/account/${accountId}/custom-attributes`, { method: 'PUT', body: data }),

    merge: (appId: string, data: MergeBody) =>
      client.fetch<MergeData>(`auth/account/${appId}/account/merge`, { method: 'POST', body: data }),
  }
}
