import { isOpenApiReference, isRecord, resolveOpenApiReference } from './openapi-schema-utils'
import type { OpenApiDocument } from './openapi-types'

const MAX_SCHEMA_RESOLUTION_DEPTH = 32

const NON_SCALAR_TYPES = new Set(['array', 'object'])

export type FieldEncoding = 'array' | 'object' | 'scalar'

export type ArrayItemParseMode = 'always' | 'maybe' | 'never'

export const resolveSchemaNode = (document: OpenApiDocument, schema: unknown, depth = 0): unknown => {
  if (depth > MAX_SCHEMA_RESOLUTION_DEPTH) {
    return schema
  }

  if (isOpenApiReference(schema)) {
    return resolveSchemaNode(document, resolveOpenApiReference(document, schema.$ref), depth + 1)
  }

  return schema
}

export const getMultipartProperties = (
  document: OpenApiDocument,
  schema: unknown,
): Record<string, unknown> | undefined => {
  const resolved = resolveSchemaNode(document, schema)

  if (!isRecord(resolved) || !isRecord(resolved.properties)) {
    return undefined
  }

  return resolved.properties
}

export const classifyFieldEncoding = (document: OpenApiDocument, fieldSchema: unknown): FieldEncoding => {
  const resolved = resolveSchemaNode(document, fieldSchema)

  if (!isRecord(resolved)) {
    return 'scalar'
  }

  if (resolved.type === 'array') {
    return 'array'
  }

  if (resolved.type === 'object') {
    return 'object'
  }

  return 'scalar'
}

export const getArrayItemsSchema = (document: OpenApiDocument, fieldSchema: unknown): unknown => {
  const resolved = resolveSchemaNode(document, fieldSchema)

  if (!isRecord(resolved)) {
    return undefined
  }

  return resolved.items
}

/**
 * Decides whether an array element must, may, or must never be JSON.parsed before
 * validation. The SDK JSON.stringifies object and array elements but emits scalar
 * elements as raw strings, so an items schema that only admits objects/arrays must
 * be parsed, a mixed (anyOf) items schema may be parsed, and a scalar-only items
 * schema must never be parsed.
 */
export const classifyArrayItemParseMode = (document: OpenApiDocument, itemsSchema: unknown): ArrayItemParseMode => {
  const branches = collectSchemaBranches(document, itemsSchema)

  if (branches.length === 0) {
    return 'never'
  }

  let nonScalarCount = 0

  for (const branch of branches) {
    if (branchAdmitsNonScalar(branch)) {
      nonScalarCount += 1
    }
  }

  if (nonScalarCount === 0) {
    return 'never'
  }

  if (nonScalarCount === branches.length) {
    return 'always'
  }

  return 'maybe'
}

const collectSchemaBranches = (document: OpenApiDocument, schema: unknown): Record<string, unknown>[] => {
  const resolved = resolveSchemaNode(document, schema)

  if (!isRecord(resolved)) {
    return []
  }

  const composite = readComposite(resolved)

  if (composite === undefined) {
    return [resolved]
  }

  return composite.flatMap(branch => collectSchemaBranches(document, branch))
}

const readComposite = (schema: Record<string, unknown>): unknown[] | undefined => {
  if (Array.isArray(schema.anyOf)) {
    return schema.anyOf
  }

  if (Array.isArray(schema.oneOf)) {
    return schema.oneOf
  }

  return undefined
}

const branchAdmitsNonScalar = (branch: Record<string, unknown>): boolean => {
  if (typeof branch.type === 'string') {
    return NON_SCALAR_TYPES.has(branch.type)
  }

  if (Array.isArray(branch.type)) {
    return branch.type.some(entry => typeof entry === 'string' && NON_SCALAR_TYPES.has(entry))
  }

  return false
}
