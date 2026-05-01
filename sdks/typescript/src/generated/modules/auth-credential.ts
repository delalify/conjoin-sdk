import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreatePasswordBody = operations['createPasswordCredential']['requestBody']['content']['application/json']
type CreatePasswordData = NonNullable<operations['createPasswordCredential']['responses']['201']['content']['application/json']['data']>
type RotatePasswordBody = operations['rotatePasswordCredential']['requestBody']['content']['application/json']
type RotatePasswordData = NonNullable<operations['rotatePasswordCredential']['responses']['200']['content']['application/json']['data']>
type EnrollTotpBody = operations['enrollTotpCredential']['requestBody']['content']['application/json']
type EnrollTotpData = NonNullable<operations['enrollTotpCredential']['responses']['201']['content']['application/json']['data']>
type ActivateTotpBody = operations['activateTotpCredential']['requestBody']['content']['application/json']
type ActivateTotpData = NonNullable<operations['activateTotpCredential']['responses']['200']['content']['application/json']['data']>
type RotateTotpRecoveryCodesBody = operations['rotateTotpRecoveryCodes']['requestBody']['content']['application/json']
type RotateTotpRecoveryCodesData = NonNullable<operations['rotateTotpRecoveryCodes']['responses']['200']['content']['application/json']['data']>
type ConsumeTotpRecoveryCodeBody = operations['consumeTotpRecoveryCode']['requestBody']['content']['application/json']
type ConsumeTotpRecoveryCodeData = NonNullable<operations['consumeTotpRecoveryCode']['responses']['200']['content']['application/json']['data']>
type EnrollSmsMfaBody = operations['enrollSmsMfaCredential']['requestBody']['content']['application/json']
type EnrollSmsMfaData = NonNullable<operations['enrollSmsMfaCredential']['responses']['201']['content']['application/json']['data']>
type ActivateSmsMfaBody = operations['activateSmsMfaCredential']['requestBody']['content']['application/json']
type ActivateSmsMfaData = NonNullable<operations['activateSmsMfaCredential']['responses']['200']['content']['application/json']['data']>
type VerifySmsMfaBody = operations['verifySmsMfaCredential']['requestBody']['content']['application/json']
type VerifySmsMfaData = NonNullable<operations['verifySmsMfaCredential']['responses']['200']['content']['application/json']['data']>
type SendSmsMfaChallengeData = NonNullable<operations['sendSmsMfaChallenge']['responses']['200']['content']['application/json']['data']>
type EnrollEmailMfaBody = operations['enrollEmailMfaCredential']['requestBody']['content']['application/json']
type EnrollEmailMfaData = NonNullable<operations['enrollEmailMfaCredential']['responses']['201']['content']['application/json']['data']>
type ActivateEmailMfaBody = operations['activateEmailMfaCredential']['requestBody']['content']['application/json']
type ActivateEmailMfaData = NonNullable<operations['activateEmailMfaCredential']['responses']['200']['content']['application/json']['data']>
type VerifyEmailMfaBody = operations['verifyEmailMfaCredential']['requestBody']['content']['application/json']
type VerifyEmailMfaData = NonNullable<operations['verifyEmailMfaCredential']['responses']['200']['content']['application/json']['data']>
type SendEmailMfaChallengeData = NonNullable<operations['sendEmailMfaChallenge']['responses']['200']['content']['application/json']['data']>
type ReadApiKeyUsageData = NonNullable<operations['readApiKeyUsage']['responses']['200']['content']['application/json']['data']>
type IssueApiKeyBody = operations['issueApiKeyCredential']['requestBody']['content']['application/json']
type IssueApiKeyData = NonNullable<operations['issueApiKeyCredential']['responses']['201']['content']['application/json']['data']>
type RotateApiKeyBody = operations['rotateApiKeyCredential']['requestBody']['content']['application/json']
type RotateApiKeyData = NonNullable<operations['rotateApiKeyCredential']['responses']['200']['content']['application/json']['data']>
type RevokeApiKeyBody = operations['revokeApiKeyCredential']['requestBody']['content']['application/json']
type RevokeApiKeyData = NonNullable<operations['revokeApiKeyCredential']['responses']['200']['content']['application/json']['data']>
type UpdateApiKeyBody = operations['updateApiKeyCredential']['requestBody']['content']['application/json']
type UpdateApiKeyData = NonNullable<operations['updateApiKeyCredential']['responses']['200']['content']['application/json']['data']>
type StartPasskeyRegistrationBody = operations['startPasskeyRegistration']['requestBody']['content']['application/json']
type StartPasskeyRegistrationData = NonNullable<operations['startPasskeyRegistration']['responses']['200']['content']['application/json']['data']>
type VerifyPasskeyRegistrationBody = operations['verifyPasskeyRegistration']['requestBody']['content']['application/json']
type VerifyPasskeyRegistrationData = NonNullable<operations['verifyPasskeyRegistration']['responses']['201']['content']['application/json']['data']>
type StartPasskeyenticationData = NonNullable<operations['startPasskeyAuthentication']['responses']['200']['content']['application/json']['data']>
type VerifyPasskeyenticationBody = operations['verifyPasskeyAuthentication']['requestBody']['content']['application/json']
type VerifyPasskeyenticationData = NonNullable<operations['verifyPasskeyAuthentication']['responses']['200']['content']['application/json']['data']>

export function createAuthCredentials(client: ConjoinClient) {
  return {
    createPassword: (appId: string, accountId: string, data: CreatePasswordBody) =>
      client.fetch<CreatePasswordData>(`auth/credential/${appId}/account/${accountId}/credential/password/create`, { method: 'POST', body: data }),

    rotatePassword: (appId: string, accountId: string, data: RotatePasswordBody) =>
      client.fetch<RotatePasswordData>(`auth/credential/${appId}/account/${accountId}/credential/password/rotate`, { method: 'POST', body: data }),

    enrollTotp: (appId: string, accountId: string, data: EnrollTotpBody) =>
      client.fetch<EnrollTotpData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/totp/enroll`, { method: 'POST', body: data }),

    activateTotp: (appId: string, accountId: string, data: ActivateTotpBody) =>
      client.fetch<ActivateTotpData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/totp/activate`, { method: 'POST', body: data }),

    rotateTotpRecoveryCodes: (appId: string, accountId: string, data: RotateTotpRecoveryCodesBody) =>
      client.fetch<RotateTotpRecoveryCodesData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/totp/recovery/rotate`, { method: 'POST', body: data }),

    consumeTotpRecoveryCode: (appId: string, accountId: string, data: ConsumeTotpRecoveryCodeBody) =>
      client.fetch<ConsumeTotpRecoveryCodeData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/totp/recovery/consume`, { method: 'POST', body: data }),

    enrollSmsMfa: (appId: string, accountId: string, data: EnrollSmsMfaBody) =>
      client.fetch<EnrollSmsMfaData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/sms/enroll`, { method: 'POST', body: data }),

    activateSmsMfa: (appId: string, accountId: string, data: ActivateSmsMfaBody) =>
      client.fetch<ActivateSmsMfaData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/sms/activate`, { method: 'POST', body: data }),

    verifySmsMfa: (appId: string, accountId: string, data: VerifySmsMfaBody) =>
      client.fetch<VerifySmsMfaData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/sms/verify`, { method: 'POST', body: data }),

    sendSmsMfaChallenge: (appId: string, accountId: string) =>
      client.fetch<SendSmsMfaChallengeData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/sms/challenge`, { method: 'POST' }),

    enrollEmailMfa: (appId: string, accountId: string, data: EnrollEmailMfaBody) =>
      client.fetch<EnrollEmailMfaData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/email/enroll`, { method: 'POST', body: data }),

    activateEmailMfa: (appId: string, accountId: string, data: ActivateEmailMfaBody) =>
      client.fetch<ActivateEmailMfaData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/email/activate`, { method: 'POST', body: data }),

    verifyEmailMfa: (appId: string, accountId: string, data: VerifyEmailMfaBody) =>
      client.fetch<VerifyEmailMfaData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/email/verify`, { method: 'POST', body: data }),

    sendEmailMfaChallenge: (appId: string, accountId: string) =>
      client.fetch<SendEmailMfaChallengeData>(`auth/credential/${appId}/account/${accountId}/credential/mfa/email/challenge`, { method: 'POST' }),

    readApiKeyUsage: (appId: string, accountId: string) =>
      client.fetch<ReadApiKeyUsageData>(`auth/credential/${appId}/account/${accountId}/credentials/api-keys/usage-stats`),

    issueApiKey: (appId: string, accountId: string, data: IssueApiKeyBody) =>
      client.fetch<IssueApiKeyData>(`auth/credential/${appId}/account/${accountId}/credential/api-key/issue`, { method: 'POST', body: data }),

    rotateApiKey: (appId: string, accountId: string, data: RotateApiKeyBody) =>
      client.fetch<RotateApiKeyData>(`auth/credential/${appId}/account/${accountId}/credential/api-key/rotate`, { method: 'POST', body: data }),

    revokeApiKey: (appId: string, accountId: string, data: RevokeApiKeyBody) =>
      client.fetch<RevokeApiKeyData>(`auth/credential/${appId}/account/${accountId}/credential/api-key/revoke`, { method: 'POST', body: data }),

    updateApiKey: (appId: string, accountId: string, credentialId: string, data: UpdateApiKeyBody) =>
      client.fetch<UpdateApiKeyData>(`auth/credential/${appId}/account/${accountId}/credential/api-key/${credentialId}/update`, { method: 'PATCH', body: data }),

    startPasskeyRegistration: (appId: string, accountId: string, data: StartPasskeyRegistrationBody) =>
      client.fetch<StartPasskeyRegistrationData>(`auth/credential/${appId}/account/${accountId}/credential/passkey/registration/start`, { method: 'POST', body: data }),

    verifyPasskeyRegistration: (appId: string, accountId: string, data: VerifyPasskeyRegistrationBody) =>
      client.fetch<VerifyPasskeyRegistrationData>(`auth/credential/${appId}/account/${accountId}/credential/passkey/registration/verify`, { method: 'POST', body: data }),

    startPasskeyentication: (appId: string, accountId: string) =>
      client.fetch<StartPasskeyenticationData>(`auth/credential/${appId}/account/${accountId}/credential/passkey/authentication/start`, { method: 'POST' }),

    verifyPasskeyentication: (appId: string, accountId: string, data: VerifyPasskeyenticationBody) =>
      client.fetch<VerifyPasskeyenticationData>(`auth/credential/${appId}/account/${accountId}/credential/passkey/authentication/verify`, { method: 'POST', body: data }),
  }
}
