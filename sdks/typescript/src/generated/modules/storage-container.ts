import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createStorageContainer']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createStorageContainer']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<operations['listStorageContainers']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listStorageContainers']['parameters']['query']>
type ReadData = NonNullable<operations['readStorageContainer']['responses']['200']['content']['application/json']['data']>
type ArchiveData = NonNullable<operations['archiveStorageContainer']['responses']['200']['content']['application/json']['data']>
type RestoreData = NonNullable<operations['restoreStorageContainer']['responses']['200']['content']['application/json']['data']>
type UpdateLifecyclePolicyBody = operations['updateStorageContainerLifecyclePolicy']['requestBody']['content']['application/json']
type UpdateLifecyclePolicyData = NonNullable<operations['updateStorageContainerLifecyclePolicy']['responses']['200']['content']['application/json']['data']>
type UpdateSettingsBody = operations['updateStorageContainerSettings']['requestBody']['content']['application/json']
type UpdateSettingsData = NonNullable<operations['updateStorageContainerSettings']['responses']['200']['content']['application/json']['data']>
type RequestDeletionBody = operations['requestStorageContainerDeletion']['requestBody']['content']['application/json']
type RequestDeletionData = NonNullable<operations['requestStorageContainerDeletion']['responses']['200']['content']['application/json']['data']>
type CancelDeletionData = NonNullable<operations['cancelStorageContainerDeletion']['responses']['200']['content']['application/json']['data']>
type ChangeClassBody = operations['changeStorageContainerClass']['requestBody']['content']['application/json']
type ChangeClassData = NonNullable<operations['changeStorageContainerClass']['responses']['200']['content']['application/json']['data']>
type UpdateTransitionPolicyBody = operations['updateStorageContainerTransitionPolicy']['requestBody']['content']['application/json']
type UpdateTransitionPolicyData = NonNullable<operations['updateStorageContainerTransitionPolicy']['responses']['200']['content']['application/json']['data']>

export function createStorageContainers(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('storage/storage-container/new', { method: 'POST', body: data }),

    list: (query?: ListQuery) =>
      client.fetchList<ListData>('storage/storage-container/list', { query: query as Record<string, unknown> }),

    read: (containerNameOrId: string) =>
      client.fetch<ReadData>(`storage/storage-container/details/${containerNameOrId}`),

    archive: (containerNameOrId: string) =>
      client.fetch<ArchiveData>(`storage/storage-container/archive/${containerNameOrId}`, { method: 'PATCH' }),

    restore: (containerNameOrId: string) =>
      client.fetch<RestoreData>(`storage/storage-container/restore/${containerNameOrId}`, { method: 'PATCH' }),

    updateLifecyclePolicy: (containerNameOrId: string, data: UpdateLifecyclePolicyBody) =>
      client.fetch<UpdateLifecyclePolicyData>(`storage/storage-container/lifecycle-policy/${containerNameOrId}`, { method: 'PATCH', body: data }),

    updateSettings: (containerNameOrId: string, data: UpdateSettingsBody) =>
      client.fetch<UpdateSettingsData>(`storage/storage-container/settings/${containerNameOrId}`, { method: 'PATCH', body: data }),

    requestDeletion: (containerNameOrId: string, data: RequestDeletionBody) =>
      client.fetch<RequestDeletionData>(`storage/storage-container/${containerNameOrId}`, { method: 'DELETE', body: data }),

    cancelDeletion: (containerNameOrId: string) =>
      client.fetch<CancelDeletionData>(`storage/storage-container/cancel-deletion/${containerNameOrId}`, { method: 'PATCH' }),

    changeClass: (containerNameOrId: string, data: ChangeClassBody) =>
      client.fetch<ChangeClassData>(`storage/storage-container/storage-class/${containerNameOrId}`, { method: 'PATCH', body: data }),

    updateTransitionPolicy: (containerNameOrId: string, data: UpdateTransitionPolicyBody) =>
      client.fetch<UpdateTransitionPolicyData>(`storage/storage-container/transition-policy/${containerNameOrId}`, { method: 'PATCH', body: data }),
  }
}
