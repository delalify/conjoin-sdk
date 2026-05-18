import { expect } from 'vitest'
import { createBillingSubscriptionSchedules, createBillingSubscriptions } from '../../../src/billing'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  billingSubscriptionCycleFixture,
  billingSubscriptionFixture,
  billingSubscriptionScheduleFixture,
} from './billing-platform-test-utils'
import {
  CUSTOMER_ID,
  describeBillingSdkContractCases,
  ENTITY_ID,
  PRICE_ID,
  SCHEDULE_ID,
  SUBSCRIPTION_ID,
} from './billing-test-utils'

const createSubscriptionBody = {
  customer_id: CUSTOMER_ID,
  price_ids: [PRICE_ID],
  reference_id: 'subscription_reference_123',
}
const updateSubscriptionBody = { auto_renew: false }
const updatePlansBody = {
  items: [
    {
      price_id: PRICE_ID,
      quantity: 2,
    },
  ],
  proration_behavior: 'none' as const,
}
const cancelSubscriptionBody = {
  reason: 'contract test',
  termination_behavior: 'end_immediately' as const,
}
const pauseSubscriptionBody = { reason: 'contract test' }
const recordUsageBody = {
  plan_id: 'plan_123',
  records: [
    {
      action: 'increment' as const,
      quantity: 1,
    },
  ],
}
const createScheduleBody = {
  end_behavior: 'release' as const,
  phases: [
    {
      end_date: '2026-07-16T00:00:00.000Z',
      items: [
        {
          price_id: PRICE_ID,
          quantity: 1,
        },
      ],
      start_date: '2026-06-16T00:00:00.000Z',
    },
  ],
}
const updatePlansResponse = {
  applied_proration_behavior: 'none',
  subscription: billingSubscriptionFixture(),
}
const usageSummaryFixture = {
  plans: [],
  subscription_id: SUBSCRIPTION_ID,
}

describeBillingSdkContractCases('Billing subscription SDK contract integration', [
  {
    name: 'creates a subscription',
    method: 'POST',
    path: '/v1/billing/subscription/{entity_id}/create',
    expectedBody: createSubscriptionBody,
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/create`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    response: conjoinSuccess(billingSubscriptionFixture(), { status: 201 }),
    run: context => createBillingSubscriptions(context.client).create(ENTITY_ID, createSubscriptionBody),
    assertResult: result => expect(result).toEqual(billingSubscriptionFixture()),
  },
  {
    name: 'lists subscriptions',
    method: 'GET',
    path: '/v1/billing/subscription/{entity_id}',
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      'query[customer_id]': CUSTOMER_ID,
      'query[status]': 'active',
    },
    response: conjoinList([billingSubscriptionFixture()]),
    run: context =>
      createBillingSubscriptions(context.client).list(ENTITY_ID, {
        query: { customer_id: CUSTOMER_ID, status: 'active' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [billingSubscriptionFixture()] }),
  },
  {
    name: 'updates subscription metadata',
    method: 'PATCH',
    path: '/v1/billing/subscription/{entity_id}/metadata/{subscription_id}',
    expectedBody: updateSubscriptionBody,
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/metadata/${SUBSCRIPTION_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(billingSubscriptionFixture({ auto_renew: false })),
    run: context =>
      createBillingSubscriptions(context.client).update(ENTITY_ID, SUBSCRIPTION_ID, updateSubscriptionBody),
    assertResult: result => expect(result).toEqual(billingSubscriptionFixture({ auto_renew: false })),
  },
  {
    name: 'updates subscription plans',
    method: 'PATCH',
    path: '/v1/billing/subscription/{entity_id}/plans/{subscription_id}',
    expectedBody: updatePlansBody,
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/plans/${SUBSCRIPTION_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(updatePlansResponse),
    run: context => createBillingSubscriptions(context.client).updatePlans(ENTITY_ID, SUBSCRIPTION_ID, updatePlansBody),
    assertResult: result => expect(result).toEqual(updatePlansResponse),
  },
  {
    name: 'cancels a subscription',
    method: 'POST',
    path: '/v1/billing/subscription/{entity_id}/cancel/{subscription_id}',
    expectedBody: cancelSubscriptionBody,
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/cancel/${SUBSCRIPTION_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(billingSubscriptionFixture({ status: 'canceled' })),
    run: context =>
      createBillingSubscriptions(context.client).cancel(ENTITY_ID, SUBSCRIPTION_ID, cancelSubscriptionBody),
    assertResult: result => expect(result).toEqual(billingSubscriptionFixture({ status: 'canceled' })),
  },
  {
    name: 'pauses a subscription',
    method: 'POST',
    path: '/v1/billing/subscription/{entity_id}/pause/{subscription_id}',
    expectedBody: pauseSubscriptionBody,
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/pause/${SUBSCRIPTION_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(billingSubscriptionFixture({ status: 'paused' })),
    run: context => createBillingSubscriptions(context.client).pause(ENTITY_ID, SUBSCRIPTION_ID, pauseSubscriptionBody),
    assertResult: result => expect(result).toEqual(billingSubscriptionFixture({ status: 'paused' })),
  },
  {
    name: 'resumes a subscription',
    method: 'POST',
    path: '/v1/billing/subscription/{entity_id}/resume/{subscription_id}',
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/resume/${SUBSCRIPTION_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(billingSubscriptionFixture()),
    run: context => createBillingSubscriptions(context.client).resume(ENTITY_ID, SUBSCRIPTION_ID),
    assertResult: result => expect(result).toEqual(billingSubscriptionFixture()),
  },
  {
    name: 'records subscription usage',
    method: 'POST',
    path: '/v1/billing/subscription/{entity_id}/usage/{subscription_id}',
    expectedBody: recordUsageBody,
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/usage/${SUBSCRIPTION_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(billingSubscriptionFixture()),
    run: context => createBillingSubscriptions(context.client).recordUsage(ENTITY_ID, SUBSCRIPTION_ID, recordUsageBody),
    assertResult: result => expect(result).toEqual(billingSubscriptionFixture()),
  },
  {
    name: 'reads subscription usage summary',
    method: 'GET',
    path: '/v1/billing/subscription/{entity_id}/usage-summary',
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/usage-summary`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
    },
    expectedQuery: {
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinList([usageSummaryFixture]),
    run: context =>
      createBillingSubscriptions(context.client).readUsageSummary(ENTITY_ID, {
        subscription_id: SUBSCRIPTION_ID,
      }),
    assertResult: result => expect(result).toMatchObject({ data: [usageSummaryFixture] }),
  },
  {
    name: 'reads subscription cycles',
    method: 'GET',
    path: '/v1/billing/subscription/{entity_id}/cycles/{subscription_id}',
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/cycles/${SUBSCRIPTION_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    expectedQuery: {
      'query[cycle_id]': 'cycle_123',
    },
    response: conjoinList([billingSubscriptionCycleFixture()]),
    run: context =>
      createBillingSubscriptions(context.client).readCycles(ENTITY_ID, SUBSCRIPTION_ID, {
        query: { cycle_id: 'cycle_123' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [billingSubscriptionCycleFixture()] }),
  },
])

describeBillingSdkContractCases('Billing subscription schedule SDK contract integration', [
  {
    name: 'creates a subscription schedule',
    method: 'POST',
    path: '/v1/billing/subscription/{entity_id}/schedules/{subscription_id}',
    expectedBody: createScheduleBody,
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/schedules/${SUBSCRIPTION_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(billingSubscriptionScheduleFixture(), { status: 201 }),
    run: context =>
      createBillingSubscriptionSchedules(context.client).create(ENTITY_ID, SUBSCRIPTION_ID, createScheduleBody),
    assertResult: result => expect(result).toEqual(billingSubscriptionScheduleFixture()),
  },
  {
    name: 'lists subscription schedules',
    method: 'GET',
    path: '/v1/billing/subscription/{entity_id}/schedules/{subscription_id}',
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/schedules/${SUBSCRIPTION_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    expectedQuery: {
      'query[status]': 'active',
    },
    response: conjoinList([billingSubscriptionScheduleFixture()]),
    run: context =>
      createBillingSubscriptionSchedules(context.client).list(ENTITY_ID, SUBSCRIPTION_ID, {
        query: { status: 'active' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [billingSubscriptionScheduleFixture()] }),
  },
  {
    name: 'gets a subscription schedule',
    method: 'GET',
    path: '/v1/billing/subscription/{entity_id}/schedules/{subscription_id}/{schedule_id}',
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/schedules/${SUBSCRIPTION_ID}/${SCHEDULE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      schedule_id: SCHEDULE_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(billingSubscriptionScheduleFixture()),
    run: context => createBillingSubscriptionSchedules(context.client).get(ENTITY_ID, SUBSCRIPTION_ID, SCHEDULE_ID),
    assertResult: result => expect(result).toEqual(billingSubscriptionScheduleFixture()),
  },
  {
    name: 'cancels a subscription schedule',
    method: 'DELETE',
    path: '/v1/billing/subscription/{entity_id}/schedules/{subscription_id}/{schedule_id}',
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/schedules/${SUBSCRIPTION_ID}/${SCHEDULE_ID}`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      schedule_id: SCHEDULE_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(billingSubscriptionScheduleFixture({ status: 'canceled' })),
    run: context => createBillingSubscriptionSchedules(context.client).cancel(ENTITY_ID, SUBSCRIPTION_ID, SCHEDULE_ID),
    assertResult: result => expect(result).toEqual(billingSubscriptionScheduleFixture({ status: 'canceled' })),
  },
  {
    name: 'releases a subscription schedule',
    method: 'POST',
    path: '/v1/billing/subscription/{entity_id}/schedules/{subscription_id}/{schedule_id}/release',
    expectedPath: `/v1/billing/subscription/${ENTITY_ID}/schedules/${SUBSCRIPTION_ID}/${SCHEDULE_ID}/release`,
    expectedPathParams: {
      entity_id: ENTITY_ID,
      schedule_id: SCHEDULE_ID,
      subscription_id: SUBSCRIPTION_ID,
    },
    response: conjoinSuccess(billingSubscriptionScheduleFixture({ status: 'released' })),
    run: context => createBillingSubscriptionSchedules(context.client).release(ENTITY_ID, SUBSCRIPTION_ID, SCHEDULE_ID),
    assertResult: result => expect(result).toEqual(billingSubscriptionScheduleFixture({ status: 'released' })),
  },
])
