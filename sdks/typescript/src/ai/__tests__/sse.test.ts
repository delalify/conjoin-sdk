import { describe, expect, it } from 'vitest'
import { iterSSEMessages } from '../sse'

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

const collectEvents = async (body: ReadableStream<Uint8Array>) => {
  const events = []

  for await (const event of iterSSEMessages(body)) {
    events.push(event)
  }

  return events
}

describe('iterSSEMessages', () => {
  it('parses events split across stream chunks', async () => {
    const events = await collectEvents(streamFrom(['event: chunk\ndata: {"hel', 'lo":', 'true}\n\n']))

    expect(events).toEqual([
      {
        event: 'chunk',
        data: '{"hello":true}',
      },
    ])
  })

  it('joins multi-line data fields and ignores comments', async () => {
    const events = await collectEvents(streamFrom([':keepalive\nevent: delta\ndata: first\r\ndata: second\n\n']))

    expect(events).toEqual([
      {
        event: 'delta',
        data: 'first\nsecond',
      },
    ])
  })

  it('flushes the final buffered event when the stream ends without a separator', async () => {
    const events = await collectEvents(streamFrom(['data: final']))

    expect(events).toEqual([{ event: undefined, data: 'final' }])
  })

  it('skips chunks that do not contain data fields', async () => {
    const events = await collectEvents(
      streamFrom(['\n:comment\nevent: ignored\nmalformed\nid: 1\n\n', 'data: kept\n\n']),
    )

    expect(events).toEqual([{ event: undefined, data: 'kept' }])
  })

  it('skips a final buffered event when it has no data fields', async () => {
    const events = await collectEvents(streamFrom(['event: ignored']))

    expect(events).toEqual([])
  })
})
