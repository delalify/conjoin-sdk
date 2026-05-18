import { expect } from 'vitest'
import type { RecordedContractRequest } from './request-recorder'

export const expectContractRequest = (request: RecordedContractRequest | undefined): RecordedContractRequest => {
  expect(request).toBeDefined()

  if (request === undefined) {
    throw new Error('Expected contract server to receive a request')
  }

  return request
}

export const expectHeader = (request: RecordedContractRequest, name: string, expectedValue: string): void => {
  expect(request.headers[name.toLowerCase()]).toBe(expectedValue)
}

export const expectJsonBody = <T>(request: RecordedContractRequest, expectedBody: T): void => {
  expect(request.body).toEqual(expectedBody)
}

export const expectQuery = (
  request: RecordedContractRequest,
  expectedQuery: Record<string, string | string[]>,
): void => {
  expect(request.query).toEqual(expectedQuery)
}
