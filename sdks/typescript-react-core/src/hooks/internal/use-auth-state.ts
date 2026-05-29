import { useContext } from 'react'
import { ConjoinAuthContext } from '../../provider/contexts'
import type { ConjoinAuthState } from '../../provider/types'

export function useAuthState(): ConjoinAuthState {
  const context = useContext(ConjoinAuthContext)
  if (!context) {
    throw new Error('useAuthState must be used within a ConjoinProvider')
  }
  return context.authState
}
