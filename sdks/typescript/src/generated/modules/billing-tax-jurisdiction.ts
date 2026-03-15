import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type ListData = NonNullable<operations['listTaxJurisdictions']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listTaxJurisdictions']['parameters']['query']>
type QueryTaxRateData = NonNullable<operations['queryTaxRate']['responses']['200']['content']['application/json']['data']>
type QueryTaxRateQuery = NonNullable<operations['queryTaxRate']['parameters']['query']>

export function createBillingTaxJurisdictions(client: ConjoinClient) {
  return {
    list: (query?: ListQuery) =>
      client.fetchList<ListData>('billing/tax-jurisdiction/', { query: query as Record<string, unknown> }),

    queryTaxRate: (query?: QueryTaxRateQuery) =>
      client.fetch<QueryTaxRateData>('billing/tax-jurisdiction/query', { query: query as Record<string, unknown> }),
  }
}
