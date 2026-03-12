import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createCoupon']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createCoupon']['responses']['201']['content']['application/json']['data']>
type ListData = NonNullable<
  operations['listCoupons']['responses']['200']['content']['application/json']['data']
>[number]
type ListQuery = NonNullable<operations['listCoupons']['parameters']['query']>
type UpdateBody = operations['updateCoupon']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateCoupon']['responses']['200']['content']['application/json']['data']>
type DeleteData = NonNullable<operations['deleteCoupon']['responses']['200']['content']['application/json']['data']>

export function createBillingCoupons(client: ConjoinClient) {
  return {
    create: (data: CreateBody) => client.fetch<CreateData>('billing/coupon/create', { method: 'POST', body: data }),

    list: (query?: ListQuery) =>
      client.fetchList<ListData>('billing/coupon/', { query: query as Record<string, unknown> }),

    update: (couponId: string, data: UpdateBody) =>
      client.fetch<UpdateData>(`billing/coupon/${couponId}`, { method: 'PATCH', body: data }),

    delete: (couponId: string) => client.fetch<DeleteData>(`billing/coupon/${couponId}`, { method: 'DELETE' }),
  }
}
