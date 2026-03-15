import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createMessagingProfile']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createMessagingProfile']['responses']['201']['content']['application/json']['data']>
type ActivateData = NonNullable<operations['activateMessagingProfile']['responses']['200']['content']['application/json']['data']>
type DeactivateData = NonNullable<operations['deactivateMessagingProfile']['responses']['200']['content']['application/json']['data']>
type CloseData = NonNullable<operations['closeMessagingProfile']['responses']['200']['content']['application/json']['data']>
type UpdateBody = operations['updateMessagingProfile']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateMessagingProfile']['responses']['200']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readMessagingProfile']['responses']['200']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deleteMessagingProfile']['responses']['200']['content']['application/json']['data']>
type UpdateEmailConfigBody = operations['updateMessagingProfileEmailConfig']['requestBody']['content']['application/json']
type UpdateEmailConfigData = NonNullable<operations['updateMessagingProfileEmailConfig']['responses']['200']['content']['application/json']['data']>
type UpdateMultisendConfigBody = operations['updateMessagingProfileMultisendConfig']['requestBody']['content']['application/json']
type UpdateMultisendConfigData = NonNullable<operations['updateMessagingProfileMultisendConfig']['responses']['200']['content']['application/json']['data']>
type UpdateVerificationsConfigBody = operations['updateMessagingProfileVerificationsConfig']['requestBody']['content']['application/json']
type UpdateVerificationsConfigData = NonNullable<operations['updateMessagingProfileVerificationsConfig']['responses']['200']['content']['application/json']['data']>
type ListBody = operations['listMessagingProfiles']['requestBody']['content']['application/json']
type ListData = NonNullable<operations['listMessagingProfiles']['responses']['200']['content']['application/json']['data']>[number]

export function createMessagingProfiles(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('messaging/profiles/new', { method: 'POST', body: data }),

    activate: (profileId: string) =>
      client.fetch<ActivateData>(`messaging/profiles/${profileId}/enable`, { method: 'PATCH' }),

    deactivate: (profileId: string) =>
      client.fetch<DeactivateData>(`messaging/profiles/${profileId}/disable`, { method: 'PATCH' }),

    close: (profileId: string) =>
      client.fetch<CloseData>(`messaging/profiles/${profileId}/close`, { method: 'PATCH' }),

    update: (profileId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`messaging/profiles/${profileId}`, { method: 'PATCH', body: data }),

    read: (profileId: string) =>
      client.fetch<ReadData>(`messaging/profiles/${profileId}`),

    delete: (profileId: string) =>
      client.fetch<DeleteData>(`messaging/profiles/${profileId}`, { method: 'DELETE' }),

    updateEmailConfig: (profileId: string, data: UpdateEmailConfigBody) =>
      client.fetch<UpdateEmailConfigData>(`messaging/profiles/${profileId}/emails-config`, { method: 'PATCH', body: data }),

    updateMultisendConfig: (profileId: string, data: UpdateMultisendConfigBody) =>
      client.fetch<UpdateMultisendConfigData>(`messaging/profiles/${profileId}/multisend-config`, { method: 'PATCH', body: data }),

    updateVerificationsConfig: (profileId: string, data: UpdateVerificationsConfigBody) =>
      client.fetch<UpdateVerificationsConfigData>(`messaging/profiles/${profileId}/verifications-config`, { method: 'PATCH', body: data }),

    list: (data: ListBody) =>
      client.fetchList<ListData>('messaging/profiles', { method: 'POST', body: data }),
  }
}
