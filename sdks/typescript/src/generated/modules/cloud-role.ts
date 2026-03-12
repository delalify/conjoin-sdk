import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createCloudRole']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createCloudRole']['responses']['201']['content']['application/json']['data']>
type ReadData = NonNullable<
  operations['readCloudRoles']['responses']['200']['content']['application/json']['data']
>[number]
type UpdateBody = operations['updateCloudRole']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateCloudRole']['responses']['200']['content']['application/json']['data']>

export function createCloudRoles(client: ConjoinClient) {
  return {
    create: (data: CreateBody) => client.fetch<CreateData>('cloud/custom-role/new', { method: 'POST', body: data }),

    read: () => client.fetchList<ReadData>('cloud/custom-role/many'),

    update: (roleId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`cloud/custom-role/update/${roleId}`, { method: 'PUT', body: data }),
  }
}
