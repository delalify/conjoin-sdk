import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ReadResponse = operations['readReceipt']['responses']['200']['content']['application/json']

export function createBillingReceipts(client: ConjoinClient) {
  return {
    read: (entityId: string, chargeId: string) =>
      client.fetch<ReadResponse>(`billing/receipt/${entityId}/receipt/${chargeId}`),
  }
}
