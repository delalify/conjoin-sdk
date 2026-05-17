import { expect } from 'vitest'
import { createCloudAudits, createCloudBrandings } from '../../../src/cloud'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  auditLogFixture,
  brandingFixture,
  describeCloudSdkContractCases,
  ORGANIZATION_ID,
  organizationBrandingFixture,
  REQUEST_ID,
} from './cloud-test-utils'

const auditStatsFixture = {
  categories: {},
  services: {},
  total_events: 1,
}
const projectBrandingUpdateBody = { general: { app_name: 'Conjoin' } }
const projectBrandingPatchBody = { general: { app_name: 'Conjoin Cloud' } }
const organizationBrandingUpdateBody = { organization: { name: 'Demo Org' } }
const organizationBrandingPatchBody = { organization: { name: 'Demo Org Patch' } }

describeCloudSdkContractCases('Cloud audit SDK contract integration', [
  {
    name: 'reads audit logs',
    method: 'GET',
    path: '/v1/cloud/audit/logs',
    expectedQuery: {
      category: 'admin',
      conjoin_request_id: REQUEST_ID,
      'cursor[next]': 'cursor_next_123',
      event_code: 'cloud-spend_controls-updated',
      limit: '1',
      severity: 'info',
      'sort[occurred_at]': 'desc',
    },
    response: conjoinList([auditLogFixture()]),
    run: context =>
      createCloudAudits(context.client).readLogs({
        category: 'admin',
        conjoin_request_id: REQUEST_ID,
        cursor: { next: 'cursor_next_123' },
        event_code: 'cloud-spend_controls-updated',
        limit: 1,
        severity: 'info',
        sort: { occurred_at: 'desc' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [auditLogFixture()] }),
  },
  {
    name: 'reads audit stats',
    method: 'GET',
    path: '/v1/cloud/audit/stats',
    expectedQuery: {
      by: 'categories',
    },
    response: conjoinSuccess(auditStatsFixture),
    run: context => createCloudAudits(context.client).readStats({ by: 'categories' }),
    assertResult: result => expect(result).toEqual(auditStatsFixture),
  },
])

describeCloudSdkContractCases('Cloud branding SDK contract integration', [
  {
    name: 'reads project branding',
    method: 'GET',
    path: '/v1/cloud/branding/',
    response: conjoinSuccess(brandingFixture()),
    run: context => createCloudBrandings(context.client).getProject(),
    assertResult: result => expect(result).toEqual(brandingFixture()),
  },
  {
    name: 'updates project branding',
    method: 'PUT',
    path: '/v1/cloud/branding/update',
    expectedBody: projectBrandingUpdateBody,
    response: conjoinSuccess(brandingFixture({ general: { app_name: 'Conjoin' } })),
    run: context => createCloudBrandings(context.client).updateProject(projectBrandingUpdateBody),
    assertResult: result => expect(result).toEqual(brandingFixture({ general: { app_name: 'Conjoin' } })),
  },
  {
    name: 'patches project branding',
    method: 'PATCH',
    path: '/v1/cloud/branding/update',
    expectedBody: projectBrandingPatchBody,
    response: conjoinSuccess(brandingFixture({ general: { app_name: 'Conjoin Cloud' } })),
    run: context => createCloudBrandings(context.client).patchProject(projectBrandingPatchBody),
    assertResult: result => expect(result).toEqual(brandingFixture({ general: { app_name: 'Conjoin Cloud' } })),
  },
  {
    name: 'reads organization branding override',
    method: 'GET',
    path: '/v1/cloud/branding/organizations/{org_id}',
    expectedPath: `/v1/cloud/branding/organizations/${ORGANIZATION_ID}`,
    expectedPathParams: {
      org_id: ORGANIZATION_ID,
    },
    response: conjoinSuccess(organizationBrandingFixture()),
    run: context => createCloudBrandings(context.client).getOrgOverride(ORGANIZATION_ID),
    assertResult: result => expect(result).toEqual(organizationBrandingFixture()),
  },
  {
    name: 'updates organization branding override',
    method: 'PUT',
    path: '/v1/cloud/branding/organizations/{org_id}/update',
    expectedBody: organizationBrandingUpdateBody,
    expectedPath: `/v1/cloud/branding/organizations/${ORGANIZATION_ID}/update`,
    expectedPathParams: {
      org_id: ORGANIZATION_ID,
    },
    response: conjoinSuccess(organizationBrandingFixture({ organization: { name: 'Demo Org' } })),
    run: context =>
      createCloudBrandings(context.client).updateOrgOverride(ORGANIZATION_ID, organizationBrandingUpdateBody),
    assertResult: result => expect(result).toEqual(organizationBrandingFixture({ organization: { name: 'Demo Org' } })),
  },
  {
    name: 'patches organization branding override',
    method: 'PATCH',
    path: '/v1/cloud/branding/organizations/{org_id}/update',
    expectedBody: organizationBrandingPatchBody,
    expectedPath: `/v1/cloud/branding/organizations/${ORGANIZATION_ID}/update`,
    expectedPathParams: {
      org_id: ORGANIZATION_ID,
    },
    response: conjoinSuccess(organizationBrandingFixture({ organization: { name: 'Demo Org Patch' } })),
    run: context =>
      createCloudBrandings(context.client).patchOrgOverride(ORGANIZATION_ID, organizationBrandingPatchBody),
    assertResult: result =>
      expect(result).toEqual(organizationBrandingFixture({ organization: { name: 'Demo Org Patch' } })),
  },
])
