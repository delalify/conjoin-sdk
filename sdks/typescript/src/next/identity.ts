import type { VerifiedToken } from '../server/tokens'
import type { HasParams, ProxyAuthObject } from './types'

export function buildHas(organizationRoles: string[]): (params: HasParams) => boolean {
  const roleSet = new Set(organizationRoles)

  return (params: HasParams): boolean => {
    if ('role' in params) {
      return roleSet.has(params.role)
    }

    return false
  }
}

export function toProxyAuthObject(verified: VerifiedToken): ProxyAuthObject {
  return {
    accountId: verified.accountId,
    sessionId: verified.sessionId,
    clientId: verified.clientId,
    appId: verified.appId,
    liveMode: verified.liveMode,
    organizationId: verified.organizationId,
    organizationRoles: verified.organizationRoles,
    has: buildHas(verified.organizationRoles),
  }
}
