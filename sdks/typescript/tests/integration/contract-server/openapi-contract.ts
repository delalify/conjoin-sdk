import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ErrorObject, ValidateFunction } from 'ajv'
import Ajv2020 from 'ajv/dist/2020'

export type OpenApiOperation = {
  operationId?: string
  responses?: Record<string, OpenApiResponse | OpenApiReference>
}

export type OpenApiPathItem = Partial<Record<OpenApiMethod, OpenApiOperation>>

export type OpenApiDocument = {
  openapi: string
  components?: Record<string, unknown>
  paths: Record<string, OpenApiPathItem>
}

export type OpenApiRouteMatch = {
  pathTemplate: string
  pathParams: Record<string, string>
  operation: OpenApiOperation
}

export type OpenApiContract = {
  resolveOperation: (method: string, path: string) => OpenApiRouteMatch | undefined
  assertKnownRoute: (method: string, path: string) => OpenApiRouteMatch
  assertDeclaredResponseStatus: (match: OpenApiRouteMatch, status: number) => void
  assertValidResponseBody: (match: OpenApiRouteMatch, status: number, body: unknown) => void
}

type OpenApiReference = {
  $ref: string
}

type OpenApiResponse = {
  content?: Record<
    string,
    {
      schema?: unknown
    }
  >
}

type OpenApiMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace'

type CompiledOpenApiRoute = {
  method: OpenApiMethod
  pathTemplate: string
  matcher: RegExp
  paramNames: string[]
  operation: OpenApiOperation
}

const OPENAPI_METHODS: OpenApiMethod[] = ['delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace']

export const loadConjoinOpenApiDocument = (): OpenApiDocument => {
  const currentDirectory = dirname(fileURLToPath(import.meta.url))
  const specPath = resolve(currentDirectory, '../../../../../spec/openapi.json')
  const rawSpec = readFileSync(specPath, 'utf8')

  return JSON.parse(rawSpec) as OpenApiDocument
}

export const createOpenApiContract = (document: OpenApiDocument): OpenApiContract => {
  const routes = compileRoutes(document)
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
  })
  const responseValidators = new Map<string, ValidateFunction>()

  return {
    resolveOperation: (method, path) => resolveOperation(routes, method, path),
    assertKnownRoute: (method, path) => {
      const match = resolveOperation(routes, method, path)

      if (match === undefined) {
        throw new Error(`Route is not declared in OpenAPI: ${method.toUpperCase()} ${path}`)
      }

      return match
    },
    assertDeclaredResponseStatus: (match, status) => {
      const responses = match.operation.responses ?? {}
      const statusKey = String(status)

      if (!(statusKey in responses) && !('default' in responses)) {
        throw new Error(`Response status ${status} is not declared for ${match.pathTemplate}`)
      }
    },
    assertValidResponseBody: (match, status, body) => {
      const validator = getResponseValidator({
        ajv,
        document,
        match,
        responseValidators,
        status,
      })

      if (validator === undefined) {
        return
      }

      if (validator(body)) {
        return
      }

      throw new Error(
        `Response body does not match OpenAPI schema for ${match.pathTemplate} ${status}: ${formatAjvErrors(
          validator.errors,
        )}`,
      )
    },
  }
}

type GetResponseValidatorOptions = {
  ajv: Ajv2020
  document: OpenApiDocument
  match: OpenApiRouteMatch
  responseValidators: Map<string, ValidateFunction>
  status: number
}

const getResponseValidator = ({
  ajv,
  document,
  match,
  responseValidators,
  status,
}: GetResponseValidatorOptions): ValidateFunction | undefined => {
  const cacheKey = `${match.pathTemplate} ${status}`
  const cachedValidator = responseValidators.get(cacheKey)

  if (cachedValidator !== undefined) {
    return cachedValidator
  }

  const response = getResponseDefinition(document, match.operation, status)
  const schema = response?.content?.['application/json']?.schema

  if (schema === undefined) {
    return undefined
  }

  const validator = ajv.compile(createSchemaWithComponents(schema, document.components))

  responseValidators.set(cacheKey, validator)

  return validator
}

const getResponseDefinition = (
  document: OpenApiDocument,
  operation: OpenApiOperation,
  status: number,
): OpenApiResponse | undefined => {
  const responses = operation.responses ?? {}
  const response = responses[String(status)] ?? responses.default

  if (response === undefined) {
    return undefined
  }

  if (isOpenApiReference(response)) {
    return resolveOpenApiReference<OpenApiResponse>(document, response.$ref)
  }

  return response
}

const resolveOpenApiReference = <T>(document: OpenApiDocument, ref: string): T => {
  if (!ref.startsWith('#/')) {
    throw new Error(`Unsupported external OpenAPI reference: ${ref}`)
  }

  const value = ref
    .slice(2)
    .split('/')
    .map(decodeJsonPointerSegment)
    .reduce<unknown>((current, segment) => {
      if (!isRecord(current) || !(segment in current)) {
        throw new Error(`OpenAPI reference could not be resolved: ${ref}`)
      }

      return current[segment]
    }, document)

  return value as T
}

const isOpenApiReference = (value: unknown): value is OpenApiReference =>
  isRecord(value) && typeof value.$ref === 'string'

const createSchemaWithComponents = (
  schema: unknown,
  components: Record<string, unknown> | undefined,
): boolean | Record<string, unknown> => {
  if (typeof schema === 'boolean') {
    return schema
  }

  if (!isRecord(schema)) {
    throw new Error('OpenAPI response schema must be an object or boolean schema')
  }

  return {
    ...schema,
    components,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const decodeJsonPointerSegment = (segment: string): string => segment.replaceAll('~1', '/').replaceAll('~0', '~')

const formatAjvErrors = (errors: ErrorObject[] | null | undefined): string => {
  if (!errors || errors.length === 0) {
    return 'unknown validation error'
  }

  return errors
    .slice(0, 5)
    .map(error => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
    .join('; ')
}

const compileRoutes = (document: OpenApiDocument): CompiledOpenApiRoute[] =>
  Object.entries(document.paths).flatMap(([pathTemplate, pathItem]) =>
    OPENAPI_METHODS.flatMap(method => {
      const operation = pathItem[method]

      if (operation === undefined) {
        return []
      }

      const { matcher, paramNames } = compilePathTemplate(pathTemplate)

      return [
        {
          method,
          pathTemplate,
          matcher,
          paramNames,
          operation,
        },
      ]
    }),
  )

const resolveOperation = (
  routes: CompiledOpenApiRoute[],
  method: string,
  path: string,
): OpenApiRouteMatch | undefined => {
  const normalizedMethod = normalizeMethod(method)

  for (const route of routes) {
    if (route.method !== normalizedMethod) {
      continue
    }

    const match = path.match(route.matcher)

    if (match === null) {
      continue
    }

    return {
      pathTemplate: route.pathTemplate,
      pathParams: buildPathParams(route.paramNames, match),
      operation: route.operation,
    }
  }

  return undefined
}

const compilePathTemplate = (
  pathTemplate: string,
): {
  matcher: RegExp
  paramNames: string[]
} => {
  const paramNames: string[] = []
  const pattern = pathTemplate
    .split('/')
    .map(segment => {
      const parameterName = getPathParameterName(segment)

      if (parameterName === undefined) {
        return escapeRegExp(segment)
      }

      paramNames.push(parameterName)

      return '([^/]+)'
    })
    .join('/')

  return {
    matcher: new RegExp(`^${pattern}$`),
    paramNames,
  }
}

const getPathParameterName = (segment: string): string | undefined => {
  if (!segment.startsWith('{') || !segment.endsWith('}')) {
    return undefined
  }

  const parameterName = segment.slice(1, -1)

  return parameterName.length > 0 ? parameterName : undefined
}

const buildPathParams = (paramNames: string[], match: RegExpMatchArray): Record<string, string> =>
  Object.fromEntries(paramNames.map((name, index) => [name, decodeURIComponent(match[index + 1] ?? '')]))

const normalizeMethod = (method: string): OpenApiMethod => method.toLowerCase() as OpenApiMethod

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
