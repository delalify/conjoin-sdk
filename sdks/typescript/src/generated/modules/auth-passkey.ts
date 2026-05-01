import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<operations['listPasskeys']['responses']['200']['content']['application/json']['data']>[number]
type ReadData = NonNullable<operations['readPasskey']['responses']['200']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deletePasskey']['responses']['200']['content']['application/json']['data']>

export function createAuthPasskeys(client: ConjoinClient) {
  return {
    list: (appId: string, accountId: string) =>
      client.fetchList<ListData>(`auth/passkey/${appId}/account/${accountId}/passkeys`),

    read: (appId: string, accountId: string, credentialId: string) =>
      client.fetch<ReadData>(`auth/passkey/${appId}/account/${accountId}/passkeys/${credentialId}`),

    delete: (appId: string, accountId: string, credentialId: string) =>
      client.fetch<DeleteData>(`auth/passkey/${appId}/account/${accountId}/passkeys/${credentialId}/delete`, { method: 'DELETE' }),
  }
}
