import type { ConjoinClient } from '../../core/types'
import type { operations } from '../api-types'

type CreateChatCompletionBody = operations['createAiChatCompletion']['requestBody']['content']['application/json']
type CreateChatCompletionData = NonNullable<operations['createAiChatCompletion']['responses']['200']['content']['application/json']['data']>
type CreateAiMultiModelBody = operations['createAiMultiModelInference']['requestBody']['content']['application/json']
type CreateAiMultiModelData = NonNullable<operations['createAiMultiModelInference']['responses']['200']['content']['application/json']['data']>
type CreateAiBestOfNBody = operations['createAiBestOfNInference']['requestBody']['content']['application/json']
type CreateAiBestOfNData = NonNullable<operations['createAiBestOfNInference']['responses']['200']['content']['application/json']['data']>
type ListRequestsData = NonNullable<operations['listAiInferenceRequests']['responses']['200']['content']['application/json']['data']>[number]
type ListRequestsQuery = NonNullable<operations['listAiInferenceRequests']['parameters']['query']>
type ReadRequestData = NonNullable<operations['readAiInferenceRequest']['responses']['200']['content']['application/json']['data']>

export function createAiInferences(client: ConjoinClient) {
  return {
    createChatCompletion: (data: CreateChatCompletionBody) =>
      client.fetch<CreateChatCompletionData>('ai/inference/chat/completions', { method: 'POST', body: data }),

    createAiMultiModel: (data: CreateAiMultiModelBody) =>
      client.fetch<CreateAiMultiModelData>('ai/inference/multi-model', { method: 'POST', body: data }),

    createAiBestOfN: (data: CreateAiBestOfNBody) =>
      client.fetch<CreateAiBestOfNData>('ai/inference/best-of-n', { method: 'POST', body: data }),

    listRequests: (query?: ListRequestsQuery) =>
      client.fetchList<ListRequestsData>('ai/inference/requests', { query: query as Record<string, unknown> }),

    readRequest: (requestId: string) =>
      client.fetch<ReadRequestData>(`ai/inference/requests/${requestId}`),
  }
}
