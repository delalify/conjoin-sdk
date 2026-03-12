import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<
  operations['listTrustedDevices']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listTrustedDevices']['parameters']['query']>
type RevokeData = NonNullable<
  operations['revokeTrustedDevice']['responses']['200']['content']['application/json']['data']
>
type RevokeAllData = NonNullable<
  operations['revokeAllTrustedDevices']['responses']['200']['content']['application/json']['data']
>

export function createAuthTrustedDevices(client: ConjoinClient) {
  return {
    list: (appId: string, accountId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`auth/trusted-device/${appId}/account/${accountId}/trusted-devices`, {
        query: query as Record<string, unknown>,
      }),

    revoke: (appId: string, accountId: string, trustedDeviceId: string) =>
      client.fetch<RevokeData>(
        `auth/trusted-device/${appId}/account/${accountId}/trusted-devices/${trustedDeviceId}/revoke`,
        { method: 'POST' },
      ),

    revokeAll: (appId: string, accountId: string) =>
      client.fetch<RevokeAllData>(`auth/trusted-device/${appId}/account/${accountId}/trusted-devices/revoke-all`, {
        method: 'POST',
      }),
  }
}
