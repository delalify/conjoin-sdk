export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

export type ChatMessage = {
  role: ChatRole
  content: string | null
  name?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export type ToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export type ToolDefinition = {
  type: 'function'
  function: {
    name: string
    description?: string
    parameters?: Record<string, unknown>
  }
}

export type ChatCompletionParams = {
  model: string
  messages: ChatMessage[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  stop?: string | string[]
  tools?: ToolDefinition[]
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } }
  response_format?: { type: 'text' | 'json_object' }
  stream?: boolean
  user?: string
}

export type ChatCompletionChoice = {
  index: number
  message: ChatMessage
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
}

export type ChatCompletionUsage = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export type ChatCompletionResponse = {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: ChatCompletionChoice[]
  usage?: ChatCompletionUsage
}

export type ChatCompletionChunkDelta = {
  role?: ChatRole
  content?: string | null
  tool_calls?: Array<{
    index: number
    id?: string
    type?: 'function'
    function?: {
      name?: string
      arguments?: string
    }
  }>
}

export type ChatCompletionChunk = {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: Array<{
    index: number
    delta: ChatCompletionChunkDelta
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
  }>
  usage?: ChatCompletionUsage
}
