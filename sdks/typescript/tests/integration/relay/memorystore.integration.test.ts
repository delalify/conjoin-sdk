import { expect } from 'vitest'
import { createRelayMemorystores } from '../../../src/relay'
import { conjoinList, conjoinSuccess } from '../contract-server/response-fixtures'
import {
  CLUSTER_ID,
  describeRelaySdkContractCases,
  REQUEST_ID,
  relayExpectedListQuery,
  relayListQuery,
  relayMemorystoreClusterFixture,
} from './relay-test-utils'

const createClusterBody = {
  cluster_type: 'shared' as const,
  max_memory_mb: 128,
  name: 'Contract cache',
  reference_id: 'cache_reference_123',
}
const updateClusterBody = {
  max_memory_mb: 256,
  name: 'Renamed cache',
}
const commandBody = {
  args: ['contract-key'],
  command: 'GET',
}

describeRelaySdkContractCases('Relay memorystore SDK contract integration', [
  {
    name: 'creates a memorystore cluster',
    method: 'POST',
    path: '/v1/relay/memorystore/clusters/create',
    expectedBody: createClusterBody,
    response: conjoinSuccess(relayMemorystoreClusterFixture(), {
      requestId: REQUEST_ID,
      status: 201,
    }),
    run: context => createRelayMemorystores(context.client).createCluster(createClusterBody),
    assertResult: result => expect(result).toEqual(relayMemorystoreClusterFixture()),
  },
  {
    name: 'reads memorystore clusters',
    method: 'GET',
    path: '/v1/relay/memorystore/clusters',
    expectedQuery: relayExpectedListQuery,
    expectedRawBody: '',
    response: conjoinList([relayMemorystoreClusterFixture()], {
      cursor: {
        next: 'cursor_next_123',
      },
      requestId: REQUEST_ID,
    }),
    run: context => createRelayMemorystores(context.client).readClusters(relayListQuery),
    assertResult: result =>
      expect(result).toEqual({
        success: true,
        data: [relayMemorystoreClusterFixture()],
        cursor: {
          next: 'cursor_next_123',
        },
        status: 200,
      }),
  },
  {
    name: 'reads a memorystore cluster',
    method: 'GET',
    path: '/v1/relay/memorystore/clusters/{cluster_id}',
    expectedPath: `/v1/relay/memorystore/clusters/${CLUSTER_ID}`,
    expectedPathParams: {
      cluster_id: CLUSTER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayMemorystoreClusterFixture(), { requestId: REQUEST_ID }),
    run: context => createRelayMemorystores(context.client).readCluster(CLUSTER_ID),
    assertResult: result => expect(result).toEqual(relayMemorystoreClusterFixture()),
  },
  {
    name: 'updates a memorystore cluster',
    method: 'PATCH',
    path: '/v1/relay/memorystore/clusters/{cluster_id}/update',
    expectedBody: updateClusterBody,
    expectedPath: `/v1/relay/memorystore/clusters/${CLUSTER_ID}/update`,
    expectedPathParams: {
      cluster_id: CLUSTER_ID,
    },
    response: conjoinSuccess(relayMemorystoreClusterFixture({ max_memory_mb: 256, name: 'Renamed cache' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createRelayMemorystores(context.client).updateCluster(CLUSTER_ID, updateClusterBody),
    assertResult: result =>
      expect(result).toEqual(relayMemorystoreClusterFixture({ max_memory_mb: 256, name: 'Renamed cache' })),
  },
  {
    name: 'suspends a memorystore cluster',
    method: 'POST',
    path: '/v1/relay/memorystore/clusters/{cluster_id}/suspend',
    expectedPath: `/v1/relay/memorystore/clusters/${CLUSTER_ID}/suspend`,
    expectedPathParams: {
      cluster_id: CLUSTER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayMemorystoreClusterFixture({ status: 'suspended' }), { requestId: REQUEST_ID }),
    run: context => createRelayMemorystores(context.client).suspendCluster(CLUSTER_ID),
    assertResult: result => expect(result).toEqual(relayMemorystoreClusterFixture({ status: 'suspended' })),
  },
  {
    name: 'deletes a memorystore cluster',
    method: 'DELETE',
    path: '/v1/relay/memorystore/clusters/{cluster_id}/delete',
    expectedPath: `/v1/relay/memorystore/clusters/${CLUSTER_ID}/delete`,
    expectedPathParams: {
      cluster_id: CLUSTER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(relayMemorystoreClusterFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => createRelayMemorystores(context.client).deleteCluster(CLUSTER_ID),
    assertResult: result => expect(result).toEqual(relayMemorystoreClusterFixture({ status: 'deleted' })),
  },
  {
    name: 'executes a memorystore command',
    method: 'POST',
    path: '/v1/relay/memorystore/clusters/{cluster_id}/command',
    expectedBody: commandBody,
    expectedPath: `/v1/relay/memorystore/clusters/${CLUSTER_ID}/command`,
    expectedPathParams: {
      cluster_id: CLUSTER_ID,
    },
    response: conjoinSuccess(
      {
        result: 'contract-value',
      },
      { requestId: REQUEST_ID },
    ),
    run: context => createRelayMemorystores(context.client).executeCommand(CLUSTER_ID, commandBody),
    assertResult: result =>
      expect(result).toEqual({
        result: 'contract-value',
      }),
  },
])
