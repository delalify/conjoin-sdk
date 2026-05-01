import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type StartRecoveryData = NonNullable<operations['startRecovery']['responses']['200']['content']['application/json']['data']>
type VerifyRecoveryBody = operations['verifyRecovery']['requestBody']['content']['application/json']
type VerifyRecoveryData = NonNullable<operations['verifyRecovery']['responses']['200']['content']['application/json']['data']>
type CompleteRecoveryBody = operations['completeRecovery']['requestBody']['content']['application/json']
type CompleteRecoveryData = NonNullable<operations['completeRecovery']['responses']['200']['content']['application/json']['data']>
type AdminResetAccountData = NonNullable<operations['adminResetAccount']['responses']['200']['content']['application/json']['data']>

export function createAuthAccountRecoveries(client: ConjoinClient) {
  return {
    startRecovery: (appId: string, accountId: string) =>
      client.fetch<StartRecoveryData>(`auth/recovery/${appId}/account/${accountId}/recovery/start`, { method: 'POST' }),

    verifyRecovery: (appId: string, accountId: string, data: VerifyRecoveryBody) =>
      client.fetch<VerifyRecoveryData>(`auth/recovery/${appId}/account/${accountId}/recovery/verify`, { method: 'POST', body: data }),

    completeRecovery: (appId: string, accountId: string, data: CompleteRecoveryBody) =>
      client.fetch<CompleteRecoveryData>(`auth/recovery/${appId}/account/${accountId}/recovery/complete`, { method: 'POST', body: data }),

    adminResetAccount: (appId: string, accountId: string) =>
      client.fetch<AdminResetAccountData>(`auth/recovery/${appId}/account/${accountId}/recovery/admin-reset`, { method: 'POST' }),
  }
}
