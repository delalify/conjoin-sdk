import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ReadData = NonNullable<operations['readCloudSpendControl']['responses']['200']['content']['application/json']['data']>
type UpdateBody = operations['updateCloudSpendControl']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateCloudSpendControl']['responses']['200']['content']['application/json']['data']>
type ReadUsageData = NonNullable<operations['readCloudSpendControlUsage']['responses']['200']['content']['application/json']['data']>

export function createCloudSpendControls(client: ConjoinClient) {
  return {
    read: () =>
      client.fetch<ReadData>('cloud/spend-control/single'),

    update: (data: UpdateBody) =>
      client.fetch<UpdateData>('cloud/spend-control/update', { method: 'PUT', body: data }),

    readUsage: () =>
      client.fetch<ReadUsageData>('cloud/spend-control/usage'),
  }
}
