import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { verifyToken } from '../server/tokens'
import { getJwksUrl, resolveConfig } from './config'
import { toProxyAuthObject } from './identity'
import type { AuthObject, NextAdapterConfig } from './types'

const COOKIE_SESSION_TOKEN = '__conjoin_auth_sess'

async function resolveAuth(overrides?: Partial<NextAdapterConfig>): Promise<AuthObject | null> {
  const config = resolveConfig(overrides)
  const jwksUrl = getJwksUrl(config)

  const headerStore = await headers()
  const cookieStore = await cookies()

  const bearerHeader = headerStore.get('authorization')
  const bearerToken = bearerHeader?.startsWith('Bearer ') ? bearerHeader.slice(7) : null

  const cookieToken = cookieStore.get(COOKIE_SESSION_TOKEN)?.value

  const token = bearerToken ?? cookieToken
  if (!token) return null

  try {
    const verified = await verifyToken(token, { jwksUrl })

    return {
      ...toProxyAuthObject(verified),
      getToken: () => token,
    }
  } catch {
    return null
  }
}

export const auth = cache(resolveAuth)
