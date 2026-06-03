import { useContext } from 'react'
import { ConjoinClientContext, type ConjoinClientContextValue } from '../../provider/contexts'

export function useConjoinClient(): ConjoinClientContextValue {
  const context = useContext(ConjoinClientContext)
  if (!context) {
    throw new Error('useConjoinClient must be used within a ConjoinProvider')
  }
  return context
}
