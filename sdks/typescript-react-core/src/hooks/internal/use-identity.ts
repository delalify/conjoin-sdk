import { useContext } from 'react'
import { ConjoinIdentityContext } from '../../provider/contexts'
import type { IdentityHydration } from '../../provider/identity-types'

export function useIdentity(): IdentityHydration {
  const identity = useContext(ConjoinIdentityContext)
  if (!identity) {
    throw new Error('useIdentity must be used within a ConjoinProvider')
  }
  return identity
}
