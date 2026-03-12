import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateSmsBrandBody = operations['createSmsBrand']['requestBody']['content']['application/json']
type CreateSmsBrandData = NonNullable<
  operations['createSmsBrand']['responses']['201']['content']['application/json']['data']
>
type ReadSmsBrandData = NonNullable<
  operations['readSmsBrand']['responses']['200']['content']['application/json']['data']
>
type UpdateSmsBrandBody = operations['updateSmsBrand']['requestBody']['content']['application/json']
type UpdateSmsBrandData = NonNullable<
  operations['updateSmsBrand']['responses']['200']['content']['application/json']['data']
>
type DeleteSmsBrandData = NonNullable<
  operations['deleteSmsBrand']['responses']['200']['content']['application/json']['data']
>
type ListSmsBrandsBody = operations['listSmsBrands']['requestBody']['content']['application/json']
type ListSmsBrandsData = NonNullable<
  operations['listSmsBrands']['responses']['200']['content']['application/json']['data']
>[number]

export function createMessagingSMSBrands(client: ConjoinClient) {
  return {
    createSmsBrand: (data: CreateSmsBrandBody) =>
      client.fetch<CreateSmsBrandData>('messaging/sms/brands/new', { method: 'POST', body: data }),

    readSmsBrand: (brandId: string) =>
      client.fetch<ReadSmsBrandData>(`messaging/sms/brands/${brandId}`, { method: 'POST' }),

    updateSmsBrand: (brandId: string, data: UpdateSmsBrandBody) =>
      client.fetch<UpdateSmsBrandData>(`messaging/sms/brands/${brandId}`, { method: 'PATCH', body: data }),

    deleteSmsBrand: (brandId: string) =>
      client.fetch<DeleteSmsBrandData>(`messaging/sms/brands/${brandId}`, { method: 'DELETE' }),

    listSmsBrands: (data: ListSmsBrandsBody) =>
      client.fetchList<ListSmsBrandsData>('messaging/sms/brands', { method: 'POST', body: data }),
  }
}
