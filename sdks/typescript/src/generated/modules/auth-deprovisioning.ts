import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type DeprovisionAccountData = NonNullable<operations['deprovisionAccount']['responses']['200']['content']['application/json']['data']>

export function createAuthDeprovisionings(client: ConjoinClient) {
  return {
    deprovisionAccount: (appId: string, accountId: string) =>
      client.fetch<DeprovisionAccountData>(`auth/deprovisioning/${appId}/account/${accountId}/deprovision`, { method: 'POST' }),
  }
}
