import type { ColorPalette } from '../provider/types'

export const CSS_VARIABLE_MAP: Record<keyof ColorPalette, string> = {
  primary: '--conjoin-primary',
  primary_contrast: '--conjoin-primary-contrast',
  secondary: '--conjoin-secondary',
  secondary_contrast: '--conjoin-secondary-contrast',
  accent: '--conjoin-accent',
  accent_contrast: '--conjoin-accent-contrast',
  background: '--conjoin-background',
  text: '--conjoin-text',
  subtle: '--conjoin-subtle',
  subtle_text: '--conjoin-subtle-text',
  panel: '--conjoin-panel',
  panel_text: '--conjoin-panel-text',
  border: '--conjoin-border',
  input: '--conjoin-input',
  focus_ring: '--conjoin-focus-ring',
  danger: '--conjoin-danger',
  danger_contrast: '--conjoin-danger-contrast',
  success: '--conjoin-success',
  success_contrast: '--conjoin-success-contrast',
  warning: '--conjoin-warning',
  warning_contrast: '--conjoin-warning-contrast',
  info: '--conjoin-info',
  info_contrast: '--conjoin-info-contrast',
  overlay: '--conjoin-overlay',
}

export const TYPOGRAPHY_VARIABLE_MAP: Record<string, string> = {
  font_family_heading: '--conjoin-font-heading',
  font_family_body: '--conjoin-font-body',
  font_family_mono: '--conjoin-font-mono',
  font_size_base: '--conjoin-font-size-base',
  font_weight_heading: '--conjoin-font-weight-heading',
  font_weight_body: '--conjoin-font-weight-body',
  line_height_base: '--conjoin-line-height-base',
  letter_spacing_heading: '--conjoin-letter-spacing-heading',
  letter_spacing_body: '--conjoin-letter-spacing-body',
}

export const BORDER_VARIABLE_MAP: Record<string, string> = {
  radius_sm: '--conjoin-radius-sm',
  radius_md: '--conjoin-radius-md',
  radius_lg: '--conjoin-radius-lg',
  radius_full: '--conjoin-radius-full',
  width_default: '--conjoin-border-width',
  color_default: '--conjoin-border-color',
}

export const SHADOW_VARIABLE_MAP: Record<string, string> = {
  sm: '--conjoin-shadow-sm',
  md: '--conjoin-shadow-md',
  lg: '--conjoin-shadow-lg',
  xl: '--conjoin-shadow-xl',
  inner: '--conjoin-shadow-inner',
  none: '--conjoin-shadow-none',
}

export const SPACING_VARIABLE_MAP: Record<string, string> = {
  unit: '--conjoin-spacing-unit',
  scale_factor: '--conjoin-spacing-scale',
}

export const ANIMATION_VARIABLE_MAP: Record<string, string> = {
  duration_fast: '--conjoin-duration-fast',
  duration_normal: '--conjoin-duration-normal',
  duration_slow: '--conjoin-duration-slow',
  easing_default: '--conjoin-easing-default',
}

export const LAYOUT_VARIABLE_MAP: Record<string, string> = {
  container_max_width: '--conjoin-container-max-width',
  content_max_width: '--conjoin-content-max-width',
  sidebar_width: '--conjoin-sidebar-width',
}

export const COMPONENT_VARIABLE_MAP: Record<string, Record<string, string>> = {
  button: {
    border_radius: '--conjoin-button-radius',
    font_weight: '--conjoin-button-font-weight',
    text_transform: '--conjoin-button-text-transform',
    padding_x: '--conjoin-button-padding-x',
    padding_y: '--conjoin-button-padding-y',
  },
  input: {
    border_radius: '--conjoin-input-radius',
    border_width: '--conjoin-input-border-width',
    padding_x: '--conjoin-input-padding-x',
    padding_y: '--conjoin-input-padding-y',
  },
  card: {
    border_radius: '--conjoin-card-radius',
    padding: '--conjoin-card-padding',
    shadow: '--conjoin-card-shadow',
  },
  social_button: {
    border_radius: '--conjoin-social-button-radius',
  },
  pricing_card: {
    border_radius: '--conjoin-pricing-card-radius',
    highlight_color: '--conjoin-pricing-card-highlight',
  },
  file_uploader: {
    border_style: '--conjoin-file-uploader-border-style',
    border_radius: '--conjoin-file-uploader-radius',
  },
  chat_widget: {
    border_radius: '--conjoin-chat-widget-radius',
  },
}

export const ACCESSIBILITY_VARIABLE_MAP: Record<string, string> = {
  focus_ring_style: '--conjoin-focus-ring-style',
  focus_ring_color: '--conjoin-focus-ring-color',
  focus_ring_offset: '--conjoin-focus-ring-offset',
  focus_ring_width: '--conjoin-focus-ring-width',
}
