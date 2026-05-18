import { afterEach, describe, expect, it } from 'vitest'
import { expectContractRequest, expectHeader, expectJsonBody, expectQuery } from '../contract-server/assertions'
import type { ConjoinContractServer } from '../contract-server/conjoin-contract-server'
import type { RecordedContractRequest } from '../contract-server/request-recorder'
import type { ContractResponse } from '../contract-server/response-fixtures'
import type { ContractRouteHandler } from '../contract-server/route-registry'

export type SdkContractTestContext = {
  server: ConjoinContractServer
}

export type SdkContractCase<TContext extends SdkContractTestContext, TResult = unknown> = {
  name: string
  method: string
  path: string
  response: ContractResponse | ContractRouteHandler
  run: (context: TContext) => Promise<TResult>
  assertResult: (result: TResult) => void | Promise<void>
  assertRequest?: (request: RecordedContractRequest) => void | Promise<void>
  expectedBody?: unknown
  expectedHeaders?: Record<string, string>
  expectedPath?: string
  expectedPathParams?: Record<string, string>
  expectedQuery?: Record<string, string | string[]>
  expectedRawBody?: string
}

export type DescribeSdkContractCasesOptions<TContext extends SdkContractTestContext> = {
  cases: SdkContractCase<TContext>[]
  defaultExpectedHeaders?: Record<string, string>
  startContext: () => Promise<TContext>
  suiteName: string
}

export const describeSdkContractCases = <TContext extends SdkContractTestContext>({
  cases,
  defaultExpectedHeaders,
  startContext,
  suiteName,
}: DescribeSdkContractCasesOptions<TContext>): void => {
  describe(suiteName, () => {
    let server: ConjoinContractServer | undefined

    afterEach(async () => {
      await server?.stop()
      server = undefined
    })

    it.each(cases)('$name', async testCase => {
      const context = await startContext()
      server = context.server
      server.register({
        method: testCase.method,
        path: testCase.path,
        handler: createRouteHandler(testCase.response),
      })

      const result = await testCase.run(context)

      await testCase.assertResult(result)

      const request = expectContractRequest(server.recorder.last())

      expectRequestToMatchCase(request, testCase)
      expectHeaders(request, {
        ...defaultExpectedHeaders,
        ...testCase.expectedHeaders,
      })
      await testCase.assertRequest?.(request)
    })
  })
}

const createRouteHandler = (response: ContractResponse | ContractRouteHandler): ContractRouteHandler => {
  if (typeof response === 'function') {
    return response
  }

  return () => response
}

const expectRequestToMatchCase = <TContext extends SdkContractTestContext>(
  request: RecordedContractRequest,
  testCase: SdkContractCase<TContext>,
): void => {
  expect(request).toMatchObject({
    method: testCase.method.toUpperCase(),
    path: testCase.expectedPath ?? testCase.path,
    pathParams: testCase.expectedPathParams ?? {},
    pathTemplate: testCase.path,
  })
  expectQuery(request, testCase.expectedQuery ?? {})

  if (hasExpectedBody(testCase)) {
    expectJsonBody(request, testCase.expectedBody)
  }

  if (testCase.expectedRawBody !== undefined) {
    expect(request.rawBody).toBe(testCase.expectedRawBody)
  }
}

const expectHeaders = (request: RecordedContractRequest, headers: Record<string, string>): void => {
  for (const [name, value] of Object.entries(headers)) {
    expectHeader(request, name, value)
  }
}

const hasExpectedBody = <TContext extends SdkContractTestContext>(testCase: SdkContractCase<TContext>): boolean =>
  Object.hasOwn(testCase, 'expectedBody')
