import { type AuthFlowRequestBody, type AuthFlowResponseData, FRONTEND_PATHS } from '@conjoin-cloud/sdk/auth-flow'
import type { AuthRequestCredentials, ClientHandle } from '../provider/types'

const VALID_DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i

const CLIENT_HANDLE_HEADER = 'x-conjoin-client-handle'
const CODE_VERIFIER_HEADER = 'x-auth-code-verifier'
const CODE_CHALLENGE_HEADER = 'x-auth-code-challenge'
const STATE_HEADER = 'x-auth-state'

export type FlowResponseData = AuthFlowResponseData<'startAuthSignin'>

/**
 * Native flow responses carry the completed client handle in the body (the web
 * flow receives it as a cookie), so the native variants widen `FlowResponseData`
 * with `client_handle`. Structurally a superset, a native result is still a valid
 * `FlowApiResult<FlowResponseData>` for the shared sign-in/sign-up state machine.
 */
export type NativeFlowResponseData = AuthFlowResponseData<'startNativeSignin'>

export type NativeTokenResponseData = AuthFlowResponseData<'processNativeTokenMint'>

export type NativeLogoutResponseData = AuthFlowResponseData<'processNativeLogout'>

export type HandshakeResponseData = AuthFlowResponseData<'processAuthHandshake'>

export type SigninStartBody = Omit<AuthFlowRequestBody<'startAuthSignin'>, 'provider_key'> & { provider_key?: string }

export type SignupStartBody = Omit<AuthFlowRequestBody<'startAuthSignup'>, 'provider_key'> & { provider_key?: string }

export type FlowApiResult<TData> =
  | { ok: true; status: number; data: TData | null; message: string | null }
  | { ok: false; status: number; data: null; message: string }

type FlowRequest<TBody> = {
  headers: Record<string, string>
  body?: TBody
}

type ResponseEnvelope<TData> = {
  response?: { message?: unknown }
  data?: TData
}

function buildFlowUrl(authDomain: string, path: string): string {
  if (!VALID_DOMAIN_PATTERN.test(authDomain)) {
    throw new Error(`Invalid auth domain: ${authDomain}`)
  }
  return `https://${authDomain}${path}`
}

function messageFromEnvelope(envelope: ResponseEnvelope<unknown> | null, fallback: string): string {
  const message = envelope?.response?.message
  return typeof message === 'string' && message.length > 0 ? message : fallback
}

async function postFlow<TData>(
  authDomain: string,
  path: string,
  request: { headers: Record<string, string>; body?: unknown },
  credentials: AuthRequestCredentials = 'include',
): Promise<FlowApiResult<TData>> {
  const response = await fetch(buildFlowUrl(authDomain, path), {
    method: 'POST',
    credentials,
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

export function requestSigninStart(
  authDomain: string,
  request: FlowRequest<SigninStartBody>,
): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, FRONTEND_PATHS.startAuthSignin, request)
}

export function requestSigninComplete(
  authDomain: string,
  request: FlowRequest<AuthFlowRequestBody<'completeAuthSignin'>>,
): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, FRONTEND_PATHS.completeAuthSignin, request)
}

export function requestSignupStart(
  authDomain: string,
  request: FlowRequest<SignupStartBody>,
): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, FRONTEND_PATHS.startAuthSignup, request)
}

export function requestSignupComplete(
  authDomain: string,
  request: FlowRequest<AuthFlowRequestBody<'completeAuthSignup'>>,
): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, FRONTEND_PATHS.completeAuthSignup, request)
}

export function requestPasswordResetStart(
  authDomain: string,
  request: FlowRequest<AuthFlowRequestBody<'startAuthPasswordReset'>>,
): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, FRONTEND_PATHS.startAuthPasswordReset, request)
}

export function requestPasswordResetComplete(
  authDomain: string,
  request: FlowRequest<AuthFlowRequestBody<'completeAuthPasswordReset'>>,
): Promise<FlowApiResult<FlowResponseData>> {
  return postFlow<FlowResponseData>(authDomain, FRONTEND_PATHS.completeAuthPasswordReset, request)
}

export function requestHandshake(
  authDomain: string,
  headers: Record<string, string>,
): Promise<FlowApiResult<HandshakeResponseData>> {
  return postFlow<HandshakeResponseData>(authDomain, FRONTEND_PATHS.processAuthHandshake, { headers })
}

export function requestLogout(
  authDomain: string,
  headers: Record<string, string>,
): Promise<FlowApiResult<AuthFlowResponseData<'processAuthLogout'>>> {
  return postFlow<AuthFlowResponseData<'processAuthLogout'>>(authDomain, FRONTEND_PATHS.processAuthLogout, { headers })
}

function encodeClientHandleHeader(handle: ClientHandle): string {
  return encodeURIComponent(JSON.stringify({ client_id: handle.client_id, reference_id: handle.reference_id }))
}

export type NativeFlowContext = { state: string; codeChallenge: string }

export type NativeCompleteContext = NativeFlowContext & { handle: ClientHandle }

function nativeStartHeaders(context: NativeFlowContext): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    [STATE_HEADER]: context.state,
    [CODE_CHALLENGE_HEADER]: context.codeChallenge,
  }
}

function nativeCompleteHeaders(context: NativeCompleteContext): Record<string, string> {
  return { ...nativeStartHeaders(context), [CLIENT_HANDLE_HEADER]: encodeClientHandleHeader(context.handle) }
}

export function requestNativeSigninStart(
  authDomain: string,
  body: SigninStartBody,
  context: NativeFlowContext,
): Promise<FlowApiResult<NativeFlowResponseData>> {
  return postFlow<NativeFlowResponseData>(
    authDomain,
    FRONTEND_PATHS.startNativeSignin,
    { headers: nativeStartHeaders(context), body },
    'omit',
  )
}

export function requestNativeSigninComplete(
  authDomain: string,
  body: AuthFlowRequestBody<'completeNativeSignin'>,
  context: NativeCompleteContext,
): Promise<FlowApiResult<NativeFlowResponseData>> {
  return postFlow<NativeFlowResponseData>(
    authDomain,
    FRONTEND_PATHS.completeNativeSignin,
    { headers: nativeCompleteHeaders(context), body },
    'omit',
  )
}

export function requestNativeSignupStart(
  authDomain: string,
  body: SignupStartBody,
  context: NativeFlowContext,
): Promise<FlowApiResult<NativeFlowResponseData>> {
  return postFlow<NativeFlowResponseData>(
    authDomain,
    FRONTEND_PATHS.startNativeSignup,
    { headers: nativeStartHeaders(context), body },
    'omit',
  )
}

export function requestNativeSignupComplete(
  authDomain: string,
  body: AuthFlowRequestBody<'completeNativeSignup'>,
  context: NativeCompleteContext,
): Promise<FlowApiResult<NativeFlowResponseData>> {
  return postFlow<NativeFlowResponseData>(
    authDomain,
    FRONTEND_PATHS.completeNativeSignup,
    { headers: nativeCompleteHeaders(context), body },
    'omit',
  )
}

export function requestNativeTokenMint(
  authDomain: string,
  handle: ClientHandle,
  codeVerifier: string,
): Promise<FlowApiResult<NativeTokenResponseData>> {
  return postFlow<NativeTokenResponseData>(authDomain, FRONTEND_PATHS.processNativeTokenMint, {
    headers: {
      'Content-Type': 'application/json',
      [CLIENT_HANDLE_HEADER]: encodeClientHandleHeader(handle),
      [CODE_VERIFIER_HEADER]: codeVerifier,
    },
  })
}

export function requestNativeRefresh(
  authDomain: string,
  refreshToken: string,
): Promise<FlowApiResult<NativeTokenResponseData>> {
  const body: AuthFlowRequestBody<'refreshNativeSession'> = { refresh_token: refreshToken }
  return postFlow<NativeTokenResponseData>(authDomain, FRONTEND_PATHS.refreshNativeSession, {
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

export function requestNativeLogout(
  authDomain: string,
  handle: ClientHandle,
): Promise<FlowApiResult<NativeLogoutResponseData>> {
  return postFlow<NativeLogoutResponseData>(authDomain, FRONTEND_PATHS.processNativeLogout, {
    headers: {
      'Content-Type': 'application/json',
      [CLIENT_HANDLE_HEADER]: encodeClientHandleHeader(handle),
    },
  })
}
