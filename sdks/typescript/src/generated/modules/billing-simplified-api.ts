import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type SimplifiedCheckoutBody = operations['simplifiedCheckout']['requestBody']['content']['application/json']
type SimplifiedCheckoutData = NonNullable<operations['simplifiedCheckout']['responses']['201']['content']['application/json']['data']>
type SimplifiedCheckBody = operations['simplifiedCheck']['requestBody']['content']['application/json']
type SimplifiedCheckData = NonNullable<operations['simplifiedCheck']['responses']['200']['content']['application/json']['data']>
type SimplifiedTrackBody = operations['simplifiedTrack']['requestBody']['content']['application/json']
type SimplifiedTrackData = NonNullable<operations['simplifiedTrack']['responses']['200']['content']['application/json']['data']>

export function createBillingSimplifiedAPIs(client: ConjoinClient) {
  return {
    simplifiedCheckout: (entityId: string, data: SimplifiedCheckoutBody) =>
      client.fetch<SimplifiedCheckoutData>(`billing/bundle/checkout/${entityId}`, { method: 'POST', body: data }),

    simplifiedCheck: (entityId: string, data: SimplifiedCheckBody) =>
      client.fetch<SimplifiedCheckData>(`billing/bundle/check/${entityId}`, { method: 'POST', body: data }),

    simplifiedTrack: (entityId: string, data: SimplifiedTrackBody) =>
      client.fetch<SimplifiedTrackData>(`billing/bundle/track/${entityId}`, { method: 'POST', body: data }),
  }
}
