import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { verifyToken } from '../server/tokens'
import { getJwksUrl, resolveConfig } from './config'
import type { AuthObject, NextAdapterConfig } from './types'

const COOKIE_ACCESS_TOKEN = '__conjoin_auth_at'

async function resolveAuth(overrides?: Partial<NextAdapterConfig>): Promise<AuthObject | null> {
  const config = resolveConfig(overrides)
  const jwksUrl = getJwksUrl(config)

  const headerStore = await headers()
  const cookieStore = await cookies()

  const bearerHeader = headerStore.get('authorization')
  const bearerToken = bearerHeader?.startsWith('Bearer ') ? bearerHeader.slice(7) : null

  const cookieToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value

  const token = bearerToken ?? cookieToken
  if (!token) return null

  try {
    const verified = await verifyToken(token, { jwksUrl })

    return {
      accountId: verified.accountId,
      sessionId: verified.sessionId,
      organizationId: verified.organizationId,
      organizationRole: verified.organizationRole,
      getToken: () => token,
    }
  } catch {
    return null
  }
}

export const auth = cache(resolveAuth)
