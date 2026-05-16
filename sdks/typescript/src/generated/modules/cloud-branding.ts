import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type GetProjectData = NonNullable<operations['getProjectBranding']['responses']['200']['content']['application/json']['data']>
type UpdateProjectBody = operations['updateProjectBranding']['requestBody']['content']['application/json']
type UpdateProjectData = NonNullable<operations['updateProjectBranding']['responses']['200']['content']['application/json']['data']>
type PatchProjectBody = operations['patchProjectBranding']['requestBody']['content']['application/json']
type PatchProjectData = NonNullable<operations['patchProjectBranding']['responses']['200']['content']['application/json']['data']>
type GetOrgOverrideData = NonNullable<operations['getOrgBrandingOverride']['responses']['200']['content']['application/json']['data']>
type UpdateOrgOverrideBody = operations['updateOrgBrandingOverride']['requestBody']['content']['application/json']
type UpdateOrgOverrideData = NonNullable<operations['updateOrgBrandingOverride']['responses']['200']['content']['application/json']['data']>
type PatchOrgOverrideBody = operations['patchOrgBrandingOverride']['requestBody']['content']['application/json']
type PatchOrgOverrideData = NonNullable<operations['patchOrgBrandingOverride']['responses']['200']['content']['application/json']['data']>

export function createCloudBrandings(client: ConjoinClient) {
  return {
    getProject: () =>
      client.fetch<GetProjectData>('cloud/branding/'),

    updateProject: (data: UpdateProjectBody) =>
      client.fetch<UpdateProjectData>('cloud/branding/update', { method: 'PUT', body: data }),

    patchProject: (data: PatchProjectBody) =>
      client.fetch<PatchProjectData>('cloud/branding/update', { method: 'PATCH', body: data }),

    getOrgOverride: (orgId: string) =>
      client.fetch<GetOrgOverrideData>(`cloud/branding/organizations/${orgId}`),

    updateOrgOverride: (orgId: string, data: UpdateOrgOverrideBody) =>
      client.fetch<UpdateOrgOverrideData>(`cloud/branding/organizations/${orgId}/update`, { method: 'PUT', body: data }),

    patchOrgOverride: (orgId: string, data: PatchOrgOverrideBody) =>
      client.fetch<PatchOrgOverrideData>(`cloud/branding/organizations/${orgId}/update`, { method: 'PATCH', body: data }),
  }
}
