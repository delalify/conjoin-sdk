import { useContext } from 'react'
import { ConjoinAuthStateContext } from '../../provider/contexts'
import type { ConjoinAuthState } from '../../provider/types'

export function useAuthState(): ConjoinAuthState {
  const state = useContext(ConjoinAuthStateContext)
  if (!state) {
    throw new Error('useAuthState must be used within a ConjoinProvider')
  }
  return state
}
