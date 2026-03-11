export class ConjoinError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId?: string

  constructor(message: string, status: number, code: string, requestId?: string) {
    super(message)
    this.name = 'ConjoinError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

export class ConjoinAuthenticationError extends ConjoinError {
  constructor(message: string, requestId?: string) {
    super(message, 401, 'authentication_error', requestId)
    this.name = 'ConjoinAuthenticationError'
  }
}

export class ConjoinRateLimitError extends ConjoinError {
  readonly retryAfter?: number

  constructor(message: string, retryAfter?: number, requestId?: string) {
    super(message, 429, 'rate_limit_error', requestId)
    this.name = 'ConjoinRateLimitError'
    this.retryAfter = retryAfter
  }
}

export type ValidationFieldError = {
  message: string
  path: string
}

export class ConjoinValidationError extends ConjoinError {
  readonly errors: ValidationFieldError[]

  constructor(message: string, status: number, errors: ValidationFieldError[], requestId?: string) {
    super(message, status, 'validation_error', requestId)
    this.name = 'ConjoinValidationError'
    this.errors = errors
  }
}

export class ConjoinNetworkError extends ConjoinError {
  constructor(message: string) {
    super(message, 0, 'network_error')
    this.name = 'ConjoinNetworkError'
  }
}

export class ConjoinTimeoutError extends ConjoinError {
  constructor(message: string) {
    super(message, 0, 'timeout_error')
    this.name = 'ConjoinTimeoutError'
  }
}
