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

const CONTENT_DISPOSITION_NAME = /name="([^"]*)"/

const parseBoundary = (contentType: string | string[] | undefined): string => {
  const value = Array.isArray(contentType) ? contentType.join(',') : (contentType ?? '')
  const match = /boundary=("?)([^";,]+)\1/i.exec(value)

  if (match === null) {
    throw new Error(`Recorded request is not multipart/form-data: ${value || '<missing content-type>'}`)
  }

  return match[2]
}

/**
 * Parses a recorded multipart/form-data body into a field map. Each field maps
 * to the ordered list of its part values so a repeated field (an array sent as
 * one part per element) is asserted exactly, matching how the SDK serializes a
 * FormData payload.
 */
export const parseMultipartFields = (request: RecordedContractRequest): Record<string, string[]> => {
  const boundary = parseBoundary(request.headers['content-type'])
  const segments = request.rawBody.split(`--${boundary}`)
  const fields: Record<string, string[]> = {}

  for (const segment of segments) {
    const separatorIndex = segment.indexOf('\r\n\r\n')

    if (separatorIndex === -1) {
      continue
    }

    const rawHeaders = segment.slice(0, separatorIndex)
    const nameMatch = CONTENT_DISPOSITION_NAME.exec(rawHeaders)

    if (nameMatch === null) {
      continue
    }

    const name = nameMatch[1]
    const value = segment.slice(separatorIndex + 4).replace(/\r\n$/, '')
    const existing = fields[name]

    if (existing === undefined) {
      fields[name] = [value]
      continue
    }

    existing.push(value)
  }

  return fields
}

export const expectMultipartFields = (
  request: RecordedContractRequest,
  expectedFields: Record<string, string[]>,
): void => {
  expect(parseMultipartFields(request)).toEqual(expectedFields)
}
