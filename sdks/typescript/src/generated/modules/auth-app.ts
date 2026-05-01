import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createAuthApp']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createAuthApp']['responses']['201']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readAuthApp']['responses']['200']['content']['application/json']['data']>
type ListData = NonNullable<operations['listAuthApps']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listAuthApps']['parameters']['query']>
type UpdateBody = operations['updateAuthApp']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateAuthApp']['responses']['200']['content']['application/json']['data']>
type UpdateSettingsBody = operations['updateAuthAppSettings']['requestBody']['content']['application/json']
type UpdateSettingsData = NonNullable<operations['updateAuthAppSettings']['responses']['200']['content']['application/json']['data']>
type UpdateBrandingBody = operations['updateAuthAppBranding']['requestBody']['content']['application/json']
type UpdateBrandingData = NonNullable<operations['updateAuthAppBranding']['responses']['200']['content']['application/json']['data']>
type UpdateCustomAttributesBody = operations['updateAuthAppCustomAttributes']['requestBody']['content']['application/json']
type UpdateCustomAttributesData = NonNullable<operations['updateAuthAppCustomAttributes']['responses']['200']['content']['application/json']['data']>

export function createAuthApps(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('auth/app/create', { method: 'POST', body: data }),

    read: (appId: string) =>
      client.fetch<ReadData>(`auth/app/${appId}`),

    list: (query?: ListQuery) =>
      client.fetchList<ListData>('auth/app/', { query: query as Record<string, unknown> }),

    update: (appId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`auth/app/${appId}/update`, { method: 'PATCH', body: data }),

    updateSettings: (appId: string, data: UpdateSettingsBody) =>
      client.fetch<UpdateSettingsData>(`auth/app/${appId}/settings/update`, { method: 'PATCH', body: data }),

    updateBranding: (appId: string, data: UpdateBrandingBody) =>
      client.fetch<UpdateBrandingData>(`auth/app/${appId}/branding/update`, { method: 'PATCH', body: data }),

    updateCustomAttributes: (appId: string, data: UpdateCustomAttributesBody) =>
      client.fetch<UpdateCustomAttributesData>(`auth/app/${appId}/settings/custom-attributes-schema`, { method: 'PUT', body: data }),
  }
}
