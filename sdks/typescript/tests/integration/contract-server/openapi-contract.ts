import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type OpenApiOperation = {
  operationId?: string
  responses?: Record<string, unknown>
}

export type OpenApiPathItem = Partial<Record<OpenApiMethod, OpenApiOperation>>

export type OpenApiDocument = {
  openapi: string
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
  }
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
