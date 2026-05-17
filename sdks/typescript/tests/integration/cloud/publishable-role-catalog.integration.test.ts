import { afterEach, describe, expect, it } from 'vitest'
import {
  createCloudPublishableKeys,
  createCloudRoles,
  createCloudSKUCatalogs,
  createCloudSKUQuotas,
} from '../../../src/cloud'
import { expectContractRequest, expectJsonBody } from '../contract-server/assertions'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  PROJECT_ID,
  publishableKeyFixture,
  ROLE_ID,
  roleFixture,
  skuCatalogFixture,
  skuQuotaFixture,
  startCloudContractTest,
} from './cloud-test-utils'

const PUBLISHABLE_KEY_ID = 'publishable_key_123'

describe('Cloud publishable key SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends publishable key requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'POST',
      path: '/v1/cloud/publishable-key/new',
      handler: () => conjoinSuccess(publishableKeyFixture()),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/publishable-key/',
      handler: () => conjoinList([publishableKeyFixture()]),
    })
    server.register({
      method: 'POST',
      path: '/v1/cloud/publishable-key/{publishable_key_id}/rotate',
      handler: () => conjoinSuccess(publishableKeyFixture({ date_updated: '2026-05-16T01:00:00.000Z' })),
    })
    server.register({
      method: 'PATCH',
      path: '/v1/cloud/publishable-key/{publishable_key_id}/domains',
      handler: () => conjoinSuccess(publishableKeyFixture({ allowed_domains: ['example.com', 'app.example.com'] })),
    })
    server.register({
      method: 'DELETE',
      path: '/v1/cloud/publishable-key/{publishable_key_id}',
      handler: () =>
        conjoinSuccess(
          publishableKeyFixture({
            date_revoked: '2026-05-16T01:00:00.000Z',
            is_active: false,
          }),
        ),
    })

    const publishableKeys = createCloudPublishableKeys(context.client)
    const updateDomainsBody = { allowed_domains: ['example.com', 'app.example.com'] }

    await expect(publishableKeys.create()).resolves.toEqual(publishableKeyFixture())
    await expect(publishableKeys.list()).resolves.toMatchObject({ data: [publishableKeyFixture()] })
    await expect(publishableKeys.rotate(PUBLISHABLE_KEY_ID)).resolves.toEqual(
      publishableKeyFixture({ date_updated: '2026-05-16T01:00:00.000Z' }),
    )
    await expect(publishableKeys.updateDomains(PUBLISHABLE_KEY_ID, updateDomainsBody)).resolves.toEqual(
      publishableKeyFixture({ allowed_domains: ['example.com', 'app.example.com'] }),
    )
    await expect(publishableKeys.revoke(PUBLISHABLE_KEY_ID)).resolves.toEqual(
      publishableKeyFixture({
        date_revoked: '2026-05-16T01:00:00.000Z',
        is_active: false,
      }),
    )

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'POST /v1/cloud/publishable-key/new',
      'GET /v1/cloud/publishable-key/',
      `POST /v1/cloud/publishable-key/${PUBLISHABLE_KEY_ID}/rotate`,
      `PATCH /v1/cloud/publishable-key/${PUBLISHABLE_KEY_ID}/domains`,
      `DELETE /v1/cloud/publishable-key/${PUBLISHABLE_KEY_ID}`,
    ])
    expectJsonBody(expectContractRequest(requests[3]), updateDomainsBody)
  })
})

describe('Cloud role SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends custom role requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'POST',
      path: '/v1/cloud/custom-role/new',
      handler: () => conjoinSuccess(roleFixture(), { status: 201 }),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/custom-role/many',
      handler: () => conjoinList([roleFixture()]),
    })
    server.register({
      method: 'PUT',
      path: '/v1/cloud/custom-role/update/{role_id}',
      handler: () => conjoinSuccess(roleFixture({ title: 'Updated Role' })),
    })

    const roles = createCloudRoles(context.client)
    const createBody = {
      name: 'project.admin',
      permissions: ['cloud.project.read'],
      project_id: PROJECT_ID,
      title: 'Project Admin',
    }
    const updateBody = {
      permissions: ['cloud.project.read'],
      title: 'Updated Role',
    }

    await expect(roles.create(createBody)).resolves.toEqual(roleFixture())
    await expect(roles.read()).resolves.toMatchObject({ data: [roleFixture()] })
    await expect(roles.update(ROLE_ID, updateBody)).resolves.toEqual(roleFixture({ title: 'Updated Role' }))

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'POST /v1/cloud/custom-role/new',
      'GET /v1/cloud/custom-role/many',
      `PUT /v1/cloud/custom-role/update/${ROLE_ID}`,
    ])
    expectJsonBody(expectContractRequest(requests[0]), createBody)
    expectJsonBody(expectContractRequest(requests[2]), updateBody)
  })
})

describe('Cloud SKU catalog SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends SKU catalog and quota requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'GET',
      path: '/v1/cloud/sku-catalog/many',
      handler: () => conjoinList([skuCatalogFixture()]),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/sku-catalog/single/{slug}',
      handler: () => conjoinSuccess(skuCatalogFixture()),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/sku-quota/account',
      handler: () => conjoinList([skuQuotaFixture()]),
    })

    const skuCatalogs = createCloudSKUCatalogs(context.client)
    const skuQuotas = createCloudSKUQuotas(context.client)

    await expect(skuCatalogs.readSkuCatalog()).resolves.toMatchObject({ data: [skuCatalogFixture()] })
    await expect(skuCatalogs.readSingleSkuCatalog('cloud.compute')).resolves.toEqual(skuCatalogFixture())
    await expect(skuQuotas.readAccountSkuQuotas()).resolves.toMatchObject({ data: [skuQuotaFixture()] })

    expect(server.recorder.all().map(request => `${request.method} ${request.path}`)).toEqual([
      'GET /v1/cloud/sku-catalog/many',
      'GET /v1/cloud/sku-catalog/single/cloud.compute',
      'GET /v1/cloud/sku-quota/account',
    ])
  })
})
