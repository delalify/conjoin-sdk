import { createConjoinClient } from '../core/client'
import { auth } from './auth'
import { resolveConfig } from './config'
import type { NextAdapterConfig } from './types'

type Account = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export async function currentAccount(overrides?: Partial<NextAdapterConfig>): Promise<Account | null> {
  const authObj = await auth(overrides)
  if (!authObj) return null

  const config = resolveConfig(overrides)
  const client = createConjoinClient({
    apiKey: config.secretKey,
  })

  const account = await client.fetch<Account>('auth/self', {
    headers: { Authorization: `Bearer ${authObj.getToken()}` },
  })

  return account
}
