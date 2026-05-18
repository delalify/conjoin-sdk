import type { ErrorObject } from 'ajv'
import type { OpenApiDocument, OpenApiReference, OpenApiValidationError } from './openapi-types'

export const resolveOpenApiReference = <T>(document: OpenApiDocument, ref: string): T => {
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

export const isOpenApiReference = (value: unknown): value is OpenApiReference =>
  isRecord(value) && typeof value.$ref === 'string'

export const createSchemaWithComponents = (
  schema: unknown,
  components: Record<string, unknown> | undefined,
): boolean | Record<string, unknown> => {
  if (typeof schema === 'boolean') {
    return schema
  }

  if (!isRecord(schema)) {
    throw new Error('OpenAPI schema must be an object or boolean schema')
  }

  return {
    ...schema,
    components,
  }
}

export const formatValidationErrors = (
  prefix: string,
  errors: ErrorObject[] | null | undefined,
): OpenApiValidationError[] => {
  if (!errors || errors.length === 0) {
    return [
      {
        path: prefix,
        message: 'is invalid',
      },
    ]
  }

  return errors.slice(0, 10).map(error => ({
    path: `${prefix}${error.instancePath}`,
    message: error.message ?? 'is invalid',
  }))
}

export const formatAjvErrors = (errors: ErrorObject[] | null | undefined): string => {
  if (!errors || errors.length === 0) {
    return 'unknown validation error'
  }

  return errors
    .slice(0, 5)
    .map(error => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
    .join('; ')
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const decodeJsonPointerSegment = (segment: string): string => segment.replaceAll('~1', '/').replaceAll('~0', '~')
