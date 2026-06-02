import { expect } from 'vitest'
import { extractMultipartBoundary, parseMultipartBody } from './multipart-parser'
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

export const parseMultipartFields = (request: RecordedContractRequest): Record<string, string[]> => {
  const contentType = request.headers['content-type']
  const boundary = extractMultipartBoundary(contentType)

  if (boundary === undefined) {
    const value = Array.isArray(contentType) ? contentType.join(',') : (contentType ?? '')
    throw new Error(`Recorded request is not multipart/form-data: ${value || '<missing content-type>'}`)
  }

  return parseMultipartBody(request.rawBody, boundary)
}

export const expectMultipartFields = (
  request: RecordedContractRequest,
  expectedFields: Record<string, string[]>,
): void => {
  expect(parseMultipartFields(request)).toEqual(expectedFields)
}
