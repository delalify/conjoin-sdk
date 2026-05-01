import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ReadData = NonNullable<operations['readBillingSettings']['responses']['200']['content']['application/json']['data']>
type UpdateBody = operations['updateBillingSettings']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateBillingSettings']['responses']['200']['content']['application/json']['data']>

export function createBillingSettings(client: ConjoinClient) {
  return {
    read: () =>
      client.fetch<ReadData>('billing/settings/'),

    update: (data: UpdateBody) =>
      client.fetch<UpdateData>('billing/settings/', { method: 'PUT', body: data }),
  }
}
