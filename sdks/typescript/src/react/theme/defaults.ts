import type { ColorPalette } from '../provider/types'

export const DEFAULT_LIGHT_COLORS: ColorPalette = {
  primary: '#6C47FF',
  primary_contrast: '#FFFFFF',
  secondary: '#1A1523',
  secondary_contrast: '#FFFFFF',
  accent: '#6C47FF',
  accent_contrast: '#FFFFFF',
  background: '#FFFFFF',
  text: '#1A1523',
  subtle: '#F5F5F5',
  subtle_text: '#65636D',
  panel: '#FFFFFF',
  panel_text: '#1A1523',
  border: '#E8E8EC',
  input: '#FFFFFF',
  focus_ring: '#6C47FF',
  danger: '#E5484D',
  danger_contrast: '#FFFFFF',
  success: '#30A46C',
  success_contrast: '#FFFFFF',
  warning: '#F5A623',
  warning_contrast: '#1A1523',
  info: '#0091FF',
  info_contrast: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.4)',
}

export const DEFAULT_DARK_COLORS: ColorPalette = {
  primary: '#9B8AFF',
  primary_contrast: '#FFFFFF',
  secondary: '#EDEEF0',
  secondary_contrast: '#1A1523',
  accent: '#9B8AFF',
  accent_contrast: '#FFFFFF',
  background: '#111113',
  text: '#EDEEF0',
  subtle: '#1A1A1E',
  subtle_text: '#9B9BA4',
  panel: '#1A1A1E',
  panel_text: '#EDEEF0',
  border: '#2E2E32',
  input: '#1A1A1E',
  focus_ring: '#9B8AFF',
  danger: '#E5484D',
  danger_contrast: '#FFFFFF',
  success: '#30A46C',
  success_contrast: '#FFFFFF',
  warning: '#F5A623',
  warning_contrast: '#1A1523',
  info: '#0091FF',
  info_contrast: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.7)',
}

export const DEFAULT_TYPOGRAPHY = {
  font_family_heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  font_family_body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  font_family_mono: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
  font_size_base: '14px',
  font_weight_heading: '600',
  font_weight_body: '400',
  line_height_base: '1.5',
  letter_spacing_heading: '-0.02em',
  letter_spacing_body: '0',
}

export const DEFAULT_BORDERS = {
  radius_sm: '4px',
  radius_md: '8px',
  radius_lg: '12px',
  radius_full: '9999px',
  width_default: '1px',
  color_default: 'var(--conjoin-border)',
}

export const DEFAULT_SHADOWS = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
  none: 'none',
}

export const DEFAULT_SPACING = {
  unit: '4px',
  scale_factor: '1',
}

export const DEFAULT_ANIMATION = {
  duration_fast: '100ms',
  duration_normal: '200ms',
  duration_slow: '300ms',
  easing_default: 'cubic-bezier(0.4, 0, 0.2, 1)',
}

export const DEFAULT_LAYOUT = {
  container_max_width: '1200px',
  content_max_width: '560px',
  sidebar_width: '280px',
}
