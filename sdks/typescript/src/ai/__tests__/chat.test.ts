import { describe, expect, it, vi } from 'vitest'
import { ConjoinError } from '../../core/errors'
import { CONJOIN_REQUEST_ID_HEADER } from '../../core/request-tracing'
import type { ConjoinClient, ResolvedConfig } from '../../core/types'
import { DEFAULT_API_VERSION } from '../../core/version'
import { createAiInferences } from '../../generated/modules/ai-inference'
import { createAiChat } from '../chat'
import type { ChatCompletionChunk, ChatCompletionParams, ChatCompletionResponse } from '../types'

const config: ResolvedConfig = Object.freeze({
  apiKey: 'ck_test_123',
  apiVersion: DEFAULT_API_VERSION,
  baseUrl: 'https://api.conjoin.cloud',
  retry: Object.freeze({ backoffMs: 100, maxRetries: 0 }),
  timeout: 30_000,
})

const chatParams: Omit<ChatCompletionParams, 'stream'> = {
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'conjoin-test',
}

const chatResponse: ChatCompletionResponse = {
  choices: [
    {
      finish_reason: 'stop',
      index: 0,
      message: { role: 'assistant', content: 'Hello back' },
    },
  ],
  created: 1,
  id: 'chatcmpl_123',
  model: 'conjoin-test',
  object: 'chat.completion',
}

const chatChunk: ChatCompletionChunk = {
  choices: [
    {
      delta: { content: 'Hello' },
      finish_reason: null,
      index: 0,
    },
  ],
  created: 1,
  id: 'chatcmpl_chunk_123',
  model: 'conjoin-test',
  object: 'chat.completion.chunk',
}

const createMockClient = (overrides: Partial<ConjoinClient> = {}): ConjoinClient => ({
  config,
  fetch: vi.fn(),
  fetchList: vi.fn(),
  fetchListWithResponse: vi.fn(),
  fetchRaw: vi.fn(),
  fetchWithResponse: vi.fn(),
  withRequestTrace: vi.fn(),
  ...overrides,
})

const encode = (value: string): Uint8Array => new TextEncoder().encode(value)

const streamFrom = (chunks: string[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encode(chunk))
      }
      controller.close()
    },
  })

describe('createAiChat', () => {
  it('uses the same endpoint as the generated chat completion resource', async () => {
    const client = createMockClient({
      fetch: vi.fn().mockResolvedValue(chatResponse),
      fetchRaw: vi.fn().mockResolvedValue(new Response(streamFrom(['data: [DONE]\n\n']), { status: 200 })),
    })

    await createAiInferences(client).createChatCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'conjoin-test',
      stream: false,
    })
    const generatedPath = vi.mocked(client.fetch).mock.calls[0]?.[0]

    await createAiChat(client).complete(chatParams)
    const helperCompletePath = vi.mocked(client.fetch).mock.calls[1]?.[0]

    for await (const _chunk of createAiChat(client).stream(chatParams)) {
      throw new Error('DONE-only stream should not yield chunks')
    }
    const helperStreamPath = vi.mocked(client.fetchRaw).mock.calls[0]?.[0]

    expect(helperCompletePath).toBe(generatedPath)
    expect(helperStreamPath).toBe(generatedPath)
  })

  it('requests a non-streaming chat completion', async () => {
    const signal = new AbortController().signal
    const client = createMockClient({
      fetch: vi.fn().mockResolvedValue(chatResponse),
    })

    const result = await createAiChat(client).complete(chatParams, { signal })

    expect(result).toEqual(chatResponse)
    expect(client.fetch).toHaveBeenCalledWith('ai/inference/chat/completions', {
      method: 'POST',
      body: { ...chatParams, stream: false },
      signal,
    })
  })

  it('streams chat completion chunks until the DONE sentinel', async () => {
    const client = createMockClient({
      fetchRaw: vi
        .fn()
        .mockResolvedValue(
          new Response(
            streamFrom([`data: ${JSON.stringify(chatChunk)}\n\n`, 'data: [DONE]\n\n', 'data: ignored\n\n']),
            { status: 200 },
          ),
        ),
    })

    const stream = createAiChat(client).stream(chatParams)
    const chunks = []

    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual([chatChunk])
    expect(client.fetchRaw).toHaveBeenCalledWith('ai/inference/chat/completions', {
      method: 'POST',
      body: { ...chatParams, stream: true },
      signal: expect.any(AbortSignal),
    })
  })

  it('combines caller abort signals with the stream controller signal', async () => {
    const callerController = new AbortController()
    const client = createMockClient({
      fetchRaw: vi.fn().mockResolvedValue(new Response(streamFrom(['data: [DONE]\n\n']), { status: 200 })),
    })

    callerController.abort()
    const stream = createAiChat(client).stream(chatParams, { signal: callerController.signal })

    for await (const _chunk of stream) {
      throw new Error('aborted stream should not yield chunks')
    }

    const request = vi.mocked(client.fetchRaw).mock.calls[0]?.[1]
    expect(request?.signal?.aborted).toBe(true)
  })

  it('aborts the stream controller when iteration stops early', async () => {
    const client = createMockClient({
      fetchRaw: vi.fn().mockResolvedValue(
        new Response(streamFrom([`data: ${JSON.stringify(chatChunk)}\n\n`, `data: ${JSON.stringify(chatChunk)}\n\n`]), {
          status: 200,
        }),
      ),
    })

    const stream = createAiChat(client).stream(chatParams)

    for await (const _chunk of stream) {
      break
    }

    expect(stream.controller.signal.aborted).toBe(true)
  })

  it('does not abort the stream controller when iteration has already completed', async () => {
    const client = createMockClient({
      fetchRaw: vi.fn().mockResolvedValue(new Response(streamFrom(['data: [DONE]\n\n']), { status: 200 })),
    })

    const stream = createAiChat(client).stream(chatParams)
    const iterator = stream[Symbol.asyncIterator]()

    await expect(iterator.next()).resolves.toEqual({ done: true, value: undefined })
    await iterator.return?.(undefined)

    expect(stream.controller.signal.aborted).toBe(false)
  })

  it('aborts the stream controller when iteration throws', async () => {
    const client = createMockClient({
      fetchRaw: vi
        .fn()
        .mockResolvedValue(new Response(streamFrom([`data: ${JSON.stringify(chatChunk)}\n\n`]), { status: 200 })),
    })

    const stream = createAiChat(client).stream(chatParams)
    const iterator = stream[Symbol.asyncIterator]()

    await expect(iterator.throw?.(new Error('stop'))).rejects.toThrow('stop')
    expect(stream.controller.signal.aborted).toBe(true)
  })

  it('throws an API error with response JSON details when the stream request fails', async () => {
    const client = createMockClient({
      fetchRaw: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Invalid model' }), {
          headers: { [CONJOIN_REQUEST_ID_HEADER]: 'req_123' },
          status: 400,
          statusText: 'Bad Request',
        }),
      ),
    })

    await expect(async () => {
      for await (const _chunk of createAiChat(client).stream(chatParams)) {
        throw new Error('failed stream should not yield chunks')
      }
    }).rejects.toMatchObject({
      code: 'api_error',
      message: 'Invalid model',
      requestId: 'req_123',
      status: 400,
    })
  })

  it('uses status text when the failed stream response is not JSON', async () => {
    const client = createMockClient({
      fetchRaw: vi.fn().mockResolvedValue(new Response('not-json', { status: 502, statusText: 'Bad Gateway' })),
    })

    await expect(async () => {
      for await (const _chunk of createAiChat(client).stream(chatParams)) {
        throw new Error('failed stream should not yield chunks')
      }
    }).rejects.toMatchObject({
      code: 'api_error',
      message: 'Bad Gateway',
      status: 502,
    })
  })

  it('throws when a successful stream response has no body', async () => {
    const client = createMockClient({
      fetchRaw: vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    })

    await expect(async () => {
      for await (const _chunk of createAiChat(client).stream(chatParams)) {
        throw new Error('empty stream should not yield chunks')
      }
    }).rejects.toMatchObject({
      code: 'api_error',
      message: 'Response body is empty',
    })
  })

  it('throws stream errors from SSE chunks', async () => {
    const client = createMockClient({
      fetchRaw: vi.fn().mockResolvedValue(
        new Response(streamFrom(['data: {"error":{"message":"quota exceeded"}}\n\n']), {
          headers: { [CONJOIN_REQUEST_ID_HEADER]: 'req_stream' },
          status: 200,
        }),
      ),
    })

    await expect(async () => {
      for await (const _chunk of createAiChat(client).stream(chatParams)) {
        throw new Error('error stream should not yield chunks')
      }
    }).rejects.toMatchObject({
      code: 'stream_error',
      message: 'quota exceeded',
      requestId: 'req_stream',
    })
  })

  it('throws parse errors for malformed SSE chunks', async () => {
    const client = createMockClient({
      fetchRaw: vi.fn().mockResolvedValue(
        new Response(streamFrom(['data: not-json\n\n']), {
          headers: { [CONJOIN_REQUEST_ID_HEADER]: 'req_parse' },
          status: 200,
        }),
      ),
    })

    await expect(async () => {
      for await (const _chunk of createAiChat(client).stream(chatParams)) {
        throw new Error('malformed stream should not yield chunks')
      }
    }).rejects.toBeInstanceOf(ConjoinError)
  })

  it('throws stream and parse errors without request IDs when no request header is present', async () => {
    const streamErrorClient = createMockClient({
      fetchRaw: vi.fn().mockResolvedValue(
        new Response(streamFrom(['data: {"error":{"message":"stream failed"}}\n\n']), {
          status: 200,
        }),
      ),
    })
    const parseErrorClient = createMockClient({
      fetchRaw: vi.fn().mockResolvedValue(new Response(streamFrom(['data: malformed\n\n']), { status: 200 })),
    })

    await expect(async () => {
      for await (const _chunk of createAiChat(streamErrorClient).stream(chatParams)) {
        throw new Error('error stream should not yield chunks')
      }
    }).rejects.toMatchObject({
      requestId: undefined,
    })
    await expect(async () => {
      for await (const _chunk of createAiChat(parseErrorClient).stream(chatParams)) {
        throw new Error('malformed stream should not yield chunks')
      }
    }).rejects.toMatchObject({
      requestId: undefined,
    })
  })
})
