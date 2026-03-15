import type { ColorPalette, ConjoinBranding } from '../provider/types'
import {
  DEFAULT_ANIMATION,
  DEFAULT_BORDERS,
  DEFAULT_DARK_COLORS,
  DEFAULT_LAYOUT,
  DEFAULT_LIGHT_COLORS,
  DEFAULT_SHADOWS,
  DEFAULT_SPACING,
  DEFAULT_TYPOGRAPHY,
} from './defaults'
import {
  ANIMATION_VARIABLE_MAP,
  BORDER_VARIABLE_MAP,
  CSS_VARIABLE_MAP,
  LAYOUT_VARIABLE_MAP,
  SHADOW_VARIABLE_MAP,
  SPACING_VARIABLE_MAP,
  TYPOGRAPHY_VARIABLE_MAP,
} from './variables'

function mergeColors(
  defaults: ColorPalette,
  branding: Partial<ColorPalette> | undefined,
  overrides: Partial<ColorPalette> | undefined,
): ColorPalette {
  return { ...defaults, ...branding, ...overrides }
}

function mapSection(
  source: Record<string, string | number | boolean | null>,
  defaults: Record<string, string>,
  variableMap: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, cssVar] of Object.entries(variableMap)) {
    const value = source[key]
    if (value != null && typeof value !== 'boolean') {
      result[cssVar] = String(value)
    } else if (defaults[key] != null) {
      result[cssVar] = defaults[key]
    }
  }
  return result
}

export function resolveThemeVariables(
  mode: 'light' | 'dark',
  branding: ConjoinBranding | null,
  overrides?: Partial<ColorPalette>,
): Record<string, string> {
  const defaultColors = mode === 'light' ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS
  const brandingColors = branding?.colors?.[mode]
  const resolved = mergeColors(defaultColors, brandingColors, overrides)

  const colorVars: Record<string, string> = {}
  for (const [key, cssVar] of Object.entries(CSS_VARIABLE_MAP)) {
    colorVars[cssVar] = resolved[key as keyof ColorPalette]
  }

  const typographyVars = mapSection(
    (branding?.typography ?? {}) as Record<string, string | null>,
    DEFAULT_TYPOGRAPHY,
    TYPOGRAPHY_VARIABLE_MAP,
  )

  const borderVars = mapSection(
    (branding?.borders ?? {}) as Record<string, string | null>,
    DEFAULT_BORDERS,
    BORDER_VARIABLE_MAP,
  )

  const shadowVars = mapSection(
    (branding?.shadows ?? {}) as Record<string, string | null>,
    DEFAULT_SHADOWS,
    SHADOW_VARIABLE_MAP,
  )

  const spacingVars = mapSection(
    (branding?.spacing ?? {}) as Record<string, string | number | null>,
    DEFAULT_SPACING,
    SPACING_VARIABLE_MAP,
  )

  const animationVars =
    branding?.animation?.enabled !== false
      ? mapSection(
          (branding?.animation ?? {}) as Record<string, string | null>,
          DEFAULT_ANIMATION,
          ANIMATION_VARIABLE_MAP,
        )
      : {}

  const layoutVars = mapSection(
    (branding?.layout ?? {}) as Record<string, string | null>,
    DEFAULT_LAYOUT,
    LAYOUT_VARIABLE_MAP,
  )

  return {
    ...colorVars,
    ...typographyVars,
    ...borderVars,
    ...shadowVars,
    ...spacingVars,
    ...animationVars,
    ...layoutVars,
  }
}
