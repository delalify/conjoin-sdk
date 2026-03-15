import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type PurchaseBody = operations['purchasePhoneNumber']['requestBody']['content']['application/json']
type PurchaseData = NonNullable<
  operations['purchasePhoneNumber']['responses']['201']['content']['application/json']['data']
>
type UpdateData = NonNullable<
  operations['updatePhoneNumber']['responses']['200']['content']['application/json']['data']
>
type ListAvailableData = NonNullable<
  operations['listAvailablePhoneNumbers']['responses']['200']['content']['application/json']['data']
>[number]
type ListAvailableQuery = NonNullable<operations['listAvailablePhoneNumbers']['parameters']['query']>
type ListData = NonNullable<
  operations['listPhoneNumbers']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listPhoneNumbers']['parameters']['query']>
type ReleaseData = NonNullable<
  operations['releasePhoneNumber']['responses']['200']['content']['application/json']['data']
>

export function createMessagingPhoneNumbers(client: ConjoinClient) {
  return {
    purchase: (phoneNumber: string, data: PurchaseBody) =>
      client.fetch<PurchaseData>(`messaging/phone-numbers/provision/${phoneNumber}`, { method: 'POST', body: data }),

    update: (phoneNumber: string, projectId: string) =>
      client.fetch<UpdateData>(`messaging/phone-numbers/transfer/${phoneNumber}/project/${projectId}`, {
        method: 'PATCH',
      }),

    listAvailable: (query?: ListAvailableQuery) =>
      client.fetchList<ListAvailableData>('messaging/phone-numbers/available', {
        query: query as Record<string, unknown>,
      }),

    list: (query?: ListQuery) =>
      client.fetchList<ListData>('messaging/phone-numbers', { query: query as Record<string, unknown> }),

    release: (phoneNumber: string) =>
      client.fetch<ReleaseData>(`messaging/phone-numbers/release/${phoneNumber}`, { method: 'POST' }),
  }
}
