import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ReadData = NonNullable<operations['readCloudAccount']['responses']['200']['content']['application/json']['data']>
type ReadByProjectData = NonNullable<
  operations['readCloudAccountByProject']['responses']['200']['content']['application/json']['data']
>
type UpdateBody = operations['updateCloudAccount']['requestBody']['content']['application/json']
type UpdateData = NonNullable<
  operations['updateCloudAccount']['responses']['200']['content']['application/json']['data']
>
type InitialiseBody = operations['initialiseCloudAccount']['requestBody']['content']['application/json']
type InitialiseData = NonNullable<
  operations['initialiseCloudAccount']['responses']['200']['content']['application/json']['data']
>
type RefreshData = NonNullable<
  operations['refreshCloudAccount']['responses']['200']['content']['application/json']['data']
>

export function createCloudAccounts(client: ConjoinClient) {
  return {
    read: () => client.fetch<ReadData>('cloud/cloud-account/single'),

    readByProject: (projectId: string) => client.fetch<ReadByProjectData>(`cloud/cloud-account/single/${projectId}`),

    update: (cloudAccountId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`cloud/cloud-account/update/${cloudAccountId}`, { method: 'PUT', body: data }),

    initialise: (data: InitialiseBody) =>
      client.fetch<InitialiseData>('cloud/cloud-account/initialise', { method: 'POST', body: data }),

    refresh: () => client.fetch<RefreshData>('cloud/cloud-account/refresh', { method: 'POST' }),
  }
}
