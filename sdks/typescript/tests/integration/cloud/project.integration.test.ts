import { expect } from 'vitest'
import { createCloudProjects } from '../../../src/cloud'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import { describeCloudSdkContractCases, PROJECT_ID, projectFixture, REQUEST_ID } from './cloud-test-utils'

const DOMAIN_ID = 'domain_123'
const createProjectBody = {
  custom_id: 'project_custom_123',
  name: 'Demo project',
  tags: ['contract', 'cloud'],
}
const updateProjectBody = {
  name: 'Renamed project',
  tags: ['contract'],
}

describeCloudSdkContractCases('Cloud project SDK contract integration', [
  {
    name: 'creates a cloud project',
    method: 'POST',
    path: '/v1/cloud/project/{domain_id}/new',
    expectedBody: createProjectBody,
    expectedPath: `/v1/cloud/project/${DOMAIN_ID}/new`,
    expectedPathParams: {
      domain_id: DOMAIN_ID,
    },
    response: conjoinSuccess(projectFixture({ name: 'Demo project' }), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createCloudProjects(context.client).create(DOMAIN_ID, createProjectBody),
    assertResult: result => expect(result).toEqual(projectFixture({ name: 'Demo project' })),
  },
  {
    name: 'updates a cloud project',
    method: 'PATCH',
    path: '/v1/cloud/project/update-info',
    expectedBody: updateProjectBody,
    response: conjoinSuccess(projectFixture({ name: 'Renamed project' }), { requestId: REQUEST_ID }),
    run: context => createCloudProjects(context.client).update(updateProjectBody),
    assertResult: result => expect(result).toEqual(projectFixture({ name: 'Renamed project' })),
  },
  {
    name: 'reads a cloud project',
    method: 'GET',
    path: '/v1/cloud/project/public/single/{project_id}',
    expectedPath: `/v1/cloud/project/public/single/${PROJECT_ID}`,
    expectedPathParams: {
      project_id: PROJECT_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(projectFixture(), { requestId: REQUEST_ID }),
    run: context => createCloudProjects(context.client).read(PROJECT_ID),
    assertResult: result => expect(result).toEqual(projectFixture()),
  },
  {
    name: 'lists cloud projects',
    method: 'GET',
    path: '/v1/cloud/project/many/{domain_id}',
    expectedPath: `/v1/cloud/project/many/${DOMAIN_ID}`,
    expectedPathParams: {
      domain_id: DOMAIN_ID,
    },
    expectedQuery: {
      'cursor[next]': 'cursor_next_123',
      limit: '2',
      'query[name]': 'Demo project',
      'sort[date_created]': 'desc',
    },
    expectedRawBody: '',
    response: conjoinList([projectFixture(), projectFixture({ project_id: 'project_456' })], {
      cursor: {
        next: 'cursor_next_123',
        prev: 'cursor_prev_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context =>
      createCloudProjects(context.client).list(DOMAIN_ID, {
        cursor: {
          next: 'cursor_next_123',
        },
        limit: 2,
        query: {
          name: 'Demo project',
        },
        sort: {
          date_created: 'desc',
        },
      }),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [projectFixture(), projectFixture({ project_id: 'project_456' })],
        cursor: {
          next: 'cursor_next_123',
          prev: 'cursor_prev_123',
        },
        status: 200,
      }),
  },
])
