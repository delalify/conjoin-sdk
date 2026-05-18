import { expect } from 'vitest'
import { createMessagingSMSSenderPools } from '../../../src/messaging'
import { conjoinSuccess } from '../contract-server/response-fixtures'
import {
  describeMessagingSdkContractCases,
  messagingSmsSenderFixture,
  messagingSmsSenderPoolFixture,
  REQUEST_ID,
  SMS_POOL_ID,
  SMS_SENDER_ID,
} from './messaging-test-utils'

const smsSenderCreateBody = {
  capability: 'sms_messages',
  sender: 'CONJOIN',
  sender_type: 'alphanumeric',
  supported_countries: ['US'],
} as const
const smsSenderPoolCreateBody = {
  capability: 'sms_messages' as const,
  senders: [SMS_SENDER_ID],
  title: 'Contract SMS pool',
}
const smsSenderPoolAddBody = {
  senders: [SMS_SENDER_ID],
}

describeMessagingSdkContractCases('Messaging SMS sender pool SDK contract integration', [
  {
    name: 'creates an SMS sender pool',
    method: 'POST',
    path: '/v1/messaging/sms/sender-pools/new',
    expectedBody: smsSenderPoolCreateBody,
    response: conjoinSuccess(messagingSmsSenderPoolFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => createMessagingSMSSenderPools(context.profiledClient).createSmsSenderPool(smsSenderPoolCreateBody),
    assertResult: result => expect(result).toEqual(messagingSmsSenderPoolFixture()),
  },
  {
    name: 'adds SMS senders to a pool',
    method: 'POST',
    path: '/v1/messaging/sms/sender-pools/{pool_id}/senders',
    expectedBody: smsSenderPoolAddBody,
    expectedPath: `/v1/messaging/sms/sender-pools/${SMS_POOL_ID}/senders`,
    expectedPathParams: {
      pool_id: SMS_POOL_ID,
    },
    response: conjoinSuccess(messagingSmsSenderPoolFixture(), { requestId: REQUEST_ID }),
    run: context =>
      createMessagingSMSSenderPools(context.profiledClient).addSmsSendersToPool(SMS_POOL_ID, smsSenderPoolAddBody),
    assertResult: result => expect(result).toEqual(messagingSmsSenderPoolFixture()),
  },
  {
    name: 'gets an SMS sender pool',
    method: 'GET',
    path: '/v1/messaging/sms/sender-pools/{pool_id}',
    expectedPath: `/v1/messaging/sms/sender-pools/${SMS_POOL_ID}`,
    expectedPathParams: {
      pool_id: SMS_POOL_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsSenderPoolFixture(), { requestId: REQUEST_ID }),
    run: context => createMessagingSMSSenderPools(context.profiledClient).getSmsSenderPool(SMS_POOL_ID),
    assertResult: result => expect(result).toEqual(messagingSmsSenderPoolFixture()),
  },
  {
    name: 'deletes an SMS sender pool',
    method: 'DELETE',
    path: '/v1/messaging/sms/sender-pools/{pool_id}',
    expectedPath: `/v1/messaging/sms/sender-pools/${SMS_POOL_ID}`,
    expectedPathParams: {
      pool_id: SMS_POOL_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsSenderPoolFixture({ date_deleted: '2026-05-16T02:00:00.000Z' }), {
      requestId: REQUEST_ID,
    }),
    run: context => createMessagingSMSSenderPools(context.profiledClient).deleteSmsSenderPool(SMS_POOL_ID),
    assertResult: result =>
      expect(result).toEqual(messagingSmsSenderPoolFixture({ date_deleted: '2026-05-16T02:00:00.000Z' })),
  },
])

describeMessagingSdkContractCases('Messaging SMS sender SDK contract integration', [
  {
    name: 'creates an SMS sender',
    method: 'POST',
    path: '/v1/messaging/sms/senders/new',
    expectedBody: smsSenderCreateBody,
    response: conjoinSuccess(messagingSmsSenderFixture(), { requestId: REQUEST_ID, status: 201 }),
    run: context => context.messaging.smsSenders.createSmsSender(smsSenderCreateBody),
    assertResult: result => expect(result).toEqual(messagingSmsSenderFixture()),
  },
  {
    name: 'enables an SMS sender',
    method: 'PATCH',
    path: '/v1/messaging/sms/senders/{sender_id}/enable',
    expectedPath: `/v1/messaging/sms/senders/${SMS_SENDER_ID}/enable`,
    expectedPathParams: {
      sender_id: SMS_SENDER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsSenderFixture({ status: 'active' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.smsSenders.enableSmsSender(SMS_SENDER_ID),
    assertResult: result => expect(result).toEqual(messagingSmsSenderFixture({ status: 'active' })),
  },
  {
    name: 'disables an SMS sender',
    method: 'PATCH',
    path: '/v1/messaging/sms/senders/{sender_id}/disable',
    expectedPath: `/v1/messaging/sms/senders/${SMS_SENDER_ID}/disable`,
    expectedPathParams: {
      sender_id: SMS_SENDER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsSenderFixture({ status: 'disabled' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.smsSenders.disableSmsSender(SMS_SENDER_ID),
    assertResult: result => expect(result).toEqual(messagingSmsSenderFixture({ status: 'disabled' })),
  },
  {
    name: 'lists one SMS sender',
    method: 'GET',
    path: '/v1/messaging/sms/senders/{sender_id}',
    expectedPath: `/v1/messaging/sms/senders/${SMS_SENDER_ID}`,
    expectedPathParams: {
      sender_id: SMS_SENDER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsSenderFixture(), { requestId: REQUEST_ID }),
    run: context => context.messaging.smsSenders.listSmsSender(SMS_SENDER_ID),
    assertResult: result => expect(result).toEqual(messagingSmsSenderFixture()),
  },
  {
    name: 'deletes an SMS sender',
    method: 'DELETE',
    path: '/v1/messaging/sms/senders/{sender_id}',
    expectedPath: `/v1/messaging/sms/senders/${SMS_SENDER_ID}`,
    expectedPathParams: {
      sender_id: SMS_SENDER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsSenderFixture({ status: 'deleted' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.smsSenders.deleteSmsSender(SMS_SENDER_ID),
    assertResult: result => expect(result).toEqual(messagingSmsSenderFixture({ status: 'deleted' })),
  },
  {
    name: 'updates one SMS sender',
    method: 'PATCH',
    path: '/v1/messaging/sms/senders/{sender_id}',
    expectedPath: `/v1/messaging/sms/senders/${SMS_SENDER_ID}`,
    expectedPathParams: {
      sender_id: SMS_SENDER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsSenderFixture({ sender: 'CONJOIN2' }), { requestId: REQUEST_ID }),
    run: context => context.messaging.smsSenders.updateOneSmsSender(SMS_SENDER_ID),
    assertResult: result => expect(result).toEqual(messagingSmsSenderFixture({ sender: 'CONJOIN2' })),
  },
  {
    name: 'transfers an SMS sender',
    method: 'PATCH',
    path: '/v1/messaging/sms/senders/transfers/{sender_id}/{project_id}',
    expectedPath: `/v1/messaging/sms/senders/transfers/${SMS_SENDER_ID}/project_456`,
    expectedPathParams: {
      project_id: 'project_456',
      sender_id: SMS_SENDER_ID,
    },
    expectedRawBody: '',
    response: conjoinSuccess(messagingSmsSenderFixture({ conjoin_project_id: 'project_456' }), {
      requestId: REQUEST_ID,
    }),
    run: context => context.messaging.smsSenders.transferSmsSender(SMS_SENDER_ID, 'project_456'),
    assertResult: result => expect(result).toEqual(messagingSmsSenderFixture({ conjoin_project_id: 'project_456' })),
  },
])
