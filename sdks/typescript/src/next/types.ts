export type AuthObject = {
  accountId: string
  sessionId: string
  organizationId: string | null
  organizationRole: string | null
  getToken: () => string
}

export type NextAdapterConfig = {
  secretKey?: string
  publishableKey?: string
  jwksUrl?: string
  authDomain?: string
}
