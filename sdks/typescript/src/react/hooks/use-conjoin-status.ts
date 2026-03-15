import { useContext } from 'react'
import { ConjoinClientContext } from '../provider/contexts'

type ConjoinStatus = { status: 'loading' } | { status: 'ready' } | { status: 'error'; error: Error }

export function useConjoinStatus(): ConjoinStatus {
  const context = useContext(ConjoinClientContext)
  if (!context) {
    throw new Error('useConjoinStatus must be used within a ConjoinProvider')
  }

  if (!context.isConfigLoaded) {
    return { status: 'loading' }
  }

  if (!context.sdkConfig) {
    return { status: 'error', error: new Error('Failed to load SDK configuration') }
  }

  return { status: 'ready' }
}
