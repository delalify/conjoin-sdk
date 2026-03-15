import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<operations['listCertificates']['responses']['200']['content']['application/json']['data']>[number]
type ReadActiveData = NonNullable<operations['readActiveCertificate']['responses']['200']['content']['application/json']['data']>
type RotateData = NonNullable<operations['rotateCertificate']['responses']['200']['content']['application/json']['data']>
type SyncMetadataData = NonNullable<operations['syncCertificateMetadata']['responses']['200']['content']['application/json']['data']>

export function createAuthCertificates(client: ConjoinClient) {
  return {
    list: (appId: string) =>
      client.fetchList<ListData>(`auth/certificate/${appId}/certificate/list`),

    readActive: (appId: string) =>
      client.fetch<ReadActiveData>(`auth/certificate/${appId}/certificate/active`),

    rotate: (appId: string) =>
      client.fetch<RotateData>(`auth/certificate/${appId}/certificate/rotate`, { method: 'POST' }),

    syncMetadata: (appId: string) =>
      client.fetch<SyncMetadataData>(`auth/certificate/${appId}/certificate/metadata/sync`, { method: 'POST' }),
  }
}
