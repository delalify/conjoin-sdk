const VALID_DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i

const FLOW_BASE_PATH = '/v1/auth/client'

export type FlowResponseStatus = 'complete' | 'mfa_required' | 'verification_required'

export type FlowResponseData = {
  status?: FlowResponseStatus
  account_id?: string
  session_id?: string
  state?: string
  verification_method?: 'pin_code' | 'magic_link'
  redirect_url?: string
  mfa?: { method: string }
}

export type HandshakeResponseData = {
  session_id: string
  account_id: string
  iat: number
  exp: number
  access_token_ttl_seconds: number
}

export type FlowApiResult<TData> =
  | { ok: true; status: number; data: TData | null; message: string | null }
  | { ok: false; status: number; data: null; message: string }

type FlowRequest = {
  headers: Record<string, string>
  body?: Record<string, unknown>
}

type ResponseEnvelope<TData> = {
  response?: { message?: unknown }
  data?: TData
}

function buildFlowUrl(authDomain: string, path: string): string {
  if (!VALID_DOMAIN_PATTERN.test(authDomain)) {
    throw new Error(`Invalid auth domain: ${authDomain}`)
  }
  return `https://${authDomain}${FLOW_BASE_PATH}${path}`
}

function messageFromEnvelope(envelope: ResponseEnvelope<unknown> | null, fallback: string): string {
  const message = envelope?.response?.message
  return typeof message === 'string' && message.length > 0 ? message : fallback
}

async function postFlow<TData>(authDomain: string, path: string, request: FlowRequest): Promise<FlowApiResult<TData>> {
  const response = await fetch(buildFlowUrl(authDomain, path), {
    method: 'POST',
    credentials: 'include',
    headers: request.headers,
    body: request.body ? JSON.stringify(request.body) : undefined,
  })

  let envelope: ResponseEnvelope<TData> | null = null
  try {
    envelope = (await response.json()) as ResponseEnvelope<TData>
  } catch {
    envelope = null
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: null,
      message: messageFromEnvelope(envelope, `Request failed with status ${response.status}`),
    }
  }

  return {
    ok: true,
    status: response.status,
    data: envelope?.data ?? null,
    message: messageFromEnvelope(envelope, ''),
  }
}

export function requestSigninStart(authDomain: string, request: FlowRequest): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, '/flow/signin/start', request)
}

export function requestSigninComplete(
  authDomain: string,
  request: FlowRequest,
): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, '/flow/signin/complete', request)
}

export function requestSignupStart(authDomain: string, request: FlowRequest): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, '/flow/signup/start', request)
}

export function requestSignupComplete(
  authDomain: string,
  request: FlowRequest,
): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, '/flow/signup/complete', request)
}

export function requestPasswordResetStart(
  authDomain: string,
  request: FlowRequest,
): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, '/flow/password/reset/start', request)
}

export function requestPasswordResetComplete(
  authDomain: string,
  request: FlowRequest,
): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, '/flow/password/reset/complete', request)
}

export function requestHandshake(
  authDomain: string,
  headers: Record<string, string>,
): Promise<FlowApiResult<HandshakeResponseData>> {
  return postFlow<HandshakeResponseData>(authDomain, '/handshake', { headers })
}

export function requestLogout(authDomain: string, headers: Record<string, string>): Promise<FlowApiResult<unknown>> {
  return postFlow<unknown>(authDomain, '/logout', { headers })
}
