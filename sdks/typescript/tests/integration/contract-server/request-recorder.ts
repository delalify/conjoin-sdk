import type { IncomingHttpHeaders } from 'node:http'

export type RecordedContractRequest = {
  id: number
  method: string
  path: string
  pathTemplate?: string
  pathParams: Record<string, string>
  query: Record<string, string | string[]>
  headers: Record<string, string | string[]>
  body: unknown
  rawBody: string
}

export class ContractRequestRecorder {
  #requests: RecordedContractRequest[] = []
  #nextId = 1

  record(request: Omit<RecordedContractRequest, 'id'>): RecordedContractRequest {
    const recordedRequest = Object.freeze({
      ...request,
      id: this.#nextId,
    })

    this.#nextId += 1
    this.#requests.push(recordedRequest)

    return recordedRequest
  }

  all(): RecordedContractRequest[] {
    return [...this.#requests]
  }

  last(): RecordedContractRequest | undefined {
    return this.#requests.at(-1)
  }

  clear(): void {
    this.#requests = []
    this.#nextId = 1
  }
}

export const normalizeHeaders = (headers: IncomingHttpHeaders): Record<string, string | string[]> =>
  Object.fromEntries(
    Object.entries(headers).flatMap(([name, value]) => {
      if (value === undefined) {
        return []
      }

      return [[name.toLowerCase(), value]]
    }),
  )

export const normalizeQuery = (searchParams: URLSearchParams): Record<string, string | string[]> => {
  const query: Record<string, string | string[]> = {}

  for (const [name, value] of searchParams) {
    const existingValue = query[name]

    if (existingValue === undefined) {
      query[name] = value
      continue
    }

    if (Array.isArray(existingValue)) {
      existingValue.push(value)
      continue
    }

    query[name] = [existingValue, value]
  }

  return query
}
