import type { ReactNode } from 'react'

export type ConjoinSdkConfig = {
  project_id: string
  environment: 'live' | 'test'
  api_url: string
  branding: ConjoinBranding | null
  auth: {
    domain: string
    sign_in_methods: string[]
    mfa_enabled: boolean
    sign_up_enabled: boolean
  }
  relay: {
    url: string
  }
}

export type ColorPalette = {
  primary: string
  primary_contrast: string
  secondary: string
  secondary_contrast: string
  accent: string
  accent_contrast: string
  background: string
  text: string
  subtle: string
  subtle_text: string
  panel: string
  panel_text: string
  border: string
  input: string
  focus_ring: string
  danger: string
  danger_contrast: string
  success: string
  success_contrast: string
  warning: string
  warning_contrast: string
  info: string
  info_contrast: string
  overlay: string
}

export type ConjoinBranding = {
  general: {
    logo_url: string | null
    logo_dark_url: string | null
    favicon_url: string | null
    app_name: string | null
    support_email: string | null
    support_url: string | null
    privacy_policy_url: string | null
    terms_of_service_url: string | null
    disable_conjoin_branding: boolean
  }
  colors: {
    light: ColorPalette
    dark: ColorPalette
  }
  typography: {
    font_family_heading: string | null
    font_family_body: string | null
    font_family_mono: string | null
    font_size_base: string | null
    font_weight_heading: string | null
    font_weight_body: string | null
    line_height_base: string | null
    letter_spacing_heading: string | null
    letter_spacing_body: string | null
  }
  borders: {
    radius_sm: string | null
    radius_md: string | null
    radius_lg: string | null
    radius_full: string | null
    width_default: string | null
    color_default: string | null
  }
  spacing: {
    unit: string | null
    scale_factor: number | null
  }
  shadows: {
    sm: string | null
    md: string | null
    lg: string | null
    xl: string | null
    inner: string | null
    none: string | null
  }
  components: {
    button: {
      border_radius: string | null
      font_weight: string | null
      text_transform: string | null
      padding_x: string | null
      padding_y: string | null
    }
    input: {
      border_radius: string | null
      border_width: string | null
      padding_x: string | null
      padding_y: string | null
    }
    card: {
      border_radius: string | null
      padding: string | null
      shadow: string | null
    }
    social_button: {
      border_radius: string | null
      style: 'filled' | 'outlined' | 'minimal'
    }
    pricing_card: {
      border_radius: string | null
      highlight_color: string | null
    }
    period_toggle: {
      style: 'pills' | 'tabs' | 'switch'
    }
    file_uploader: {
      border_style: string | null
      border_radius: string | null
    }
    chat_widget: {
      border_radius: string | null
      position: 'bottom-right' | 'bottom-left'
    }
  }
  layout: {
    container_max_width: string | null
    content_max_width: string | null
    sidebar_width: string | null
  }
  animation: {
    enabled: boolean
    duration_fast: string | null
    duration_normal: string | null
    duration_slow: string | null
    easing_default: string | null
    reduced_motion_behavior: 'respect' | 'disable' | 'ignore'
  }
  accessibility: {
    focus_ring_style: string | null
    focus_ring_color: string | null
    focus_ring_offset: string | null
  }
  organization: {
    logo_url: string | null
    logo_dark_url: string | null
    name: string | null
    support_email: string | null
  }
}

/**
 * Auth state for the current browser. A readable `__conjoin_auth_cl` handle
 * cookie is necessary but not sufficient to be signed in: the handle also
 * exists mid-flow, before the user authenticates. Signed-in is established only
 * once a handshake mints a session against a completed client, so `isSignedIn`
 * reflects a successful handshake rather than mere cookie presence. The browser
 * never holds the session token (it is httpOnly), so this state carries no
 * account, session, or organization identity; verified identity hydrates
 * separately from the cookie-authenticated self-surface.
 *
 * `isLoaded: false` covers the window between mount and the first handshake
 * resolving, plus SSR where no cookie is readable.
 */
export type ConjoinAuthState =
  | { isLoaded: false }
  | {
      isLoaded: true
      isSignedIn: false
    }
  | {
      isLoaded: true
      isSignedIn: true
      clientId: string
      referenceId: string
    }

export type ClientHandle = {
  client_id: string
  reference_id: string
}

export type PkceMaterial = {
  state: string
  codeVerifier: string
  codeChallenge: string
}

export type PendingAuthFlowKind = 'sign-in' | 'sign-up'

export type FlowVerificationMethod = 'pin_code' | 'magic_link'

/**
 * The minimum a flow start must hand to its matching complete step. `state` and
 * the PKCE pair are generated client-side and replayed on complete; `serverState`
 * is the value the server returns from start and is the one a pin-code completion
 * must echo. It is persisted so a magic link opened on a fresh page load (a new
 * runtime with no in-memory state) can still complete on the same device.
 */
export type PendingAuthFlow = {
  kind: PendingAuthFlowKind
  state: string
  codeVerifier: string
  codeChallenge: string
  serverState: string | null
  verificationMethod: FlowVerificationMethod | null
  identifier: string | null
}

/**
 * Platform seam for everything the auth runtime needs from the host environment.
 * The web implementation reads cookies, derives PKCE with Web Crypto, and keeps
 * the pending flow in session storage; a native implementation supplies its own
 * secure equivalents. Keeping these behind the transport lets the hooks stay free
 * of platform globals so they build in the framework-agnostic entry.
 */
export type AuthTransport = {
  getClientHandle: () => ClientHandle | null
  clearHandle: () => void | Promise<void>
  attachCsrf: (headers: Record<string, string>) => Record<string, string>
  createPkce: () => Promise<PkceMaterial>
  savePendingFlow: (flow: PendingAuthFlow) => void
  readPendingFlow: () => PendingAuthFlow | null
  clearPendingFlow: () => void
  redirect: (url: string) => void
}

export type ConjoinThemeState = {
  mode: 'light' | 'dark'
  branding: ConjoinBranding | null
  cssVariables: Record<string, string>
}

export type ConjoinProviderProps = {
  publishableKey: string
  children: ReactNode
  config?: Partial<ConjoinSdkConfig>
  appearance?: {
    theme?: 'light' | 'dark' | 'system'
    variables?: Partial<ColorPalette>
  }
}
