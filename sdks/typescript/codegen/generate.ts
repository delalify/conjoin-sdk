import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildRuntimePath,
  extractPathParams,
  lcfirst,
  operationIdToMethodName,
  type PathParam,
  parseTag,
  pluralize,
  toKebabCase,
  toPascalCase,
} from './utils'

const __filename = fileURLToPath(import.meta.url)
const __codegen_dir = resolve(__filename, '..')
const SPEC_PATH = resolve(__codegen_dir, '../../../spec/openapi.json')
const OUTPUT_DIR = resolve(__codegen_dir, '../src/generated/modules')

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

type OperationInfo = {
  operationId: string
  httpMethod: HttpMethod
  path: string
  pathParams: PathParam[]
  hasRequestBody: boolean
  successCode: string
  hasDataProperty: boolean
  isListResponse: boolean
  hasQueryParams: boolean
  tag: string
}

type ResourceGroup = {
  service: string
  resource: string
  servicePascal: string
  resourcePascal: string
  operations: OperationInfo[]
}

function loadSpec(): Record<string, unknown> {
  const raw = readFileSync(SPEC_PATH, 'utf-8')
  return JSON.parse(raw)
}

function getResponseSchemaProperties(
  operation: Record<string, unknown>,
  successCode: string,
): Record<string, unknown> | undefined {
  const responses = operation.responses as Record<string, Record<string, unknown>> | undefined
  if (!responses) return undefined

  const successResponse = responses[successCode]
  if (!successResponse) return undefined

  const content = successResponse.content as Record<string, Record<string, unknown>> | undefined
  if (!content) return undefined

  const jsonContent = content['application/json'] as Record<string, unknown> | undefined
  if (!jsonContent) return undefined

  const schema = jsonContent.schema as Record<string, unknown> | undefined
  if (!schema) return jsonContent

  const properties = schema.properties as Record<string, unknown> | undefined
  return properties || schema
}

function collectOperations(spec: Record<string, unknown>): ResourceGroup[] {
  const paths = spec.paths as Record<string, Record<string, Record<string, unknown>>>
  const groupMap = new Map<string, ResourceGroup>()

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation || typeof operation !== 'object') continue
      const tags = operation.tags as string[] | undefined
      if (!tags || tags.length === 0) continue

      const operationId = operation.operationId as string
      if (!operationId) continue

      const httpMethod = method as HttpMethod
      const tag = tags[0]
      const { service, resource } = parseTag(tag)

      if (!resource) continue

      const servicePascal = toPascalCase(service)
      const resourcePascal = toPascalCase(resource)
      const groupKey = `${service}-${toKebabCase(resource)}`

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          service,
          resource,
          servicePascal,
          resourcePascal,
          operations: [],
        })
      }

      const parameters = (operation.parameters || []) as Array<Record<string, unknown>>
      const pathParams = extractPathParams(path)
      const hasQuery = parameters.some(p => p.in === 'query')
      const hasBody = 'requestBody' in operation

      const successCode =
        Object.keys(operation.responses as Record<string, unknown>).find(c => c.startsWith('2')) || '200'
      const properties = getResponseSchemaProperties(operation, successCode)

      let hasData = false
      let isList = false
      if (properties) {
        hasData = 'data' in properties
        if (hasData) {
          const dataProp = properties.data as Record<string, unknown>
          isList = dataProp?.type === 'array'
        }
      }

      const group = groupMap.get(groupKey)
      if (group) {
        group.operations.push({
          operationId,
          httpMethod,
          path,
          pathParams,
          hasRequestBody: hasBody,
          successCode,
          hasDataProperty: hasData,
          isListResponse: isList,
          hasQueryParams: hasQuery,
          tag,
        })
      }
    }
  }

  return Array.from(groupMap.values())
}

function generateTypeAlias(op: OperationInfo, methodName: string): string {
  const lines: string[] = []
  const opId = op.operationId
  const pascal = methodName.charAt(0).toUpperCase() + methodName.slice(1)

  if (op.hasRequestBody) {
    lines.push(`type ${pascal}Body = operations['${opId}']['requestBody']['content']['application/json']`)
  }

  if (op.hasDataProperty && op.isListResponse) {
    lines.push(
      `type ${pascal}Data = NonNullable<operations['${opId}']['responses']['${op.successCode}']['content']['application/json']['data']>[number]`,
    )
  } else if (op.hasDataProperty) {
    lines.push(
      `type ${pascal}Data = NonNullable<operations['${opId}']['responses']['${op.successCode}']['content']['application/json']['data']>`,
    )
  } else {
    lines.push(
      `type ${pascal}Response = operations['${opId}']['responses']['${op.successCode}']['content']['application/json']`,
    )
  }

  if (op.hasQueryParams) {
    lines.push(`type ${pascal}Query = NonNullable<operations['${opId}']['parameters']['query']>`)
  }

  return lines.join('\n')
}

function generateMethodSignature(op: OperationInfo, methodName: string): string {
  const pascal = methodName.charAt(0).toUpperCase() + methodName.slice(1)
  const params: string[] = []

  for (const p of op.pathParams) {
    params.push(`${p.camelName}: string`)
  }

  if (op.hasRequestBody) {
    params.push(`data: ${pascal}Body`)
  }

  if (op.hasQueryParams && (op.isListResponse || op.httpMethod === 'get')) {
    params.push(`query?: ${pascal}Query`)
  }

  const runtimePath = buildRuntimePath(op.path, op.pathParams)
  const dataTypeName = op.hasDataProperty ? `${pascal}Data` : `${pascal}Response`
  const fetchMethod = op.isListResponse ? 'client.fetchList' : 'client.fetch'

  const options: string[] = []
  if (op.httpMethod !== 'get') {
    options.push(`method: '${op.httpMethod.toUpperCase()}'`)
  }
  if (op.hasRequestBody) {
    options.push('body: data')
  }
  if (op.hasQueryParams && (op.isListResponse || op.httpMethod === 'get')) {
    options.push('query: query as Record<string, unknown>')
  }

  const optionsStr = options.length > 0 ? `, { ${options.join(', ')} }` : ''
  const pathStr = op.pathParams.length > 0 ? `\`${runtimePath}\`` : `'${runtimePath}'`

  return `    ${methodName}: (${params.join(', ')}) =>\n      ${fetchMethod}<${dataTypeName}>(${pathStr}${optionsStr}),`
}

function resolveCollisions(entries: Array<{ name: string; op: OperationInfo }>, resourcePascal: string): void {
  const counts = new Map<string, number>()
  for (const e of entries) {
    counts.set(e.name, (counts.get(e.name) || 0) + 1)
  }

  for (const entry of entries) {
    if ((counts.get(entry.name) || 0) <= 1) continue

    if (entry.op.isListResponse) {
      const base = entry.name
      entry.name = base === 'read' || base === 'get' ? 'list' : `list${base.charAt(0).toUpperCase()}${base.slice(1)}`
    } else {
      const pluralResource = pluralize(resourcePascal)
      if (entry.op.operationId.includes(pluralResource)) {
        entry.name = pluralize(entry.name)
      }
    }
  }

  const finalCounts = new Map<string, number>()
  for (const e of entries) {
    finalCounts.set(e.name, (finalCounts.get(e.name) || 0) + 1)
  }
  for (const entry of entries) {
    if ((finalCounts.get(entry.name) || 0) > 1) {
      entry.name = lcfirst(entry.op.operationId)
    }
  }
}

function generateModuleFile(group: ResourceGroup): string {
  const lines: string[] = []

  lines.push("import type { ConjoinClient } from '../../core/types'")
  lines.push("import type { operations } from '../api-types'")
  lines.push('')

  const methodEntries: Array<{ name: string; op: OperationInfo }> = []

  for (const op of group.operations) {
    const methodName = operationIdToMethodName(op.operationId, group.servicePascal, group.resourcePascal)
    methodEntries.push({ name: methodName, op })
  }

  resolveCollisions(methodEntries, group.resourcePascal)

  const seenTypes = new Set<string>()
  for (const { name, op } of methodEntries) {
    const typeAlias = generateTypeAlias(op, name)
    for (const line of typeAlias.split('\n')) {
      const typeName = line.match(/^type (\w+)/)?.[1]
      if (typeName && !seenTypes.has(typeName)) {
        seenTypes.add(typeName)
        lines.push(line)
      }
    }
  }

  lines.push('')

  const factoryName = `create${group.servicePascal}${pluralize(group.resourcePascal)}`
  lines.push(`export function ${factoryName}(client: ConjoinClient) {`)
  lines.push('  return {')

  for (let i = 0; i < methodEntries.length; i++) {
    const { name, op } = methodEntries[i]
    lines.push(generateMethodSignature(op, name))
    if (i < methodEntries.length - 1) {
      lines.push('')
    }
  }

  lines.push('  }')
  lines.push('}')
  lines.push('')

  return lines.join('\n')
}

function generateBarrelIndex(groups: ResourceGroup[], service: string): string {
  const lines: string[] = []

  const serviceGroups = groups.filter(g => g.service === service).sort((a, b) => a.resource.localeCompare(b.resource))

  for (const group of serviceGroups) {
    const fileName = `${group.service}-${toKebabCase(group.resource)}`
    const factoryName = `create${group.servicePascal}${pluralize(group.resourcePascal)}`
    lines.push(`export { ${factoryName} } from './${fileName}'`)
  }

  lines.push('')
  return lines.join('\n')
}

function main() {
  console.log('Loading OpenAPI spec...')
  const spec = loadSpec()

  console.log('Collecting operations...')
  const groups = collectOperations(spec)

  console.log(`Found ${groups.length} resource groups`)

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const services = new Set<string>()

  for (const group of groups) {
    services.add(group.service)

    const fileName = `${group.service}-${toKebabCase(group.resource)}.ts`
    const filePath = resolve(OUTPUT_DIR, fileName)
    const content = generateModuleFile(group)

    writeFileSync(filePath, content, 'utf-8')
    console.log(`  Generated: ${fileName} (${group.operations.length} operations)`)
  }

  for (const service of services) {
    const indexPath = resolve(OUTPUT_DIR, `${service}-index.ts`)
    const indexContent = generateBarrelIndex(groups, service)
    writeFileSync(indexPath, indexContent, 'utf-8')
    console.log(`  Generated: ${service}-index.ts`)
  }

  console.log('Done!')
}

main()
