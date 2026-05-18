import type { OpenApiDocument, OpenApiMethod, OpenApiOperation, OpenApiRouteMatch } from './openapi-types'

type CompiledOpenApiRoute = {
  method: OpenApiMethod
  pathTemplate: string
  matcher: RegExp
  paramNames: string[]
  operation: OpenApiOperation
}

const OPENAPI_METHODS: OpenApiMethod[] = ['delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace']

export const compileRoutes = (document: OpenApiDocument): CompiledOpenApiRoute[] =>
  Object.entries(document.paths).flatMap(([pathTemplate, pathItem]) =>
    OPENAPI_METHODS.flatMap(method => {
      const operation = pathItem[method]

      if (operation === undefined) {
        return []
      }

      const { matcher, paramNames } = compilePathTemplate(pathTemplate)
      const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])]

      return [
        {
          method,
          pathTemplate,
          matcher,
          paramNames,
          operation: {
            ...operation,
            parameters,
          },
        },
      ]
    }),
  )

export const resolveOperation = (
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
      method: route.method,
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
