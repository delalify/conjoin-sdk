import { ConjoinError } from '../core/errors'
import type { ConjoinClient } from '../core/types'
import { iterSSEMessages } from './sse'
import type { ChatCompletionChunk, ChatCompletionParams, ChatCompletionResponse } from './types'

export type ChatStreamOptions = {
  signal?: AbortSignal
}

export type ChatStream = AsyncIterable<ChatCompletionChunk> & {
  controller: AbortController
}

export function createAiChat(client: ConjoinClient) {
  return {
    async complete(
      params: Omit<ChatCompletionParams, 'stream'>,
      options?: ChatStreamOptions,
    ): Promise<ChatCompletionResponse> {
      return client.fetch<ChatCompletionResponse>('ai/chat/completions', {
        method: 'POST',
        body: { ...params, stream: false },
        signal: options?.signal,
      })
    },

    stream(params: Omit<ChatCompletionParams, 'stream'>, options?: ChatStreamOptions): ChatStream {
      const controller = new AbortController()

      const signals = [controller.signal]
      if (options?.signal) signals.push(options.signal)
      const combinedSignal = AbortSignal.any(signals)

      const iterator = createStreamIterator(client, params, combinedSignal)

      return {
        controller,
        [Symbol.asyncIterator]() {
          let consumed = false
          return {
            async next() {
              const result = await iterator.next()
              if (result.done) consumed = true
              return result
            },
            async return(value) {
              if (!consumed) controller.abort()
              return iterator.return(value)
            },
            async throw(error) {
              controller.abort()
              return iterator.throw(error)
            },
          }
        },
      }
    },
  }
}

async function* createStreamIterator(
  client: ConjoinClient,
  params: Omit<ChatCompletionParams, 'stream'>,
  signal: AbortSignal,
): AsyncGenerator<ChatCompletionChunk> {
  const response = await client.fetchRaw('ai/chat/completions', {
    method: 'POST',
    body: { ...params, stream: true },
    signal,
  })

  if (!response.ok) {
    let body: Record<string, unknown> = {}
    try {
      body = (await response.json()) as Record<string, unknown>
    } catch {
      /* empty */
    }
    const message = typeof body.message === 'string' ? body.message : response.statusText
    const requestId = response.headers.get('x-request-id') ?? undefined
    throw new ConjoinError(message, response.status, 'api_error', requestId)
  }

  if (!response.body) {
    throw new ConjoinError('Response body is empty', response.status, 'api_error')
  }

  for await (const event of iterSSEMessages(response.body)) {
    if (event.data === '[DONE]') return
    try {
      const chunk = JSON.parse(event.data) as ChatCompletionChunk | { error: { message: string } }
      if ('error' in chunk) {
        throw new ConjoinError(
          chunk.error.message,
          response.status,
          'stream_error',
          response.headers.get('x-request-id') ?? undefined,
        )
      }
      yield chunk as ChatCompletionChunk
    } catch (error) {
      if (error instanceof ConjoinError) throw error
      throw new ConjoinError(
        `Failed to parse SSE chunk: ${event.data}`,
        response.status,
        'parse_error',
        response.headers.get('x-request-id') ?? undefined,
      )
    }
  }
}
