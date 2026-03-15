import type { ReactNode } from 'react'
import { ConjoinProviderCore } from '../react/provider/core'
import type { ConjoinSdkConfig } from '../react/provider/types'
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
