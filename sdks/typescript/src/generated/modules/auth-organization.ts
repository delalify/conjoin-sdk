import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createAuthOrganization']['requestBody']['content']['application/json']
type CreateData = NonNullable<
  operations['createAuthOrganization']['responses']['201']['content']['application/json']['data']
>
type ReadData = NonNullable<
  operations['readAuthOrganization']['responses']['200']['content']['application/json']['data']
>
type ListData = NonNullable<
  operations['listAuthOrganizations']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listAuthOrganizations']['parameters']['query']>
type UpdateBody = operations['updateAuthOrganization']['requestBody']['content']['application/json']
type UpdateData = NonNullable<
  operations['updateAuthOrganization']['responses']['200']['content']['application/json']['data']
>
type UpdateSettingsBody = operations['updateAuthOrganizationSettings']['requestBody']['content']['application/json']
type UpdateSettingsData = NonNullable<
  operations['updateAuthOrganizationSettings']['responses']['200']['content']['application/json']['data']
>
type DeleteBody = operations['deleteAuthOrganization']['requestBody']['content']['application/json']
type DeleteData = NonNullable<
  operations['deleteAuthOrganization']['responses']['200']['content']['application/json']['data']
>

export function createAuthOrganizations(client: ConjoinClient) {
  return {
    create: (data: CreateBody) => client.fetch<CreateData>('auth/organization/create', { method: 'POST', body: data }),

    read: (organizationId: string) => client.fetch<ReadData>(`auth/organization/${organizationId}`),

    list: (query?: ListQuery) =>
      client.fetchList<ListData>('auth/organization/', { query: query as Record<string, unknown> }),

    update: (organizationId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`auth/organization/${organizationId}/update`, { method: 'PATCH', body: data }),

    updateSettings: (organizationId: string, data: UpdateSettingsBody) =>
      client.fetch<UpdateSettingsData>(`auth/organization/${organizationId}/settings/update`, {
        method: 'PATCH',
        body: data,
      }),

    delete: (organizationId: string, data: DeleteBody) =>
      client.fetch<DeleteData>(`auth/organization/${organizationId}/delete`, { method: 'DELETE', body: data }),
  }
}
