import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createCreditWallet']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createCreditWallet']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<operations['listCreditWallets']['responses']['200']['content']['application/json']['data']>[number]
type ListQuery = NonNullable<operations['listCreditWallets']['parameters']['query']>
type UpdateBody = operations['updateCreditWallet']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateCreditWallet']['responses']['200']['content']['application/json']['data']>
type GrantCreditsBody = operations['grantCredits']['requestBody']['content']['application/json']
type GrantCreditsData = NonNullable<operations['grantCredits']['responses']['201']['content']['application/json']['data']>

export function createBillingCreditWallets(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('billing/credit-wallet/create', { method: 'POST', body: data }),

    list: (query?: ListQuery) =>
      client.fetchList<ListData>('billing/credit-wallet/', { query: query as Record<string, unknown> }),

    update: (walletId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`billing/credit-wallet/${walletId}`, { method: 'PATCH', body: data }),

    grantCredits: (data: GrantCreditsBody) =>
      client.fetch<GrantCreditsData>('billing/credit-wallet/grant', { method: 'POST', body: data }),
  }
}
