import { expect } from 'vitest'
import { createCloudOrganizations, createCloudPlans } from '../../../src/cloud'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import { describeCloudSdkContractCases, ORGANIZATION_ID, organizationFixture, planFixture } from './cloud-test-utils'

const createOrganizationBody = {
  custom_id: 'demo-org',
  name: 'Demo organization',
  tags: ['contract'],
}
const updateOrganizationBody = {
  name: 'Renamed organization',
  tags: ['cloud'],
}

describeCloudSdkContractCases('Cloud organization SDK contract integration', [
  {
    name: 'creates an organization',
    method: 'POST',
    path: '/v1/cloud/organization/new',
    expectedBody: createOrganizationBody,
    response: conjoinSuccess(organizationFixture({ custom_id: 'demo-org' }), { status: 201 }),
    run: context => createCloudOrganizations(context.client).create(createOrganizationBody),
    assertResult: result => expect(result).toEqual(organizationFixture({ custom_id: 'demo-org' })),
  },
  {
    name: 'updates an organization',
    method: 'PATCH',
    path: '/v1/cloud/organization/update-info/{domain_id_or_custom_id}',
    expectedBody: updateOrganizationBody,
    expectedPath: `/v1/cloud/organization/update-info/${ORGANIZATION_ID}`,
    expectedPathParams: {
      domain_id_or_custom_id: ORGANIZATION_ID,
    },
    response: conjoinSuccess(organizationFixture({ name: 'Renamed organization' })),
    run: context => createCloudOrganizations(context.client).update(ORGANIZATION_ID, updateOrganizationBody),
    assertResult: result => expect(result).toEqual(organizationFixture({ name: 'Renamed organization' })),
  },
  {
    name: 'lists organizations',
    method: 'GET',
    path: '/v1/cloud/organization/',
    expectedQuery: {
      'cursor[next]': 'cursor_next_123',
      limit: '1',
      'query[name]': 'Demo organization',
      'sort[date_created]': 'desc',
    },
    response: conjoinList([organizationFixture()]),
    run: context =>
      createCloudOrganizations(context.client).read({
        cursor: { next: 'cursor_next_123' },
        limit: 1,
        query: { name: 'Demo organization' },
        sort: { date_created: 'desc' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [organizationFixture()] }),
  },
])

describeCloudSdkContractCases('Cloud plan SDK contract integration', [
  {
    name: 'lists cloud plans',
    method: 'GET',
    path: '/v1/cloud/plan/many',
    expectedQuery: {
      'cursor[next]': 'cursor_next_123',
      limit: '1',
      'query[currency]': 'usd',
      'query[slug]': 'starter',
      'query[status]': 'active',
      'sort[date_created]': 'desc',
    },
    response: conjoinList([planFixture()]),
    run: context =>
      createCloudPlans(context.client).list({
        cursor: { next: 'cursor_next_123' },
        limit: 1,
        query: { currency: 'usd', slug: 'starter', status: 'active' },
        sort: { date_created: 'desc' },
      }),
    assertResult: result => expect(result).toMatchObject({ data: [planFixture()] }),
  },
  {
    name: 'reads a cloud plan',
    method: 'GET',
    path: '/v1/cloud/plan/single/{slug}',
    expectedPath: '/v1/cloud/plan/single/starter',
    expectedPathParams: {
      slug: 'starter',
    },
    response: conjoinSuccess(planFixture()),
    run: context => createCloudPlans(context.client).read('starter'),
    assertResult: result => expect(result).toEqual(planFixture()),
  },
  {
    name: 'reads the account plan',
    method: 'GET',
    path: '/v1/cloud/plan/account',
    response: conjoinSuccess(planFixture({ slug: 'business' })),
    run: context => createCloudPlans(context.client).readAccount(),
    assertResult: result => expect(result).toEqual(planFixture({ slug: 'business' })),
  },
])
