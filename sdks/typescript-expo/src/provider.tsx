import { ConjoinProviderCore, type ConjoinSdkConfig } from '@conjoin-cloud/react-core'
import type { ReactNode } from 'react'
import { createNativeTransport } from './transport/native'

const nativeTransport = createNativeTransport()

type ExpoProviderProps = {
  publishableKey: string
  children: ReactNode
  config?: Partial<ConjoinSdkConfig>
}

export function ConjoinProvider({ publishableKey, children, config }: ExpoProviderProps) {
  return (
    <ConjoinProviderCore publishableKey={publishableKey} config={config} transport={nativeTransport}>
      {children}
    </ConjoinProviderCore>
  )
}
