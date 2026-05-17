import type { ValidateFunction } from 'ajv'

export type OpenApiMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace'

export type OpenApiReference = {
  $ref: string
}

export type OpenApiResponse = {
  content?: Record<
    string,
    {
      schema?: unknown
    }
  >
}

export type OpenApiParameterLocation = 'cookie' | 'header' | 'path' | 'query'

export type OpenApiParameter = {
  name: string
  in: OpenApiParameterLocation
  required?: boolean
  schema?: unknown
  style?: string
  explode?: boolean
}

export type OpenApiRequestBody = {
  required?: boolean
  content?: Record<
    string,
    {
      schema?: unknown
    }
  >
}

export type OpenApiOperation = {
  operationId?: string
  parameters?: Array<OpenApiParameter | OpenApiReference>
  requestBody?: OpenApiRequestBody | OpenApiReference
  responses?: Record<string, OpenApiResponse | OpenApiReference>
}

export type OpenApiPathItem = Partial<Record<OpenApiMethod, OpenApiOperation>> & {
  parameters?: Array<OpenApiParameter | OpenApiReference>
}

export type OpenApiDocument = {
  openapi: string
  components?: Record<string, unknown>
  paths: Record<string, OpenApiPathItem>
}

export type OpenApiRouteMatch = {
  method: OpenApiMethod
  pathTemplate: string
  pathParams: Record<string, string>
  operation: OpenApiOperation
}

export type OpenApiContractRequest = {
  pathParams: Record<string, string>
  query: Record<string, string | string[]>
  headers: Record<string, string | string[]>
  body: unknown
}

export type OpenApiValidationError = {
  message: string
  path: string
}

export type OpenApiValidationResult =
  | {
      success: true
    }
  | {
      success: false
      errors: OpenApiValidationError[]
    }

export type OpenApiContract = {
  resolveOperation: (method: string, path: string) => OpenApiRouteMatch | undefined
  assertKnownRoute: (method: string, path: string) => OpenApiRouteMatch
  assertDeclaredResponseStatus: (match: OpenApiRouteMatch, status: number) => void
  validateRequest: (match: OpenApiRouteMatch, request: OpenApiContractRequest) => OpenApiValidationResult
  assertValidResponseBody: (match: OpenApiRouteMatch, status: number, body: unknown) => void
}

export type OpenApiValidatorCache = Map<string, ValidateFunction>
