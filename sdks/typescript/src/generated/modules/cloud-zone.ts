import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createCloudZone']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createCloudZone']['responses']['201']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readCloudZone']['responses']['200']['content']['application/json']['data']>
type VerifyDnsData = NonNullable<operations['verifyCloudZoneDns']['responses']['200']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deleteCloudZone']['responses']['200']['content']['application/json']['data']>

export function createCloudZones(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('cloud/cloud-zones/new', { method: 'POST', body: data }),

    read: (zoneId: string) =>
      client.fetch<ReadData>(`cloud/cloud-zones/${zoneId}`),

    verifyDns: (zoneId: string) =>
      client.fetch<VerifyDnsData>(`cloud/cloud-zones/verify-dns/${zoneId}`, { method: 'PATCH' }),

    delete: (zoneId: string) =>
      client.fetch<DeleteData>(`cloud/cloud-zones/${zoneId}`, { method: 'DELETE' }),
  }
}
