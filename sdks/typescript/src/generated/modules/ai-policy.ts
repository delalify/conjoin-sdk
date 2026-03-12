import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CheckBody = operations['checkAiPolicy']['requestBody']['content']['application/json']
type CheckData = NonNullable<operations['checkAiPolicy']['responses']['200']['content']['application/json']['data']>
type CreateRuleBody = operations['createAiPolicyRule']['requestBody']['content']['application/json']
type CreateRuleData = NonNullable<
  operations['createAiPolicyRule']['responses']['201']['content']['application/json']['data']
>
type ListRulesData = NonNullable<
  operations['listAiPolicyRules']['responses']['200']['content']['application/json']['data']
>[number]
type ListRulesQuery = NonNullable<operations['listAiPolicyRules']['parameters']['query']>
type ReadRuleData = NonNullable<
  operations['readAiPolicyRule']['responses']['200']['content']['application/json']['data']
>
type UpdateRuleBody = operations['updateAiPolicyRule']['requestBody']['content']['application/json']
type UpdateRuleData = NonNullable<
  operations['updateAiPolicyRule']['responses']['200']['content']['application/json']['data']
>
type DeleteRuleData = NonNullable<
  operations['deleteAiPolicyRule']['responses']['200']['content']['application/json']['data']
>
type ListLogsData = NonNullable<
  operations['listAiPolicyLogs']['responses']['200']['content']['application/json']['data']
>[number]
type ListLogsQuery = NonNullable<operations['listAiPolicyLogs']['parameters']['query']>

export function createAiPolicies(client: ConjoinClient) {
  return {
    check: (data: CheckBody) => client.fetch<CheckData>('ai/policy/policy/check', { method: 'POST', body: data }),

    createRule: (data: CreateRuleBody) =>
      client.fetch<CreateRuleData>('ai/policy/policy/rules/create', { method: 'POST', body: data }),

    listRules: (query?: ListRulesQuery) =>
      client.fetchList<ListRulesData>('ai/policy/policy/rules', { query: query as Record<string, unknown> }),

    readRule: (ruleId: string) => client.fetch<ReadRuleData>(`ai/policy/policy/rules/${ruleId}`),

    updateRule: (ruleId: string, data: UpdateRuleBody) =>
      client.fetch<UpdateRuleData>(`ai/policy/policy/rules/${ruleId}/update`, { method: 'PATCH', body: data }),

    deleteRule: (ruleId: string) =>
      client.fetch<DeleteRuleData>(`ai/policy/policy/rules/${ruleId}/delete`, { method: 'DELETE' }),

    listLogs: (query?: ListLogsQuery) =>
      client.fetchList<ListLogsData>('ai/policy/policy/logs', { query: query as Record<string, unknown> }),
  }
}
