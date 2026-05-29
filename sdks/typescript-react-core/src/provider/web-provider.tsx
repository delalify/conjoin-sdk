import type React from 'react'
import { useMemo } from 'react'
import { useSystemTheme } from '../theme/dark-mode'
import { resolveThemeVariables } from '../theme/resolve'
import { createWebTransport } from '../transport/web'
import { ConjoinThemeContext } from './contexts'
import { ConjoinProviderCore } from './core'
import type { ConjoinProviderProps, ConjoinThemeState } from './types'

const webTransport = createWebTransport()

export function ConjoinProvider({ publishableKey, children, config, appearance, cssLayerName }: ConjoinProviderProps) {
  const systemTheme = useSystemTheme()
  const themePreference = appearance?.theme ?? 'system'
  const resolvedMode = themePreference === 'system' ? systemTheme : themePreference

  const branding = config?.branding ?? null

  const cssVariables = useMemo(
    () => resolveThemeVariables(resolvedMode, branding, appearance?.variables),
    [resolvedMode, branding, appearance?.variables],
  )

  const themeState = useMemo<ConjoinThemeState>(
    () => ({ mode: resolvedMode, branding, cssVariables }),
    [resolvedMode, branding, cssVariables],
  )

  const style = useMemo(() => {
    const vars: Record<string, string> = { display: 'contents' }
    for (const [key, value] of Object.entries(cssVariables)) {
      vars[key] = value
    }
    return vars as React.CSSProperties
  }, [cssVariables])

  return (
    <ConjoinProviderCore publishableKey={publishableKey} config={config} transport={webTransport}>
      <ConjoinThemeContext.Provider value={themeState}>
        <div
          data-conjoin-provider=""
          data-theme={resolvedMode}
          {...(cssLayerName ? { 'data-css-layer': cssLayerName } : {})}
          style={style}
        >
          {children}
        </div>
      </ConjoinThemeContext.Provider>
    </ConjoinProviderCore>
  )
}
