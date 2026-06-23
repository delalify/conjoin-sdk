import type { operations } from '../generated/frontend-api-types'

export { FRONTEND_PATHS, type FrontendOperationId } from '../generated/frontend-paths'

export type AuthFlowOperations = operations

export type AuthFlowRequestBody<Id extends keyof operations> = operations[Id] extends {
  requestBody: { content: { 'application/json': infer Body } }
}
  ? Body
  : never

export type AuthFlowResponseData<Id extends keyof operations> = operations[Id]['responses'] extends {
  200: { content: { 'application/json': { data?: infer Data } } }
}
  ? NonNullable<Data>
  : never
