import { expect } from 'vitest'
import { createCloudSpendControls, createCloudWebhooks, createCloudZones } from '../../../src/cloud'
import type { operations } from '../../../src/generated/api-types'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  describeCloudSdkContractCases,
  spendControlFixture,
  spendControlUsageFixture,
  WEBHOOK_ID,
  webhookEventFixture,
  webhookFixture,
  ZONE_ID,
  zoneFixture,
} from './cloud-test-utils'

const CLOUD_WEBHOOK_EVENT = 'cloud-spend_controls-updated'
const WEBHOOK_DELETED_AT = '2026-05-16T01:00:00.000Z'
const ZONE_DELETED_AT = '2026-05-16T01:00:00.000Z'
type RegisterCloudWebhookBody = operations['registerCloudWebhook']['requestBody']['content']['application/json']
const updateSpendControlBody = {
  alert_email_enabled: true,
  overage_budget_micros: 2_000_000,
}
const registerWebhookBody: RegisterCloudWebhookBody = {
  events: [CLOUD_WEBHOOK_EVENT],
  name: 'Primary webhook',
  url: 'https://example.com/webhook',
}
const updateWebhookBody = { is_active: false }
const createZoneBody = {
  domain: 'example.com',
  provider_id: 'provider_123',
}

describeCloudSdkContractCases('Cloud spend control SDK contract integration', [
  {
    name: 'reads spend control',
    method: 'GET',
    path: '/v1/cloud/spend-control/single',
    response: conjoinSuccess(spendControlFixture()),
    run: context => createCloudSpendControls(context.client).read(),
    assertResult: result => expect(result).toEqual(spendControlFixture()),
  },
  {
    name: 'updates spend control',
    method: 'PUT',
    path: '/v1/cloud/spend-control/update',
    expectedBody: updateSpendControlBody,
    response: conjoinSuccess(spendControlFixture({ overage_budget_micros: 2_000_000 })),
    run: context => createCloudSpendControls(context.client).update(updateSpendControlBody),
    assertResult: result => expect(result).toEqual(spendControlFixture({ overage_budget_micros: 2_000_000 })),
  },
  {
    name: 'reads spend control usage',
    method: 'GET',
    path: '/v1/cloud/spend-control/usage',
    response: conjoinSuccess(spendControlUsageFixture()),
    run: context => createCloudSpendControls(context.client).readUsage(),
    assertResult: result => expect(result).toEqual(spendControlUsageFixture()),
  },
])

describeCloudSdkContractCases('Cloud webhook SDK contract integration', [
  {
    name: 'registers a webhook',
    method: 'POST',
    path: '/v1/cloud/cloud-webhook/register',
    expectedBody: registerWebhookBody,
    response: conjoinSuccess(webhookFixture({ name: 'Primary webhook' }), { status: 201 }),
    run: context => createCloudWebhooks(context.client).register(registerWebhookBody),
    assertResult: result => expect(result).toEqual(webhookFixture({ name: 'Primary webhook' })),
  },
  {
    name: 'lists webhooks',
    method: 'GET',
    path: '/v1/cloud/cloud-webhook/',
    expectedQuery: {
      events: CLOUD_WEBHOOK_EVENT,
      webhook_id: WEBHOOK_ID,
    },
    response: conjoinList([webhookFixture()]),
    run: context => createCloudWebhooks(context.client).read({ events: CLOUD_WEBHOOK_EVENT, webhook_id: WEBHOOK_ID }),
    assertResult: result => expect(result).toMatchObject({ data: [webhookFixture()] }),
  },
  {
    name: 'updates a webhook',
    method: 'PATCH',
    path: '/v1/cloud/cloud-webhook/{webhook_id}',
    expectedBody: updateWebhookBody,
    expectedPath: `/v1/cloud/cloud-webhook/${WEBHOOK_ID}`,
    expectedPathParams: {
      webhook_id: WEBHOOK_ID,
    },
    response: conjoinSuccess(webhookFixture({ is_active: false })),
    run: context => createCloudWebhooks(context.client).update(WEBHOOK_ID, updateWebhookBody),
    assertResult: result => expect(result).toEqual(webhookFixture({ is_active: false })),
  },
  {
    name: 'deletes a webhook',
    method: 'DELETE',
    path: '/v1/cloud/cloud-webhook/{webhook_id}',
    expectedPath: `/v1/cloud/cloud-webhook/${WEBHOOK_ID}`,
    expectedPathParams: {
      webhook_id: WEBHOOK_ID,
    },
    response: conjoinSuccess(
      webhookFixture({
        date_deleted: WEBHOOK_DELETED_AT,
        is_active: false,
      }),
    ),
    run: context => createCloudWebhooks(context.client).delete(WEBHOOK_ID),
    assertResult: result =>
      expect(result).toEqual(
        webhookFixture({
          date_deleted: WEBHOOK_DELETED_AT,
          is_active: false,
        }),
      ),
  },
  {
    name: 'reads webhook events',
    method: 'GET',
    path: '/v1/cloud/cloud-webhook/events',
    response: conjoinList([webhookEventFixture()]),
    run: context => createCloudWebhooks(context.client).readEvents(),
    assertResult: result => expect(result).toMatchObject({ data: [webhookEventFixture()] }),
  },
])

describeCloudSdkContractCases('Cloud zone SDK contract integration', [
  {
    name: 'creates a zone',
    method: 'POST',
    path: '/v1/cloud/cloud-zones/new',
    expectedBody: createZoneBody,
    response: conjoinSuccess(zoneFixture(), { status: 201 }),
    run: context => createCloudZones(context.client).create(createZoneBody),
    assertResult: result => expect(result).toEqual(zoneFixture()),
  },
  {
    name: 'reads a zone',
    method: 'GET',
    path: '/v1/cloud/cloud-zones/{zone_id}',
    expectedPath: `/v1/cloud/cloud-zones/${ZONE_ID}`,
    expectedPathParams: {
      zone_id: ZONE_ID,
    },
    response: conjoinSuccess(zoneFixture()),
    run: context => createCloudZones(context.client).read(ZONE_ID),
    assertResult: result => expect(result).toEqual(zoneFixture()),
  },
  {
    name: 'verifies zone DNS',
    method: 'PATCH',
    path: '/v1/cloud/cloud-zones/verify-dns/{zone_id}',
    expectedPath: `/v1/cloud/cloud-zones/verify-dns/${ZONE_ID}`,
    expectedPathParams: {
      zone_id: ZONE_ID,
    },
    response: conjoinSuccess(zoneFixture({ status: 'verified' })),
    run: context => createCloudZones(context.client).verifyDns(ZONE_ID),
    assertResult: result => expect(result).toEqual(zoneFixture({ status: 'verified' })),
  },
  {
    name: 'deletes a zone',
    method: 'DELETE',
    path: '/v1/cloud/cloud-zones/{zone_id}',
    expectedPath: `/v1/cloud/cloud-zones/${ZONE_ID}`,
    expectedPathParams: {
      zone_id: ZONE_ID,
    },
    response: conjoinSuccess(zoneFixture({ date_deleted: ZONE_DELETED_AT })),
    run: context => createCloudZones(context.client).delete(ZONE_ID),
    assertResult: result => expect(result).toEqual(zoneFixture({ date_deleted: ZONE_DELETED_AT })),
  },
])
