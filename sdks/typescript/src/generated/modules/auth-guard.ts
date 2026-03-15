import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ReadEventsData = NonNullable<
  operations['readGuardEvents']['responses']['200']['content']['application/json']['data']
>[number]
type ReadEventsQuery = NonNullable<operations['readGuardEvents']['parameters']['query']>
type UpdateSettingsBody = operations['updateGuardSettings']['requestBody']['content']['application/json']
type UpdateSettingsData = NonNullable<
  operations['updateGuardSettings']['responses']['200']['content']['application/json']['data']
>
type AddTrustedIpBody = operations['addGuardTrustedIp']['requestBody']['content']['application/json']
type AddTrustedIpData = NonNullable<
  operations['addGuardTrustedIp']['responses']['200']['content']['application/json']['data']
>
type RemoveTrustedIpBody = operations['removeGuardTrustedIp']['requestBody']['content']['application/json']
type RemoveTrustedIpData = NonNullable<
  operations['removeGuardTrustedIp']['responses']['200']['content']['application/json']['data']
>
type ListAnonymousIpsData = NonNullable<
  operations['listGuardAnonymousIps']['responses']['200']['content']['application/json']['data']
>
type AddAnonymousIpsBody = operations['addGuardAnonymousIps']['requestBody']['content']['application/json']
type AddAnonymousIpsData = NonNullable<
  operations['addGuardAnonymousIps']['responses']['200']['content']['application/json']['data']
>
type RemoveAnonymousIpsBody = operations['removeGuardAnonymousIps']['requestBody']['content']['application/json']
type RemoveAnonymousIpsData = NonNullable<
  operations['removeGuardAnonymousIps']['responses']['200']['content']['application/json']['data']
>

export function createAuthGuards(client: ConjoinClient) {
  return {
    readEvents: (appId: string, query?: ReadEventsQuery) =>
      client.fetchList<ReadEventsData>(`auth/guard/${appId}/guard/events`, { query: query as Record<string, unknown> }),

    updateSettings: (appId: string, data: UpdateSettingsBody) =>
      client.fetch<UpdateSettingsData>(`auth/guard/${appId}/guard/settings`, { method: 'PATCH', body: data }),

    addTrustedIp: (appId: string, data: AddTrustedIpBody) =>
      client.fetch<AddTrustedIpData>(`auth/guard/${appId}/guard/trusted-ips`, { method: 'POST', body: data }),

    removeTrustedIp: (appId: string, data: RemoveTrustedIpBody) =>
      client.fetch<RemoveTrustedIpData>(`auth/guard/${appId}/guard/trusted-ips/remove`, { method: 'POST', body: data }),

    listAnonymousIps: (appId: string) => client.fetch<ListAnonymousIpsData>(`auth/guard/${appId}/guard/anonymous-ips`),

    addAnonymousIps: (appId: string, data: AddAnonymousIpsBody) =>
      client.fetch<AddAnonymousIpsData>(`auth/guard/${appId}/guard/anonymous-ips`, { method: 'POST', body: data }),

    removeAnonymousIps: (appId: string, data: RemoveAnonymousIpsBody) =>
      client.fetch<RemoveAnonymousIpsData>(`auth/guard/${appId}/guard/anonymous-ips/remove`, {
        method: 'POST',
        body: data,
      }),
  }
}
