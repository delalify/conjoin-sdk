import { afterEach, describe, expect, it } from 'vitest'
import { createCloudSpendControls, createCloudWebhooks, createCloudZones } from '../../../src/cloud'
import type { operations } from '../../../src/generated/api-types'
import { expectContractRequest, expectJsonBody, expectQuery } from '../contract-server/assertions'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  spendControlFixture,
  spendControlUsageFixture,
  startCloudContractTest,
  WEBHOOK_ID,
  webhookEventFixture,
  webhookFixture,
  ZONE_ID,
  zoneFixture,
} from './cloud-test-utils'

const CLOUD_WEBHOOK_EVENT = 'cloud-spend_controls-updated'
type RegisterCloudWebhookBody = operations['registerCloudWebhook']['requestBody']['content']['application/json']

describe('Cloud spend control SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends spend control requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'GET',
      path: '/v1/cloud/spend-control/single',
      handler: () => conjoinSuccess(spendControlFixture()),
    })
    server.register({
      method: 'PUT',
      path: '/v1/cloud/spend-control/update',
      handler: () => conjoinSuccess(spendControlFixture({ overage_budget_micros: 2_000_000 })),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/spend-control/usage',
      handler: () => conjoinSuccess(spendControlUsageFixture()),
    })

    const spendControls = createCloudSpendControls(context.client)
    const updateBody = {
      alert_email_enabled: true,
      overage_budget_micros: 2_000_000,
    }

    await expect(spendControls.read()).resolves.toEqual(spendControlFixture())
    await expect(spendControls.update(updateBody)).resolves.toEqual(
      spendControlFixture({ overage_budget_micros: 2_000_000 }),
    )
    await expect(spendControls.readUsage()).resolves.toEqual(spendControlUsageFixture())

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'GET /v1/cloud/spend-control/single',
      'PUT /v1/cloud/spend-control/update',
      'GET /v1/cloud/spend-control/usage',
    ])
    expectJsonBody(expectContractRequest(requests[1]), updateBody)
  })
})

describe('Cloud webhook SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends webhook requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'POST',
      path: '/v1/cloud/cloud-webhook/register',
      handler: () => conjoinSuccess(webhookFixture({ name: 'Primary webhook' }), { status: 201 }),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/cloud-webhook/',
      handler: () => conjoinList([webhookFixture()]),
    })
    server.register({
      method: 'PATCH',
      path: '/v1/cloud/cloud-webhook/{webhook_id}',
      handler: () => conjoinSuccess(webhookFixture({ is_active: false })),
    })
    server.register({
      method: 'DELETE',
      path: '/v1/cloud/cloud-webhook/{webhook_id}',
      handler: () =>
        conjoinSuccess(
          webhookFixture({
            date_deleted: '2026-05-16T01:00:00.000Z',
            is_active: false,
          }),
        ),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/cloud-webhook/events',
      handler: () => conjoinList([webhookEventFixture()]),
    })

    const webhooks = createCloudWebhooks(context.client)
    const registerBody: RegisterCloudWebhookBody = {
      events: [CLOUD_WEBHOOK_EVENT],
      name: 'Primary webhook',
      url: 'https://example.com/webhook',
    }
    const updateBody = { is_active: false }

    await expect(webhooks.register(registerBody)).resolves.toEqual(webhookFixture({ name: 'Primary webhook' }))
    await expect(webhooks.read({ events: CLOUD_WEBHOOK_EVENT, webhook_id: WEBHOOK_ID })).resolves.toMatchObject({
      data: [webhookFixture()],
    })
    await expect(webhooks.update(WEBHOOK_ID, updateBody)).resolves.toEqual(webhookFixture({ is_active: false }))
    await expect(webhooks.delete(WEBHOOK_ID)).resolves.toEqual(
      webhookFixture({
        date_deleted: '2026-05-16T01:00:00.000Z',
        is_active: false,
      }),
    )
    await expect(webhooks.readEvents()).resolves.toMatchObject({ data: [webhookEventFixture()] })

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'POST /v1/cloud/cloud-webhook/register',
      'GET /v1/cloud/cloud-webhook/',
      `PATCH /v1/cloud/cloud-webhook/${WEBHOOK_ID}`,
      `DELETE /v1/cloud/cloud-webhook/${WEBHOOK_ID}`,
      'GET /v1/cloud/cloud-webhook/events',
    ])
    expectJsonBody(expectContractRequest(requests[0]), registerBody)
    expectQuery(expectContractRequest(requests[1]), {
      events: CLOUD_WEBHOOK_EVENT,
      webhook_id: WEBHOOK_ID,
    })
    expectJsonBody(expectContractRequest(requests[2]), updateBody)
  })
})

describe('Cloud zone SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends zone mutation requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'POST',
      path: '/v1/cloud/cloud-zones/new',
      handler: () => conjoinSuccess(zoneFixture(), { status: 201 }),
    })
    server.register({
      method: 'PATCH',
      path: '/v1/cloud/cloud-zones/verify-dns/{zone_id}',
      handler: () => conjoinSuccess(zoneFixture({ status: 'verified' })),
    })
    server.register({
      method: 'DELETE',
      path: '/v1/cloud/cloud-zones/{zone_id}',
      handler: () => conjoinSuccess(zoneFixture({ date_deleted: '2026-05-16T01:00:00.000Z' })),
    })

    const zones = createCloudZones(context.client)
    const createBody = {
      domain: 'example.com',
      provider_id: 'provider_123',
    }

    await expect(zones.create(createBody)).resolves.toEqual(zoneFixture())
    await expect(zones.verifyDns(ZONE_ID)).resolves.toEqual(zoneFixture({ status: 'verified' }))
    await expect(zones.delete(ZONE_ID)).resolves.toEqual(zoneFixture({ date_deleted: '2026-05-16T01:00:00.000Z' }))

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'POST /v1/cloud/cloud-zones/new',
      `PATCH /v1/cloud/cloud-zones/verify-dns/${ZONE_ID}`,
      `DELETE /v1/cloud/cloud-zones/${ZONE_ID}`,
    ])
    expectJsonBody(expectContractRequest(requests[0]), createBody)
  })
})
