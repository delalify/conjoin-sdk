import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateClusterBody = operations['createMemorystoreCluster']['requestBody']['content']['application/json']
type CreateClusterData = NonNullable<operations['createMemorystoreCluster']['responses']['201']['content']['application/json']['data']>
type ReadClustersData = NonNullable<operations['readMemorystoreClusters']['responses']['200']['content']['application/json']['data']>[number]
type ReadClustersQuery = NonNullable<operations['readMemorystoreClusters']['parameters']['query']>
type ReadClusterData = NonNullable<operations['readMemorystoreCluster']['responses']['200']['content']['application/json']['data']>
type UpdateClusterBody = operations['updateMemorystoreCluster']['requestBody']['content']['application/json']
type UpdateClusterData = NonNullable<operations['updateMemorystoreCluster']['responses']['200']['content']['application/json']['data']>
type SuspendClusterData = NonNullable<operations['suspendMemorystoreCluster']['responses']['200']['content']['application/json']['data']>
type DeleteClusterData = NonNullable<operations['deleteMemorystoreCluster']['responses']['200']['content']['application/json']['data']>
type ExecuteCommandBody = operations['executeMemorystoreCommand']['requestBody']['content']['application/json']
type ExecuteCommandData = NonNullable<operations['executeMemorystoreCommand']['responses']['200']['content']['application/json']['data']>

export function createRelayMemorystores(client: ConjoinClient) {
  return {
    createCluster: (data: CreateClusterBody) =>
      client.fetch<CreateClusterData>('relay/memorystore/clusters/create', { method: 'POST', body: data }),

    readClusters: (query?: ReadClustersQuery) =>
      client.fetchList<ReadClustersData>('relay/memorystore/clusters', { query: query as Record<string, unknown> }),

    readCluster: (clusterId: string) =>
      client.fetch<ReadClusterData>(`relay/memorystore/clusters/${clusterId}`),

    updateCluster: (clusterId: string, data: UpdateClusterBody) =>
      client.fetch<UpdateClusterData>(`relay/memorystore/clusters/${clusterId}/update`, { method: 'PATCH', body: data }),

    suspendCluster: (clusterId: string) =>
      client.fetch<SuspendClusterData>(`relay/memorystore/clusters/${clusterId}/suspend`, { method: 'POST' }),

    deleteCluster: (clusterId: string) =>
      client.fetch<DeleteClusterData>(`relay/memorystore/clusters/${clusterId}/delete`, { method: 'DELETE' }),

    executeCommand: (clusterId: string, data: ExecuteCommandBody) =>
      client.fetch<ExecuteCommandData>(`relay/memorystore/clusters/${clusterId}/command`, { method: 'POST', body: data }),
  }
}
