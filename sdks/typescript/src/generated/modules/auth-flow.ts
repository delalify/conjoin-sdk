import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type StartSignupBody = operations['startSignup']['requestBody']['content']['application/json']
type StartSignupData = NonNullable<operations['startSignup']['responses']['200']['content']['application/json']['data']>
type CompleteSignupBody = operations['completeSignup']['requestBody']['content']['application/json']
type CompleteSignupData = NonNullable<
  operations['completeSignup']['responses']['200']['content']['application/json']['data']
>
type StartSigninBody = operations['startSignin']['requestBody']['content']['application/json']
type StartSigninData = NonNullable<operations['startSignin']['responses']['200']['content']['application/json']['data']>
type CompleteSigninBody = operations['completeSignin']['requestBody']['content']['application/json']
type CompleteSigninData = NonNullable<
  operations['completeSignin']['responses']['200']['content']['application/json']['data']
>
type StartPasswordResetBody = operations['startPasswordReset']['requestBody']['content']['application/json']
type StartPasswordResetData = NonNullable<
  operations['startPasswordReset']['responses']['200']['content']['application/json']['data']
>
type CompletePasswordResetBody = operations['completePasswordReset']['requestBody']['content']['application/json']
type CompletePasswordResetData = NonNullable<
  operations['completePasswordReset']['responses']['200']['content']['application/json']['data']
>

export function createAuthFlows(client: ConjoinClient) {
  return {
    startSignup: (appId: string, clientId: string, data: StartSignupBody) =>
      client.fetch<StartSignupData>(`auth/flow/${appId}/${clientId}/signup/start`, { method: 'POST', body: data }),

    completeSignup: (appId: string, clientId: string, data: CompleteSignupBody) =>
      client.fetch<CompleteSignupData>(`auth/flow/${appId}/${clientId}/signup/complete`, {
        method: 'POST',
        body: data,
      }),

    startSignin: (appId: string, clientId: string, data: StartSigninBody) =>
      client.fetch<StartSigninData>(`auth/flow/${appId}/${clientId}/signin/start`, { method: 'POST', body: data }),

    completeSignin: (appId: string, clientId: string, data: CompleteSigninBody) =>
      client.fetch<CompleteSigninData>(`auth/flow/${appId}/${clientId}/signin/complete`, {
        method: 'POST',
        body: data,
      }),

    startPasswordReset: (appId: string, clientId: string, data: StartPasswordResetBody) =>
      client.fetch<StartPasswordResetData>(`auth/flow/${appId}/${clientId}/password/reset/start`, {
        method: 'POST',
        body: data,
      }),

    completePasswordReset: (appId: string, clientId: string, data: CompletePasswordResetBody) =>
      client.fetch<CompletePasswordResetData>(`auth/flow/${appId}/${clientId}/password/reset/complete`, {
        method: 'POST',
        body: data,
      }),
  }
}
