import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type RegisterBody = operations['registerCloudWebhook']['requestBody']['content']['application/json']
type RegisterData = NonNullable<operations['registerCloudWebhook']['responses']['201']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readCloudWebhooks']['responses']['200']['content']['application/json']['data']>[number]
type ReadQuery = NonNullable<operations['readCloudWebhooks']['parameters']['query']>
type UpdateBody = operations['updateCloudWebhook']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateCloudWebhook']['responses']['200']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deleteCloudWebhook']['responses']['200']['content']['application/json']['data']>
type ReadEventsData = NonNullable<operations['readCloudWebhookEvents']['responses']['200']['content']['application/json']['data']>[number]

export function createCloudWebhooks(client: ConjoinClient) {
  return {
    register: (data: RegisterBody) =>
      client.fetch<RegisterData>('cloud/cloud-webhook/register', { method: 'POST', body: data }),

    read: (query?: ReadQuery) =>
      client.fetchList<ReadData>('cloud/cloud-webhook/', { query: query as Record<string, unknown> }),

    update: (webhookId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`cloud/cloud-webhook/${webhookId}`, { method: 'PATCH', body: data }),

    delete: (webhookId: string) =>
      client.fetch<DeleteData>(`cloud/cloud-webhook/${webhookId}`, { method: 'DELETE' }),

    readEvents: () =>
      client.fetchList<ReadEventsData>('cloud/cloud-webhook/events'),
  }
}
