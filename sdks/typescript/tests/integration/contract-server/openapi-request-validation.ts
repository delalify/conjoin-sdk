import type { ValidateFunction } from 'ajv'
import type Ajv2020 from 'ajv/dist/2020'
import { validateMultipartRequestBody } from './multipart-body-validation'
import { isMultipartFormData } from './multipart-parser'
import {
  createSchemaWithComponents,
  formatValidationErrors,
  isOpenApiReference,
  isRecord,
  resolveOpenApiReference,
} from './openapi-schema-utils'
import type {
  OpenApiContractRequest,
  OpenApiDocument,
  OpenApiParameter,
  OpenApiReference,
  OpenApiRequestBody,
  OpenApiRouteMatch,
  OpenApiValidationError,
  OpenApiValidationResult,
  OpenApiValidatorCache,
} from './openapi-types'

type StructuredQueryValue = string | string[] | StructuredQueryObject

type StructuredQueryObject = {
  [key: string]: StructuredQueryValue
}

export type ValidateRequestAgainstOperationOptions = {
  document: OpenApiDocument
  match: OpenApiRouteMatch
  multipartBodyValidators: OpenApiValidatorCache
  parameterAjv: Ajv2020
  parameterValidators: OpenApiValidatorCache
  request: OpenApiContractRequest
  requestBodyValidators: OpenApiValidatorCache
  schemaAjv: Ajv2020
}

export const validateRequestAgainstOperation = ({
  document,
  match,
  multipartBodyValidators,
  parameterAjv,
  parameterValidators,
  request,
  requestBodyValidators,
  schemaAjv,
}: ValidateRequestAgainstOperationOptions): OpenApiValidationResult => {
  const errors = [
    ...validateParameters({
      document,
      match,
      parameterAjv,
      parameterValidators,
      request,
    }),
    ...validateRequestBody({
      document,
      match,
      multipartBodyAjv: parameterAjv,
      multipartBodyValidators,
      request,
      requestBodyValidators,
      schemaAjv,
    }),
  ]

  if (errors.length === 0) {
    return {
      success: true,
    }
  }

  return {
    success: false,
    errors,
  }
}

type ValidateParametersOptions = {
  document: OpenApiDocument
  match: OpenApiRouteMatch
  parameterAjv: Ajv2020
  parameterValidators: OpenApiValidatorCache
  request: OpenApiContractRequest
}

const validateParameters = ({
  document,
  match,
  parameterAjv,
  parameterValidators,
  request,
}: ValidateParametersOptions): OpenApiValidationError[] => {
  const errors: OpenApiValidationError[] = []
  const structuredQuery = createStructuredQuery(request.query)

  for (const parameterOrReference of match.operation.parameters ?? []) {
    const parameter = resolveParameter(document, parameterOrReference)
    const value = getParameterValue(parameter, request, structuredQuery)
    const path = `${parameter.in}.${parameter.name}`

    if (value === undefined) {
      if (parameter.required === true || parameter.in === 'path') {
        errors.push({
          path,
          message: 'is required',
        })
      }

      continue
    }

    if (parameter.schema === undefined) {
      continue
    }

    const validator = getRequestValidator({
      ajv: parameterAjv,
      cacheKey: `${match.method} ${match.pathTemplate} parameter ${parameter.in}.${parameter.name}`,
      document,
      schema: parameter.schema,
      validators: parameterValidators,
    })

    if (validator(value)) {
      continue
    }

    errors.push(...formatValidationErrors(path, validator.errors))
  }

  return errors
}

type ValidateRequestBodyOptions = {
  document: OpenApiDocument
  match: OpenApiRouteMatch
  multipartBodyAjv: Ajv2020
  multipartBodyValidators: OpenApiValidatorCache
  request: OpenApiContractRequest
  requestBodyValidators: OpenApiValidatorCache
  schemaAjv: Ajv2020
}

const validateRequestBody = ({
  document,
  match,
  multipartBodyAjv,
  multipartBodyValidators,
  request,
  requestBodyValidators,
  schemaAjv,
}: ValidateRequestBodyOptions): OpenApiValidationError[] => {
  if (match.operation.requestBody === undefined) {
    return []
  }

  const requestBody = resolveRequestBody(document, match.operation.requestBody)

  if (request.body === undefined) {
    if (requestBody.required === true) {
      return [
        {
          path: 'body',
          message: 'is required',
        },
      ]
    }

    return []
  }

  const contentType = request.headers['content-type']

  if (isMultipartFormData(contentType)) {
    return validateMultipartRequestBody({
      ajv: multipartBodyAjv,
      contentType,
      document,
      match,
      rawBody: request.body,
      requestBody,
      validators: multipartBodyValidators,
    })
  }

  const schema = requestBody.content?.['application/json']?.schema

  if (schema === undefined) {
    return []
  }

  const validator = getRequestValidator({
    ajv: schemaAjv,
    cacheKey: `${match.method} ${match.pathTemplate} requestBody application/json`,
    document,
    schema,
    validators: requestBodyValidators,
  })

  if (validator(request.body)) {
    return []
  }

  return formatValidationErrors('body', validator.errors)
}

type GetRequestValidatorOptions = {
  ajv: Ajv2020
  cacheKey: string
  document: OpenApiDocument
  schema: unknown
  validators: OpenApiValidatorCache
}

const getRequestValidator = ({
  ajv,
  cacheKey,
  document,
  schema,
  validators,
}: GetRequestValidatorOptions): ValidateFunction => {
  const cachedValidator = validators.get(cacheKey)

  if (cachedValidator !== undefined) {
    return cachedValidator
  }

  const validator = ajv.compile(createSchemaWithComponents(schema, document.components))

  validators.set(cacheKey, validator)

  return validator
}

const resolveParameter = (
  document: OpenApiDocument,
  parameter: OpenApiParameter | OpenApiReference,
): OpenApiParameter => {
  if (isOpenApiReference(parameter)) {
    return resolveOpenApiReference<OpenApiParameter>(document, parameter.$ref)
  }

  return parameter
}

const resolveRequestBody = (
  document: OpenApiDocument,
  requestBody: OpenApiRequestBody | OpenApiReference,
): OpenApiRequestBody => {
  if (isOpenApiReference(requestBody)) {
    return resolveOpenApiReference<OpenApiRequestBody>(document, requestBody.$ref)
  }

  return requestBody
}

const getParameterValue = (
  parameter: OpenApiParameter,
  request: OpenApiContractRequest,
  structuredQuery: StructuredQueryObject,
): StructuredQueryValue | undefined => {
  if (parameter.in === 'path') {
    return request.pathParams[parameter.name]
  }

  if (parameter.in === 'query') {
    return request.query[parameter.name] ?? structuredQuery[parameter.name]
  }

  if (parameter.in === 'header') {
    return request.headers[parameter.name.toLowerCase()]
  }

  return undefined
}

const createStructuredQuery = (query: Record<string, string | string[]>): StructuredQueryObject => {
  const structuredQuery: StructuredQueryObject = {}

  for (const [key, value] of Object.entries(query)) {
    assignStructuredQueryValue(structuredQuery, parseStructuredQueryKey(key), value)
  }

  return structuredQuery
}

const parseStructuredQueryKey = (key: string): string[] => {
  const firstBracketIndex = key.indexOf('[')

  if (firstBracketIndex === -1) {
    return [key]
  }

  const rootSegment = key.slice(0, firstBracketIndex)

  if (rootSegment.length === 0) {
    return [key]
  }

  const segments = [rootSegment]
  let lastIndex = firstBracketIndex

  for (const match of key.slice(firstBracketIndex).matchAll(/\[([^\]]+)\]/g)) {
    const segment = match[1]
    const index = match.index

    if (segment === undefined || index === undefined || index !== lastIndex - firstBracketIndex) {
      return [key]
    }

    segments.push(segment)
    lastIndex = firstBracketIndex + index + match[0].length
  }

  return lastIndex === key.length ? segments : [key]
}

const assignStructuredQueryValue = (target: StructuredQueryObject, path: string[], value: string | string[]): void => {
  if (path.some(isUnsafeObjectKey)) {
    return
  }

  if (path.length === 1) {
    const segment = path[0]

    if (segment === undefined) {
      return
    }

    target[segment] = value
    return
  }

  let current = target

  for (const segment of path.slice(0, -1)) {
    const nextValue = current[segment]

    if (isStructuredQueryObject(nextValue)) {
      current = nextValue
      continue
    }

    const nextObject: StructuredQueryObject = {}
    current[segment] = nextObject
    current = nextObject
  }

  const leaf = path.at(-1)

  if (leaf === undefined) {
    return
  }

  current[leaf] = value
}

const isStructuredQueryObject = (value: unknown): value is StructuredQueryObject => isRecord(value)

const isUnsafeObjectKey = (key: string): boolean => key === '__proto__' || key === 'constructor' || key === 'prototype'
