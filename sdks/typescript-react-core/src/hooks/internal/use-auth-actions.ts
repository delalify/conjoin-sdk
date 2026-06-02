import { useContext } from 'react'
import { type ConjoinAuthActions, ConjoinAuthActionsContext } from '../../provider/contexts'

export function useAuthActions(): ConjoinAuthActions {
  const actions = useContext(ConjoinAuthActionsContext)
  if (!actions) {
    throw new Error('useAuthActions must be used within a ConjoinProvider')
  }
  return actions
}
