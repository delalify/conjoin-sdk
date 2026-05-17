import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { OpenApiContract } from './openapi-contract'
import { createOpenApiContract, loadConjoinOpenApiDocument } from './openapi-contract'
import { ContractRequestRecorder, normalizeHeaders, normalizeQuery } from './request-recorder'
import { type ContractResponse, conjoinError } from './response-fixtures'
import type { ContractRouteDefinition } from './route-registry'
import { ContractRouteRegistry, normalizeRoutePath } from './route-registry'

const LOOPBACK_HOST = '127.0.0.1'
const MAX_BODY_BYTES = 1_048_576

export type ConjoinContractServer = {
  baseUrl: string
  recorder: ContractRequestRecorder
  routes: ContractRouteRegistry
  register: (route: ContractRouteDefinition) => void
  reset: () => void
  stop: () => Promise<void>
}

export type StartConjoinContractServerOptions = {
  openApiContract?: OpenApiContract | false
}

export const startConjoinContractServer = async (
  options: StartConjoinContractServerOptions = {},
): Promise<ConjoinContractServer> => {
  const openApiContract =
    options.openApiContract === false
      ? undefined
      : (options.openApiContract ?? createOpenApiContract(loadConjoinOpenApiDocument()))
  const recorder = new ContractRequestRecorder()
  const routes = new ContractRouteRegistry(openApiContract)
  const server = createServer(async (request, response) => {
    await handleRequest({
      request,
      response,
      recorder,
      routes,
    })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, LOOPBACK_HOST, () => {
      server.off('error', reject)
      resolve()
    })
  })

  const address = server.address()

  if (!isAddressInfo(address)) {
    await closeServer(server)
    throw new Error('Contract server did not bind to a TCP address')
  }

  return {
    baseUrl: `http://${LOOPBACK_HOST}:${address.port}`,
    recorder,
    routes,
    register: route => routes.register(route),
    reset: () => {
      recorder.clear()
      routes.clear()
    },
    stop: () => closeServer(server),
  }
}

type HandleRequestOptions = {
  request: IncomingMessage
  response: ServerResponse
  recorder: ContractRequestRecorder
  routes: ContractRouteRegistry
}

const handleRequest = async ({ request, response, recorder, routes }: HandleRequestOptions): Promise<void> => {
  try {
    const method = (request.method ?? 'GET').toUpperCase()
    const url = new URL(request.url ?? '/', `http://${LOOPBACK_HOST}`)
    const path = normalizeRoutePath(url.pathname)
    const rawBodyResult = await readBody(request)

    if (!rawBodyResult.success) {
      writeResponse(response, rawBodyResult.response)
      return
    }

    const bodyResult = parseBody(rawBodyResult.rawBody, request.headers['content-type'])

    if (!bodyResult.success) {
      writeResponse(response, bodyResult.response)
      return
    }

    const routeMatch = routes.resolve(method, path)

    if (routeMatch === undefined) {
      writeResponse(
        response,
        conjoinError(`Route is not declared in the contract: ${method} ${path}`, {
          status: 404,
          code: 'contract_route_not_declared',
        }),
      )
      return
    }

    if (routeMatch.handler === undefined) {
      writeResponse(
        response,
        conjoinError(`No contract fixture registered for ${method} ${path}`, {
          status: 501,
          code: 'contract_route_not_stubbed',
        }),
      )
      return
    }

    const recordedRequest = recorder.record({
      method,
      path,
      pathTemplate: routeMatch.openApiMatch?.pathTemplate,
      pathParams: routeMatch.openApiMatch?.pathParams ?? {},
      query: normalizeQuery(url.searchParams),
      headers: normalizeHeaders(request.headers),
      body: bodyResult.body,
      rawBody: rawBodyResult.rawBody,
    })
    const contractResponse = await routeMatch.handler(recordedRequest)

    if (routes.openApiContract !== undefined && routeMatch.openApiMatch !== undefined) {
      routes.openApiContract.assertDeclaredResponseStatus(routeMatch.openApiMatch, contractResponse.status)
      routes.openApiContract.assertValidResponseBody(
        routeMatch.openApiMatch,
        contractResponse.status,
        contractResponse.body,
      )
    }

    writeResponse(response, contractResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Contract server request failed'

    writeResponse(
      response,
      conjoinError(message, {
        status: 500,
        code: 'contract_server_error',
      }),
    )
  }
}

type ReadBodyResult =
  | {
      success: true
      rawBody: string
    }
  | {
      success: false
      response: ContractResponse
    }

type ParseBodyResult =
  | {
      success: true
      body: unknown
    }
  | {
      success: false
      response: ContractResponse
    }

const readBody = async (request: IncomingMessage): Promise<ReadBodyResult> => {
  const chunks: Buffer[] = []
  let totalBytes = 0

  for await (const chunk of request) {
    if (!Buffer.isBuffer(chunk)) {
      return {
        success: false,
        response: conjoinError('Unsupported request body chunk', {
          status: 400,
          code: 'contract_unsupported_body_chunk',
        }),
      }
    }

    totalBytes += chunk.byteLength

    if (totalBytes > MAX_BODY_BYTES) {
      return {
        success: false,
        response: conjoinError('Request body exceeded 1 MiB', {
          status: 413,
          code: 'contract_request_body_too_large',
        }),
      }
    }

    chunks.push(chunk)
  }

  return {
    success: true,
    rawBody: Buffer.concat(chunks).toString('utf8'),
  }
}

const parseBody = (rawBody: string, contentType: string | string[] | undefined): ParseBodyResult => {
  if (rawBody.length === 0) {
    return {
      success: true,
      body: undefined,
    }
  }

  const normalizedContentType = Array.isArray(contentType) ? contentType.join(',') : contentType

  if (!normalizedContentType?.toLowerCase().includes('application/json')) {
    return {
      success: true,
      body: rawBody,
    }
  }

  try {
    return {
      success: true,
      body: JSON.parse(rawBody) as unknown,
    }
  } catch {
    return {
      success: false,
      response: conjoinError('Malformed JSON request body', {
        status: 400,
        code: 'contract_malformed_json',
      }),
    }
  }
}

const writeResponse = (response: ServerResponse, contractResponse: ContractResponse): void => {
  const body =
    typeof contractResponse.body === 'string' ? contractResponse.body : JSON.stringify(contractResponse.body ?? {})

  response.writeHead(contractResponse.status, {
    'content-length': Buffer.byteLength(body),
    ...contractResponse.headers,
  })
  response.end(body)
}

const closeServer = async (server: ReturnType<typeof createServer>): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close(error => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })

const isAddressInfo = (address: string | AddressInfo | null): address is AddressInfo =>
  typeof address === 'object' && address !== null && 'port' in address
