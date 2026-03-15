import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type RequestBody = operations['requestStepUp']['requestBody']['content']['application/json']
type RequestData = NonNullable<operations['requestStepUp']['responses']['200']['content']['application/json']['data']>
type VerifyBody = operations['verifyStepUp']['requestBody']['content']['application/json']
type VerifyData = NonNullable<operations['verifyStepUp']['responses']['200']['content']['application/json']['data']>
type ValidateBody = operations['validateStepUp']['requestBody']['content']['application/json']
type ValidateData = NonNullable<operations['validateStepUp']['responses']['200']['content']['application/json']['data']>

export function createAuthStepUps(client: ConjoinClient) {
  return {
    request: (appId: string, accountId: string, data: RequestBody) =>
      client.fetch<RequestData>(`auth/step-up/${appId}/account/${accountId}/step-up/request`, {
        method: 'POST',
        body: data,
      }),

    verify: (appId: string, accountId: string, data: VerifyBody) =>
      client.fetch<VerifyData>(`auth/step-up/${appId}/account/${accountId}/step-up/verify`, {
        method: 'POST',
        body: data,
      }),

    validate: (appId: string, accountId: string, data: ValidateBody) =>
      client.fetch<ValidateData>(`auth/step-up/${appId}/account/${accountId}/step-up/validate`, {
        method: 'POST',
        body: data,
      }),
  }
}
