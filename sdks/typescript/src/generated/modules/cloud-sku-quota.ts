import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ReadAccountSkuQuotasData = NonNullable<
  operations['readAccountSkuQuotas']['responses']['200']['content']['application/json']['data']
>[number]

export function createCloudSKUQuotas(client: ConjoinClient) {
  return {
    readAccountSkuQuotas: () => client.fetchList<ReadAccountSkuQuotasData>('cloud/sku-quota/account'),
  }
}
