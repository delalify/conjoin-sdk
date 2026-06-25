import { expect } from 'vitest'
import { createCloudPublishableKeys, createCloudRoles, createCloudSKUCatalogs } from '../../../src/cloud'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  describeCloudSdkContractCases,
  PROJECT_ID,
  publishableKeyFixture,
  ROLE_ID,
  roleFixture,
  skuCatalogFixture,
} from './cloud-test-utils'

const PUBLISHABLE_KEY_ID = 'publishable_key_123'
const PUBLISHABLE_KEY_UPDATED_AT = '2026-05-16T01:00:00.000Z'
const PUBLISHABLE_KEY_REVOKED_AT = '2026-05-16T01:00:00.000Z'
const updateDomainsBody = { allowed_domains: ['example.com', 'app.example.com'] }
const createRoleBody = {
  name: 'project.admin',
  permissions: ['cloud.project.read'],
  project_id: PROJECT_ID,
  title: 'Project Admin',
}
const updateRoleBody = {
  permissions: ['cloud.project.read'],
  title: 'Updated Role',
}

describeCloudSdkContractCases('Cloud publishable key SDK contract integration', [
  {
    name: 'creates a publishable key',
    method: 'POST',
    path: '/v1/cloud/publishable-key/new',
    response: conjoinSuccess(publishableKeyFixture()),
    run: context => createCloudPublishableKeys(context.client).create(),
    assertResult: result => expect(result).toEqual(publishableKeyFixture()),
  },
  {
    name: 'lists publishable keys',
    method: 'GET',
    path: '/v1/cloud/publishable-key/',
    response: conjoinList([publishableKeyFixture()]),
    run: context => createCloudPublishableKeys(context.client).list(),
    assertResult: result => expect(result).toMatchObject({ data: [publishableKeyFixture()] }),
  },
  {
    name: 'rotates a publishable key',
    method: 'POST',
    path: '/v1/cloud/publishable-key/{publishable_key_id}/rotate',
    expectedPath: `/v1/cloud/publishable-key/${PUBLISHABLE_KEY_ID}/rotate`,
    expectedPathParams: {
      publishable_key_id: PUBLISHABLE_KEY_ID,
    },
    response: conjoinSuccess(publishableKeyFixture({ date_updated: PUBLISHABLE_KEY_UPDATED_AT })),
    run: context => createCloudPublishableKeys(context.client).rotate(PUBLISHABLE_KEY_ID),
    assertResult: result => expect(result).toEqual(publishableKeyFixture({ date_updated: PUBLISHABLE_KEY_UPDATED_AT })),
  },
  {
    name: 'updates publishable key domains',
    method: 'PATCH',
    path: '/v1/cloud/publishable-key/{publishable_key_id}/domains',
    expectedBody: updateDomainsBody,
    expectedPath: `/v1/cloud/publishable-key/${PUBLISHABLE_KEY_ID}/domains`,
    expectedPathParams: {
      publishable_key_id: PUBLISHABLE_KEY_ID,
    },
    response: conjoinSuccess(publishableKeyFixture({ allowed_domains: ['example.com', 'app.example.com'] })),
    run: context => createCloudPublishableKeys(context.client).updateDomains(PUBLISHABLE_KEY_ID, updateDomainsBody),
    assertResult: result =>
      expect(result).toEqual(publishableKeyFixture({ allowed_domains: ['example.com', 'app.example.com'] })),
  },
  {
    name: 'revokes a publishable key',
    method: 'DELETE',
    path: '/v1/cloud/publishable-key/{publishable_key_id}',
    expectedPath: `/v1/cloud/publishable-key/${PUBLISHABLE_KEY_ID}`,
    expectedPathParams: {
      publishable_key_id: PUBLISHABLE_KEY_ID,
    },
    response: conjoinSuccess(
      publishableKeyFixture({
        date_revoked: PUBLISHABLE_KEY_REVOKED_AT,
        is_active: false,
      }),
    ),
    run: context => createCloudPublishableKeys(context.client).revoke(PUBLISHABLE_KEY_ID),
    assertResult: result =>
      expect(result).toEqual(
        publishableKeyFixture({
          date_revoked: PUBLISHABLE_KEY_REVOKED_AT,
          is_active: false,
        }),
      ),
  },
])

describeCloudSdkContractCases('Cloud role SDK contract integration', [
  {
    name: 'creates a custom role',
    method: 'POST',
    path: '/v1/cloud/custom-role/new',
    expectedBody: createRoleBody,
    response: conjoinSuccess(roleFixture(), { status: 201 }),
    run: context => createCloudRoles(context.client).create(createRoleBody),
    assertResult: result => expect(result).toEqual(roleFixture()),
  },
  {
    name: 'lists custom roles',
    method: 'GET',
    path: '/v1/cloud/custom-role/many',
    response: conjoinList([roleFixture()]),
    run: context => createCloudRoles(context.client).read(),
    assertResult: result => expect(result).toMatchObject({ data: [roleFixture()] }),
  },
  {
    name: 'updates a custom role',
    method: 'PUT',
    path: '/v1/cloud/custom-role/update/{role_id}',
    expectedBody: updateRoleBody,
    expectedPath: `/v1/cloud/custom-role/update/${ROLE_ID}`,
    expectedPathParams: {
      role_id: ROLE_ID,
    },
    response: conjoinSuccess(roleFixture({ title: 'Updated Role' })),
    run: context => createCloudRoles(context.client).update(ROLE_ID, updateRoleBody),
    assertResult: result => expect(result).toEqual(roleFixture({ title: 'Updated Role' })),
  },
])

describeCloudSdkContractCases('Cloud SKU catalog SDK contract integration', [
  {
    name: 'lists SKU catalog entries',
    method: 'GET',
    path: '/v1/cloud/sku-catalog/many',
    response: conjoinList([skuCatalogFixture()]),
    run: context => createCloudSKUCatalogs(context.client).readSkuCatalog(),
    assertResult: result => expect(result).toMatchObject({ data: [skuCatalogFixture()] }),
  },
  {
    name: 'reads a single SKU catalog entry',
    method: 'GET',
    path: '/v1/cloud/sku-catalog/single/{slug}',
    expectedPath: '/v1/cloud/sku-catalog/single/cloud.compute',
    expectedPathParams: {
      slug: 'cloud.compute',
    },
    response: conjoinSuccess(skuCatalogFixture()),
    run: context => createCloudSKUCatalogs(context.client).readSingleSkuCatalog('cloud.compute'),
    assertResult: result => expect(result).toEqual(skuCatalogFixture()),
  },
])
