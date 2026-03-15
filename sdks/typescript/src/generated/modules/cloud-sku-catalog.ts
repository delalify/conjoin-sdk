import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ReadSkuCatalogData = NonNullable<operations['readSkuCatalog']['responses']['200']['content']['application/json']['data']>[number]
type ReadSingleSkuCatalogData = NonNullable<operations['readSingleSkuCatalog']['responses']['200']['content']['application/json']['data']>

export function createCloudSKUCatalogs(client: ConjoinClient) {
  return {
    readSkuCatalog: () =>
      client.fetchList<ReadSkuCatalogData>('cloud/sku-catalog/many'),

    readSingleSkuCatalog: (slug: string) =>
      client.fetch<ReadSingleSkuCatalogData>(`cloud/sku-catalog/single/${slug}`),
  }
}
