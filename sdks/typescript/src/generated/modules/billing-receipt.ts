import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<operations['listReceipts']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listReceipts']['parameters']['query']>
type ReadByChargeIdData = NonNullable<operations['readReceiptByChargeId']['responses']['200']['content']['application/json']['data']>
type ReadByReceiptIdData = NonNullable<operations['readReceiptByReceiptId']['responses']['200']['content']['application/json']['data']>

export function createBillingReceipts(client: ConjoinClient) {
  return {
    list: (entityId: string, query?: ListQuery) =>
      client.fetchList<ListData>(`billing/receipt/${entityId}/receipts`, { query: query as Record<string, unknown> }),

    readByChargeId: (entityId: string, chargeId: string) =>
      client.fetch<ReadByChargeIdData>(`billing/receipt/${entityId}/receipt/${chargeId}`),

    readByReceiptId: (entityId: string, receiptId: string) =>
      client.fetch<ReadByReceiptIdData>(`billing/receipt/${entityId}/receipts/${receiptId}`),
  }
}
