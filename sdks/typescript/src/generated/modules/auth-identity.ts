import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type LinkBody = operations['linkIdentity']['requestBody']['content']['application/json']
type LinkData = NonNullable<operations['linkIdentity']['responses']['200']['content']['application/json']['data']>
type UnlinkBody = operations['unlinkIdentity']['requestBody']['content']['application/json']
type UnlinkData = NonNullable<operations['unlinkIdentity']['responses']['200']['content']['application/json']['data']>
type DiscoverAccountBody = operations['discoverAccount']['requestBody']['content']['application/json']
type DiscoverAccountData = NonNullable<operations['discoverAccount']['responses']['200']['content']['application/json']['data']>

export function createAuthIdentities(client: ConjoinClient) {
  return {
    link: (appId: string, accountId: string, data: LinkBody) =>
      client.fetch<LinkData>(`auth/identity/${appId}/account/${accountId}/identity/link`, { method: 'POST', body: data }),

    unlink: (appId: string, accountId: string, data: UnlinkBody) =>
      client.fetch<UnlinkData>(`auth/identity/${appId}/account/${accountId}/identity/unlink`, { method: 'POST', body: data }),

    discoverAccount: (appId: string, data: DiscoverAccountBody) =>
      client.fetch<DiscoverAccountData>(`auth/identity/${appId}/identity/discover`, { method: 'POST', body: data }),
  }
}
