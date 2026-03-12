import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateSmsCampaignBody = operations['createSmsCampaign']['requestBody']['content']['application/json']
type CreateSmsCampaignData = NonNullable<
  operations['createSmsCampaign']['responses']['201']['content']['application/json']['data']
>
type ReadSmsCampaignData = NonNullable<
  operations['readSmsCampaign']['responses']['200']['content']['application/json']['data']
>
type UpdateSmsCampaignBody = operations['updateSmsCampaign']['requestBody']['content']['application/json']
type UpdateSmsCampaignData = NonNullable<
  operations['updateSmsCampaign']['responses']['200']['content']['application/json']['data']
>
type DeleteSmsCampaignData = NonNullable<
  operations['deleteSmsCampaign']['responses']['200']['content']['application/json']['data']
>
type ListSmsCampaignsBody = operations['listSmsCampaigns']['requestBody']['content']['application/json']
type ListSmsCampaignsData = NonNullable<
  operations['listSmsCampaigns']['responses']['200']['content']['application/json']['data']
>[number]

export function createMessagingSMSCampaigns(client: ConjoinClient) {
  return {
    createSmsCampaign: (data: CreateSmsCampaignBody) =>
      client.fetch<CreateSmsCampaignData>('messaging/sms/campaigns/new', { method: 'POST', body: data }),

    readSmsCampaign: (campaignId: string) =>
      client.fetch<ReadSmsCampaignData>(`messaging/sms/campaigns/${campaignId}`, { method: 'POST' }),

    updateSmsCampaign: (campaignId: string, data: UpdateSmsCampaignBody) =>
      client.fetch<UpdateSmsCampaignData>(`messaging/sms/campaigns/${campaignId}`, { method: 'PATCH', body: data }),

    deleteSmsCampaign: (campaignId: string) =>
      client.fetch<DeleteSmsCampaignData>(`messaging/sms/campaigns/${campaignId}`, { method: 'DELETE' }),

    listSmsCampaigns: (data: ListSmsCampaignsBody) =>
      client.fetchList<ListSmsCampaignsData>('messaging/sms/campaigns', { method: 'POST', body: data }),
  }
}
