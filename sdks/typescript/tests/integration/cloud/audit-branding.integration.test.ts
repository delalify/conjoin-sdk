import { afterEach, describe, expect, it } from 'vitest'
import { createCloudAudits, createCloudBrandings } from '../../../src/cloud'
import { expectContractRequest, expectJsonBody, expectQuery } from '../contract-server/assertions'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  auditLogFixture,
  brandingFixture,
  ORGANIZATION_ID,
  organizationBrandingFixture,
  REQUEST_ID,
  startCloudContractTest,
} from './cloud-test-utils'

describe('Cloud audit SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends audit requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'GET',
      path: '/v1/cloud/audit/logs',
      handler: () => conjoinList([auditLogFixture()]),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/audit/stats',
      handler: () =>
        conjoinSuccess({
          categories: {},
          services: {},
          total_events: 1,
        }),
    })

    const audits = createCloudAudits(context.client)

    await expect(
      audits.readLogs({
        category: 'admin',
        conjoin_request_id: REQUEST_ID,
        cursor: { next: 'cursor_next_123' },
        event_code: 'cloud-spend_controls-updated',
        limit: 1,
        severity: 'info',
        sort: { occurred_at: 'desc' },
      }),
    ).resolves.toMatchObject({ data: [auditLogFixture()] })
    await expect(audits.readStats({ by: 'categories' })).resolves.toEqual({
      categories: {},
      services: {},
      total_events: 1,
    })

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'GET /v1/cloud/audit/logs',
      'GET /v1/cloud/audit/stats',
    ])
    expectQuery(expectContractRequest(requests[0]), {
      category: 'admin',
      conjoin_request_id: REQUEST_ID,
      'cursor[next]': 'cursor_next_123',
      event_code: 'cloud-spend_controls-updated',
      limit: '1',
      severity: 'info',
      'sort[occurred_at]': 'desc',
    })
    expectQuery(expectContractRequest(requests[1]), { by: 'categories' })
  })
})

describe('Cloud branding SDK contract integration', () => {
  let server: ConjoinContractServer | undefined

  afterEach(async () => {
    await server?.stop()
    server = undefined
  })

  it('sends project and organization branding requests through the generated SDK methods', async () => {
    const context = await startCloudContractTest()
    server = context.server
    server.register({
      method: 'GET',
      path: '/v1/cloud/branding/',
      handler: () => conjoinSuccess(brandingFixture()),
    })
    server.register({
      method: 'PUT',
      path: '/v1/cloud/branding/update',
      handler: () => conjoinSuccess(brandingFixture({ general: { app_name: 'Conjoin' } })),
    })
    server.register({
      method: 'PATCH',
      path: '/v1/cloud/branding/update',
      handler: () => conjoinSuccess(brandingFixture({ general: { app_name: 'Conjoin Cloud' } })),
    })
    server.register({
      method: 'GET',
      path: '/v1/cloud/branding/organizations/{org_id}',
      handler: () => conjoinSuccess(organizationBrandingFixture()),
    })
    server.register({
      method: 'PUT',
      path: '/v1/cloud/branding/organizations/{org_id}/update',
      handler: () => conjoinSuccess(organizationBrandingFixture({ organization: { name: 'Demo Org' } })),
    })
    server.register({
      method: 'PATCH',
      path: '/v1/cloud/branding/organizations/{org_id}/update',
      handler: () => conjoinSuccess(organizationBrandingFixture({ organization: { name: 'Demo Org Patch' } })),
    })

    const brandings = createCloudBrandings(context.client)
    const updateBody = { general: { app_name: 'Conjoin' } }
    const patchBody = { general: { app_name: 'Conjoin Cloud' } }
    const orgUpdateBody = { organization: { name: 'Demo Org' } }
    const orgPatchBody = { organization: { name: 'Demo Org Patch' } }

    await expect(brandings.getProject()).resolves.toEqual(brandingFixture())
    await expect(brandings.updateProject(updateBody)).resolves.toEqual(
      brandingFixture({ general: { app_name: 'Conjoin' } }),
    )
    await expect(brandings.patchProject(patchBody)).resolves.toEqual(
      brandingFixture({ general: { app_name: 'Conjoin Cloud' } }),
    )
    await expect(brandings.getOrgOverride(ORGANIZATION_ID)).resolves.toEqual(organizationBrandingFixture())
    await expect(brandings.updateOrgOverride(ORGANIZATION_ID, orgUpdateBody)).resolves.toEqual(
      organizationBrandingFixture({ organization: { name: 'Demo Org' } }),
    )
    await expect(brandings.patchOrgOverride(ORGANIZATION_ID, orgPatchBody)).resolves.toEqual(
      organizationBrandingFixture({ organization: { name: 'Demo Org Patch' } }),
    )

    const requests = server.recorder.all()

    expect(requests.map(request => `${request.method} ${request.path}`)).toEqual([
      'GET /v1/cloud/branding/',
      'PUT /v1/cloud/branding/update',
      'PATCH /v1/cloud/branding/update',
      `GET /v1/cloud/branding/organizations/${ORGANIZATION_ID}`,
      `PUT /v1/cloud/branding/organizations/${ORGANIZATION_ID}/update`,
      `PATCH /v1/cloud/branding/organizations/${ORGANIZATION_ID}/update`,
    ])
    expectJsonBody(expectContractRequest(requests[1]), updateBody)
    expectJsonBody(expectContractRequest(requests[2]), patchBody)
    expectJsonBody(expectContractRequest(requests[4]), orgUpdateBody)
    expectJsonBody(expectContractRequest(requests[5]), orgPatchBody)
  })
})
