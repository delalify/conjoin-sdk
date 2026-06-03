import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ValidateFunction } from 'ajv'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { validateRequestAgainstOperation } from './openapi-request-validation'
import { compileRoutes, resolveOperation } from './openapi-routes'
import {
  createSchemaWithComponents,
  formatAjvErrors,
  isOpenApiReference,
  resolveOpenApiReference,
} from './openapi-schema-utils'
import type {
  OpenApiContract,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiResponse,
  OpenApiRouteMatch,
} from './openapi-types'

export type {
  OpenApiContract,
  OpenApiContractRequest,
  OpenApiDocument,
  OpenApiRouteMatch,
  OpenApiValidationError,
  OpenApiValidationResult,
} from './openapi-types'

export const loadConjoinOpenApiDocument = (): OpenApiDocument => {
  const currentDirectory = dirname(fileURLToPath(import.meta.url))
  const specPath = resolve(currentDirectory, '../../../../../spec/openapi.json')
  const rawSpec = readFileSync(specPath, 'utf8')

  return JSON.parse(rawSpec) as OpenApiDocument
}

export const createOpenApiContract = (document: OpenApiDocument): OpenApiContract => {
  const routes = compileRoutes(document)
  const schemaAjv = new Ajv2020({
    allErrors: true,
    strict: false,
  })
  const parameterAjv = new Ajv2020({
    allErrors: true,
    coerceTypes: true,
    strict: false,
  })

  addFormats(schemaAjv)
  addFormats(parameterAjv)

  const parameterValidators = new Map<string, ValidateFunction>()
  const responseValidators = new Map<string, ValidateFunction>()
  const requestBodyValidators = new Map<string, ValidateFunction>()
  const multipartBodyValidators = new Map<string, ValidateFunction>()

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
    validateRequest: (match, request) =>
      validateRequestAgainstOperation({
        document,
        match,
        multipartBodyValidators,
        parameterAjv,
        parameterValidators,
        request,
        requestBodyValidators,
        schemaAjv,
      }),
    assertValidResponseBody: (match, status, body) => {
      const validator = getResponseValidator({
        ajv: schemaAjv,
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
  const cacheKey = `${match.method} ${match.pathTemplate} ${status}`
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
