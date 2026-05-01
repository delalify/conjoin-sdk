import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createCloudOrganization']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createCloudOrganization']['responses']['201']['content']['application/json']['data']>
type UpdateBody = operations['updateCloudOrganization']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateCloudOrganization']['responses']['200']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readCloudOrganizations']['responses']['200']['content']['application/json']['data']>[number]
type ReadQuery = NonNullable<operations['readCloudOrganizations']['parameters']['query']>

export function createCloudOrganizations(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('cloud/organizationnew', { method: 'POST', body: data }),

    update: (domainIdOrCustomId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`cloud/organizationupdate-info/${domainIdOrCustomId}`, { method: 'PATCH', body: data }),

    read: (query?: ReadQuery) =>
      client.fetchList<ReadData>('cloud/organization', { query: query as Record<string, unknown> }),
  }
}
