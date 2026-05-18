export const CONJOIN_REQUEST_ID_HEADER = 'Conjoin-Request-Id'

const CONJOIN_REQUEST_ID_PREFIX = 'cnj_req_'
const CONJOIN_REQUEST_ID_PATTERN = /^cnj_req_[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export type HeaderMapLike =
  | Headers
  | Record<string, string | string[] | undefined>
  | {
      get(name: string): string | null | undefined
    }

type HeadersGetter = {
  get(name: string): string | null | undefined
}

type UuidV7State = {
  msecs: number
  seq: number
}

const uuidV7State: UuidV7State = {
  msecs: Number.NEGATIVE_INFINITY,
  seq: 0,
}

const getCrypto = (): Crypto => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Conjoin request ID generation requires crypto.getRandomValues')
  }

  return globalThis.crypto
}

const byteToHex = (value: number): string => value.toString(16).padStart(2, '0')

const updateUuidV7State = (state: UuidV7State, now: number, randomBytes: Uint8Array): UuidV7State => {
  if (now > state.msecs) {
    state.seq = (randomBytes[6] << 23) | (randomBytes[7] << 16) | (randomBytes[8] << 8) | randomBytes[9]
    state.msecs = now

    return state
  }

  state.seq = (state.seq + 1) | 0

  if (state.seq === 0) {
    state.msecs += 1
  }

  return state
}

const generateUuidV7 = (): string => {
  const randomBytes = getCrypto().getRandomValues(new Uint8Array(16))
  const state = updateUuidV7State(uuidV7State, Date.now(), randomBytes)
  const bytes = new Uint8Array(16)

  bytes[0] = Math.trunc(state.msecs / 0x10000000000) & 0xff
  bytes[1] = Math.trunc(state.msecs / 0x100000000) & 0xff
  bytes[2] = Math.trunc(state.msecs / 0x1000000) & 0xff
  bytes[3] = Math.trunc(state.msecs / 0x10000) & 0xff
  bytes[4] = Math.trunc(state.msecs / 0x100) & 0xff
  bytes[5] = state.msecs & 0xff
  bytes[6] = 0x70 | ((state.seq >>> 28) & 0x0f)
  bytes[7] = (state.seq >>> 20) & 0xff
  bytes[8] = 0x80 | ((state.seq >>> 14) & 0x3f)
  bytes[9] = (state.seq >>> 6) & 0xff
  bytes[10] = ((state.seq << 2) & 0xff) | (randomBytes[10] & 0x03)
  bytes[11] = randomBytes[11]
  bytes[12] = randomBytes[12]
  bytes[13] = randomBytes[13]
  bytes[14] = randomBytes[14]
  bytes[15] = randomBytes[15]

  const hex = Array.from(bytes, byteToHex).join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export const generateConjoinRequestId = (): string => {
  return `${CONJOIN_REQUEST_ID_PREFIX}${generateUuidV7()}`
}

export const isValidConjoinRequestId = (value: unknown): value is string => {
  return typeof value === 'string' && CONJOIN_REQUEST_ID_PATTERN.test(value)
}

export const resolveConjoinRequestId = (value?: string | null): string => {
  if (isValidConjoinRequestId(value)) {
    return value
  }

  return generateConjoinRequestId()
}

const hasHeadersGetter = (headers: HeaderMapLike): headers is HeadersGetter => {
  return typeof (headers as { get?: unknown }).get === 'function'
}

const readHeadersGet = (headers: HeadersGetter): string | undefined => {
  return headers.get(CONJOIN_REQUEST_ID_HEADER) ?? headers.get(CONJOIN_REQUEST_ID_HEADER.toLowerCase()) ?? undefined
}

export const getConjoinRequestIdFromHeaders = (headers?: HeaderMapLike | null): string | undefined => {
  if (!headers) {
    return undefined
  }

  if (hasHeadersGetter(headers)) {
    const value = readHeadersGet(headers)

    return isValidConjoinRequestId(value) ? value : undefined
  }

  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() !== CONJOIN_REQUEST_ID_HEADER.toLowerCase()) {
      continue
    }

    const firstValue = Array.isArray(value) ? value[0] : value

    return isValidConjoinRequestId(firstValue) ? firstValue : undefined
  }

  return undefined
}
