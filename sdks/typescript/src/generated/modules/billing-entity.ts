import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateBody = operations['createBillingEntity']['requestBody']['content']['application/json']
type CreateData = NonNullable<operations['createBillingEntity']['responses']['201']['content']['application/json']['data']>
type ReadData = NonNullable<operations['readBillingEntity']['responses']['200']['content']['application/json']['data']>
type ReadQuery = NonNullable<operations['readBillingEntity']['parameters']['query']>
type UpdateBody = operations['updateBillingEntity']['requestBody']['content']['application/json']
type UpdateData = NonNullable<operations['updateBillingEntity']['responses']['200']['content']['application/json']['data']>
type CreatePayoutBankAccountBody = operations['createBillingPayoutBankAccount']['requestBody']['content']['application/json']
type CreatePayoutBankAccountData = NonNullable<operations['createBillingPayoutBankAccount']['responses']['200']['content']['application/json']['data']>
type InitiateStripeOnboardingBody = operations['initiateStripeOnboarding']['requestBody']['content']['application/json']
type InitiateStripeOnboardingResponse = operations['initiateStripeOnboarding']['responses']['200']['content']['application/json']
type CheckStripeOnboardingStatusResponse = operations['checkStripeOnboardingStatus']['responses']['200']['content']['application/json']
type CheckStripeOnboardingStatusQuery = NonNullable<operations['checkStripeOnboardingStatus']['parameters']['query']>
type SubmitPaystackCredentialsBody = operations['submitPaystackCredentials']['requestBody']['content']['application/json']
type SubmitPaystackCredentialsResponse = operations['submitPaystackCredentials']['responses']['200']['content']['application/json']
type OnboardBody = operations['onboardBillingEntities']['requestBody']['content']['application/json']
type OnboardResponse = operations['onboardBillingEntities']['responses']['200']['content']['application/json']

export function createBillingEntities(client: ConjoinClient) {
  return {
    create: (data: CreateBody) =>
      client.fetch<CreateData>('billing/entity/', { method: 'POST', body: data }),

    read: (query?: ReadQuery) =>
      client.fetch<ReadData>('billing/entity/', { query: query as Record<string, unknown> }),

    update: (data: UpdateBody) =>
      client.fetch<UpdateData>('billing/entity/', { method: 'PATCH', body: data }),

    createPayoutBankAccount: (data: CreatePayoutBankAccountBody) =>
      client.fetch<CreatePayoutBankAccountData>('billing/entity/payout/bank-account', { method: 'PUT', body: data }),

    initiateStripeOnboarding: (data: InitiateStripeOnboardingBody) =>
      client.fetch<InitiateStripeOnboardingResponse>('billing/entity/entities/onboarding/stripe', { method: 'POST', body: data }),

    checkStripeOnboardingStatus: (query?: CheckStripeOnboardingStatusQuery) =>
      client.fetch<CheckStripeOnboardingStatusResponse>('billing/entity/entities/onboarding/stripe', { query: query as Record<string, unknown> }),

    submitPaystackCredentials: (data: SubmitPaystackCredentialsBody) =>
      client.fetch<SubmitPaystackCredentialsResponse>('billing/entity/entities/onboarding/paystack', { method: 'POST', body: data }),

    onboard: (data: OnboardBody) =>
      client.fetch<OnboardResponse>('billing/entity/entities/onboard', { method: 'POST', body: data }),
  }
}
