import type { ValidateFunction } from 'ajv'
import type Ajv2020 from 'ajv/dist/2020'
import { extractMultipartBoundary, parseMultipartBody } from './multipart-parser'
import {
  type ArrayItemParseMode,
  classifyArrayItemParseMode,
  classifyFieldEncoding,
  getArrayItemsSchema,
  getMultipartProperties,
} from './multipart-schema'
import { createSchemaWithComponents, formatValidationErrors } from './openapi-schema-utils'
import type {
  OpenApiDocument,
  OpenApiRequestBody,
  OpenApiRouteMatch,
  OpenApiValidationError,
  OpenApiValidatorCache,
} from './openapi-types'

export type ValidateMultipartRequestBodyOptions = {
  ajv: Ajv2020
  contentType: string | string[]
  document: OpenApiDocument
  match: OpenApiRouteMatch
  rawBody: unknown
  requestBody: OpenApiRequestBody
  validators: OpenApiValidatorCache
}

export const validateMultipartRequestBody = ({
  ajv,
  contentType,
  document,
  match,
  rawBody,
  requestBody,
  validators,
}: ValidateMultipartRequestBodyOptions): OpenApiValidationError[] => {
  const schema = requestBody.content?.['multipart/form-data']?.schema

  if (schema === undefined) {
    return []
  }

  if (typeof rawBody !== 'string') {
    return [{ path: 'body', message: 'is not a readable multipart payload' }]
  }

  const boundary = extractMultipartBoundary(contentType)

  if (boundary === undefined) {
    return [{ path: 'body', message: 'is missing a multipart boundary' }]
  }

  const fields = parseMultipartBody(rawBody, boundary)

  return validateMultipartBody({
    ajv,
    cacheKey: `${match.method} ${match.pathTemplate} requestBody multipart/form-data`,
    document,
    fields,
    schema,
    validators,
  })
}

type ValidateMultipartBodyOptions = {
  ajv: Ajv2020
  cacheKey: string
  document: OpenApiDocument
  fields: Record<string, string[]>
  schema: unknown
  validators: OpenApiValidatorCache
}

type ReconciledBody = {
  errors: OpenApiValidationError[]
  value: Record<string, unknown>
}

const validateMultipartBody = ({
  ajv,
  cacheKey,
  document,
  fields,
  schema,
  validators,
}: ValidateMultipartBodyOptions): OpenApiValidationError[] => {
  const reconciled = reconcileMultipartFields(document, schema, fields)

  if (reconciled.errors.length > 0) {
    return reconciled.errors
  }

  const validator = getMultipartValidator({ ajv, cacheKey, document, schema, validators })

  if (validator(reconciled.value)) {
    return []
  }

  return formatValidationErrors('body', validator.errors)
}

const reconcileMultipartFields = (
  document: OpenApiDocument,
  schema: unknown,
  fields: Record<string, string[]>,
): ReconciledBody => {
  const properties = getMultipartProperties(document, schema)
  const value: Record<string, unknown> = {}
  const errors: OpenApiValidationError[] = []

  for (const [name, parts] of Object.entries(fields)) {
    const fieldSchema = properties?.[name]
    const encoding = classifyFieldEncoding(document, fieldSchema)

    if (encoding === 'object') {
      reconcileObjectField({ document, errors, name, parts, value })
      continue
    }

    if (encoding === 'array') {
      reconcileArrayField({ document, errors, fieldSchema, name, parts, value })
      continue
    }

    value[name] = parts.length === 1 ? parts[0] : parts
  }

  return { errors, value }
}

type ReconcileObjectFieldOptions = {
  document: OpenApiDocument
  errors: OpenApiValidationError[]
  name: string
  parts: string[]
  value: Record<string, unknown>
}

const reconcileObjectField = ({ errors, name, parts, value }: ReconcileObjectFieldOptions): void => {
  if (parts.length !== 1) {
    value[name] = parts
    return
  }

  const parsed = tryParseJson(parts[0])

  if (!parsed.success) {
    errors.push({ path: `body.${name}`, message: 'is not valid JSON' })
    return
  }

  value[name] = parsed.value
}

type ReconcileArrayFieldOptions = {
  document: OpenApiDocument
  errors: OpenApiValidationError[]
  fieldSchema: unknown
  name: string
  parts: string[]
  value: Record<string, unknown>
}

const reconcileArrayField = ({
  document,
  errors,
  fieldSchema,
  name,
  parts,
  value,
}: ReconcileArrayFieldOptions): void => {
  const itemsSchema = getArrayItemsSchema(document, fieldSchema)
  const parseMode = classifyArrayItemParseMode(document, itemsSchema)
  const elements: unknown[] = []

  for (const [index, part] of parts.entries()) {
    elements.push(reconcileArrayElement({ errors, index, name, parseMode, part }))
  }

  value[name] = elements
}

type ReconcileArrayElementOptions = {
  errors: OpenApiValidationError[]
  index: number
  name: string
  parseMode: ArrayItemParseMode
  part: string
}

const reconcileArrayElement = ({ errors, index, name, parseMode, part }: ReconcileArrayElementOptions): unknown => {
  if (parseMode === 'never') {
    return part
  }

  const parsed = tryParseJson(part)

  if (parseMode === 'always') {
    if (!parsed.success) {
      errors.push({ path: `body.${name}[${index}]`, message: 'is not valid JSON' })
      return undefined
    }

    return parsed.value
  }

  if (parsed.success && isNonScalar(parsed.value)) {
    return parsed.value
  }

  return part
}

const isNonScalar = (value: unknown): boolean => typeof value === 'object' && value !== null

type ParseJsonResult = { success: true; value: unknown } | { success: false }

const tryParseJson = (raw: string): ParseJsonResult => {
  try {
    return { success: true, value: JSON.parse(raw) as unknown }
  } catch {
    return { success: false }
  }
}

type GetMultipartValidatorOptions = {
  ajv: Ajv2020
  cacheKey: string
  document: OpenApiDocument
  schema: unknown
  validators: OpenApiValidatorCache
}

const getMultipartValidator = ({
  ajv,
  cacheKey,
  document,
  schema,
  validators,
}: GetMultipartValidatorOptions): ValidateFunction => {
  const cachedValidator = validators.get(cacheKey)

  if (cachedValidator !== undefined) {
    return cachedValidator
  }

  const validator = ajv.compile(createSchemaWithComponents(schema, document.components))

  validators.set(cacheKey, validator)

  return validator
}
