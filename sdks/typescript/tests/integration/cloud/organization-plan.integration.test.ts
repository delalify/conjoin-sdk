import { afterEach, describe, expect, it } from 'vitest'
import { createCloudOrganizations, createCloudPlans } from '../../../src/cloud'
import { expectContractRequest, expectJsonBody, expectQuery } from '../contract-server/assertions'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import { ORGANIZATION_ID, organizationFixture, planFixture, startCloudContractTest } from './cloud-test-utils'

describe('Cloud organization SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends organization requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'POST',
      path: '/v1/cloud/organization/new',
      handler: () => conjoinSuccess(organizationFixture({ custom_id: 'demo-org' }), { status: 201 }),
    })
    server.register({
      method: 'PATCH',
      path: '/v1/cloud/organization/update-info/{domain_id_or_custom_id}',
      handler: () => conjoinSuccess(organizationFixture({ name: 'Renamed organization' })),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/organization/',
      handler: () => conjoinList([organizationFixture()]),
    })

    const organizations = createCloudOrganizations(context.client)
    const createBody = {
      custom_id: 'demo-org',
      name: 'Demo organization',
      tags: ['contract'],
    }
    const updateBody = {
      name: 'Renamed organization',
      tags: ['cloud'],
    }

    await expect(organizations.create(createBody)).resolves.toEqual(organizationFixture({ custom_id: 'demo-org' }))
    await expect(organizations.update(ORGANIZATION_ID, updateBody)).resolves.toEqual(
      organizationFixture({ name: 'Renamed organization' }),
    )
    await expect(
      organizations.read({
        cursor: { next: 'cursor_next_123' },
        limit: 1,
        query: { name: 'Demo organization' },
        sort: { date_created: 'desc' },
      }),
    ).resolves.toMatchObject({ data: [organizationFixture()] })

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'POST /v1/cloud/organization/new',
      `PATCH /v1/cloud/organization/update-info/${ORGANIZATION_ID}`,
      'GET /v1/cloud/organization/',
    ])
    expectJsonBody(expectContractRequest(requests[0]), createBody)
    expectJsonBody(expectContractRequest(requests[1]), updateBody)
    expectQuery(expectContractRequest(requests[2]), {
      'cursor[next]': 'cursor_next_123',
      limit: '1',
      'query[name]': 'Demo organization',
      'sort[date_created]': 'desc',
    })
  })
})

describe('Cloud plan SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends plan requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'GET',
      path: '/v1/cloud/plan/many',
      handler: () => conjoinList([planFixture()]),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/plan/single/{slug}',
      handler: () => conjoinSuccess(planFixture()),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/plan/account',
      handler: () => conjoinSuccess(planFixture({ slug: 'business' })),
    })

    const plans = createCloudPlans(context.client)

    await expect(
      plans.list({
        cursor: { next: 'cursor_next_123' },
        limit: 1,
        query: { currency: 'usd', slug: 'starter', status: 'active' },
        sort: { date_created: 'desc' },
      }),
    ).resolves.toMatchObject({ data: [planFixture()] })
    await expect(plans.read('starter')).resolves.toEqual(planFixture())
    await expect(plans.readAccount()).resolves.toEqual(planFixture({ slug: 'business' }))

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'GET /v1/cloud/plan/many',
      'GET /v1/cloud/plan/single/starter',
      'GET /v1/cloud/plan/account',
    ])
    expectQuery(expectContractRequest(requests[0]), {
      'cursor[next]': 'cursor_next_123',
      limit: '1',
      'query[currency]': 'usd',
      'query[slug]': 'starter',
      'query[status]': 'active',
      'sort[date_created]': 'desc',
    })
  })
})
