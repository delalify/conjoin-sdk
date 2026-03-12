import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createCloudProject']['requestBody']['content']['application/json']
type CreateData = NonNullable<
  operations['createCloudProject']['responses']['201']['content']['application/json']['data']
>
type UpdateBody = operations['updateCloudProject']['requestBody']['content']['application/json']
type UpdateData = NonNullable<
  operations['updateCloudProject']['responses']['200']['content']['application/json']['data']
>
type ListData = NonNullable<
  operations['readCloudProjects']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['readCloudProjects']['parameters']['query']>
type ReadData = NonNullable<operations['readCloudProject']['responses']['200']['content']['application/json']['data']>

export function createCloudProjects(client: ConjoinClient) {
  return {
    create: (domainId: string, data: CreateBody) =>
      client.fetch<CreateData>(`cloud/project/${domainId}/new`, { method: 'POST', body: data }),

    update: (data: UpdateBody) =>
      client.fetch<UpdateData>('cloud/project/update-info', { method: 'PATCH', body: data }),

    list: (domainId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`cloud/project/many/${domainId}`, { query: query as Record<string, unknown> }),

    read: (projectId: string) => client.fetch<ReadData>(`cloud/project/public/single/${projectId}`),
  }
}
