import type { OpenApiContract, OpenApiRouteMatch } from './openapi-contract'
import type { RecordedContractRequest } from './request-recorder'
import type { ContractResponse } from './response-fixtures'

export type ContractRouteHandler = (request: RecordedContractRequest) => ContractResponse | Promise<ContractResponse>

export type ContractRouteMatch = {
  handler?: ContractRouteHandler
  openApiMatch?: OpenApiRouteMatch
}

export type ContractRouteDefinition = {
  method: string
  path: string
  handler: ContractRouteHandler
}

export class ContractRouteRegistry {
  #routes = new Map<string, ContractRouteHandler>()

  constructor(readonly openApiContract?: OpenApiContract) {}

  register(route: ContractRouteDefinition): void {
    const openApiMatch = this.openApiContract?.assertKnownRoute(route.method, route.path)
    const routePath = openApiMatch?.pathTemplate ?? route.path
    const key = createRouteKey(route.method, routePath)

    if (this.#routes.has(key)) {
      throw new Error(`Contract route already registered: ${key}`)
    }

    this.#routes.set(key, route.handler)
  }

  resolve(method: string, path: string): ContractRouteMatch | undefined {
    const exactHandler = this.#routes.get(createRouteKey(method, path))

    if (exactHandler !== undefined) {
      return {
        handler: exactHandler,
        openApiMatch: this.openApiContract?.resolveOperation(method, path),
      }
    }

    const openApiMatch = this.openApiContract?.resolveOperation(method, path)

    if (openApiMatch === undefined) {
      return undefined
    }

    const templateHandler = this.#routes.get(createRouteKey(method, openApiMatch.pathTemplate))

    if (templateHandler === undefined) {
      return {
        handler: undefined,
        openApiMatch,
      }
    }

    return {
      handler: templateHandler,
      openApiMatch,
    }
  }

  clear(): void {
    this.#routes.clear()
  }
}

export const createRouteKey = (method: string, path: string): string =>
  `${method.toUpperCase()} ${normalizeRoutePath(path)}`

export const normalizeRoutePath = (path: string): string => {
  if (!path.startsWith('/')) {
    return `/${path}`
  }

  return path
}
