export type HasParams = { role: string } | { permission: string }

export type AuthObject = {
  accountId: string
  sessionId: string
  clientId: string
  appId: string
  liveMode: boolean
  organizationId: string | null
  organizationRoles: string[]
  has: (params: HasParams) => boolean
  getToken: () => string
}

export type ProxyAuthObject = Omit<AuthObject, 'getToken'>

export type NextAdapterConfig = {
  secretKey?: string
  publishableKey?: string
  jwksUrl?: string
  authDomain?: string
}
