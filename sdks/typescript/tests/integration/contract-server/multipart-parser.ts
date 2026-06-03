const CONTENT_DISPOSITION_NAME = /name="([^"]*)"/
const BOUNDARY = /boundary=("?)([^";,]+)\1/i

const MAX_MULTIPART_FIELDS = 512

export const extractMultipartBoundary = (contentType: string | string[] | undefined): string | undefined => {
  const value = Array.isArray(contentType) ? contentType.join(',') : (contentType ?? '')
  const match = BOUNDARY.exec(value)

  if (match === null) {
    return undefined
  }

  return match[2]
}

export const isMultipartFormData = (contentType: string | string[] | undefined): boolean => {
  const value = Array.isArray(contentType) ? contentType.join(',') : (contentType ?? '')

  return value.toLowerCase().includes('multipart/form-data')
}

/**
 * Parses a raw multipart/form-data body into a field map. Each field maps to the
 * ordered list of its part values so a repeated field (an array sent as one part
 * per element) is preserved exactly, matching how the SDK serializes FormData.
 * The field count is capped so a hostile body cannot grow the map without bound.
 */
export const parseMultipartBody = (rawBody: string, boundary: string): Record<string, string[]> => {
  const segments = rawBody.split(`--${boundary}`)
  const fields: Record<string, string[]> = {}
  let fieldCount = 0

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

    if (isUnsafeFieldName(name)) {
      continue
    }

    const value = segment.slice(separatorIndex + 4).replace(/\r\n$/, '')
    const existing = fields[name]

    if (existing === undefined) {
      if (fieldCount >= MAX_MULTIPART_FIELDS) {
        break
      }

      fields[name] = [value]
      fieldCount += 1
      continue
    }

    existing.push(value)
  }

  return fields
}

const isUnsafeFieldName = (name: string): boolean =>
  name === '__proto__' || name === 'constructor' || name === 'prototype'
