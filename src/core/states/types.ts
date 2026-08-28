/**
 * IUI Design System - State Types
 * Centralized type definitions for global interactive state management
 *
 * These types enforce:
 * - Token-only color references (no raw hex/rgb)
 * - Theme-aware state behavior
 * - Accessibility compliance
 * - Enterprise-grade scalability
 */

// =============================================================================
// TOKEN REFERENCE TYPES
// =============================================================================

/**
 * Valid token namespaces for color references.
 * All color values in states MUST use these token paths.
 */
export type TokenNamespace = "semantic" | "neutral" | "brand" | "accent";

/**
 * Semantic token keys available in the system.
 */
export type SemanticTokenKey = "success" | "warning" | "danger" | "info";

/**
 * Neutral token keys available in the system.
 */
export type NeutralTokenKey = "neutral";

/**
 * Brand token reference.
 */
export type BrandTokenKey = "brand";

/**
 * Token path reference - enforces token-only values.
 * Examples: "semantic.success", "brand.primary", "neutral.set", "accent.accent-9"
 */
export type TokenPath =
  | `${SemanticTokenKey}`
  | `${NeutralTokenKey}`
  | `${BrandTokenKey}`
  | `${string}`;

/**
 * CSS size value with units.
 */
export type CSSSize = `${number}px` | `${number}rem` | `${number}em` | number;

/**
 * Opacity scale from 0 to 1.
 */
export type OpacityScale = number; // 0-1 range, validated at runtime

// =============================================================================
// FOCUSED STATE CONFIGURATION
// =============================================================================

/**
 * Focused state display modes.
 * - none: No focused ring
 * - native: Black in light mode, white in dark mode
 * - adaptive: Picks color from component (e.g. Button variant), falls back to color
 * - ring: Static color from color prop
 */
export type FocusedMode = "none" | "native" | "adaptive" | "custom";

/**
 * Radius inheritance strategy.
 */
export type RadiusInherit = "inherit" | "none" | CSSSize;

/**
 * Focused state color - for adaptive fallback and ring mode.
 */
export type FocusedColor = "black" | "white" | "brand" | TokenPath;

/**
 * Light/dark mode offset color for focused state.
 * Values: "white", "black", or token e.g. "neutral-50", "neutral-900".
 */
export interface FocusedOffsetColorConfig {
  light?: string;
  dark?: string;
}

/**
 * Focused state shade - for token-based colors (e.g. brand-600).
 */
export type FocusedShade =
  | "50"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900"
  | "950";

/**
 * Focused state style configuration.
 */
export interface FocusedStyleConfig {
  /** Ring width. @default "2px" */
  width?: CSSSize;
  /** Offset from element. @default "2px" */
  offset?: CSSSize;
  /** Offset color light/dark. @default { light: "white", dark: "neutral-900" } */
  offsetColor?: FocusedOffsetColorConfig;
  /** Radius. @default "inherit" */
  radius?: RadiusInherit;
}

/**
 * Focused state accessibility configuration.
 */
export interface FocusedAccessibilityConfig {
  minContrast?: 3 | 4.5 | 7;
  highContrastSupport?: boolean;
}

/**
 * Focused state configuration (simplified).
 */
export interface FocusedConfig {
  /** none | native | adaptive (from component) | ring (static color) */
  mode?: FocusedMode;
  /** Ring color. adaptive fallback when no component color. ring mode uses this. @default "brand" */
  color?: FocusedColor;
  /** Shade for token colors. @default { light: "600", dark: "400" } */
  shades?: { light?: FocusedShade; dark?: FocusedShade };
  style?: FocusedStyleConfig;
  accessibility?: FocusedAccessibilityConfig;
}

// =============================================================================
// DISABLED STATE CONFIGURATION
// =============================================================================

/**
 * Disabled state style.
 * - "fade": Reduce opacity (preserves colors)
 * - "mute": Replace with neutral color
 */
export type DisabledStyle = "fade" | "mute";

/**
 * Cursor type for disabled state.
 */
export type DisabledCursor = "not-allowed" | "default" | "wait";

/**
 * Disabled state configuration (simplified).
 */
export interface DisabledStateConfig {
  /** "fade" = opacity, "mute" = neutral color. @default "fade" */
  style?: DisabledStyle;
  /** Opacity when style="fade". @default 0.5 */
  opacity?: OpacityScale;
  /** Token when style="mute". @default "neutral" */
  color?: TokenPath;
  /** @default "not-allowed" */
  cursor?: DisabledCursor;
}

// =============================================================================
// LOADING STATE CONFIGURATION
// =============================================================================

/**
 * Loading state style.
 * - "fade": Reduce opacity (preserves colors)
 * - "mute": Replace with neutral color
 */
export type LoadingStyle = "fade" | "mute";

/**
 * Loader slot config - compatible with LDRS (ldrs) and @inventive-ui/loaders.
 */
export interface LoaderSlotConfig {
  /** Loader name, e.g. "ring", "bouncy", "lineSpinner" (LDRS component name). */
  name?: string;
  /** "currentColor" | hex | token */
  color?: string;
  size?: number | string;
  strokeWidth?: number;
  /** Animation speed (LDRS). */
  speed?: number;
}

/**
 * Loading state configuration (simplified).
 * - style "fade": dim with opacity (keeps colors).
 * - style "mute": replace with neutral token.
 * Spinner uses text color (currentColor).
 */
export interface LoadingStateConfig {
  /** "fade" = opacity only, "mute" = replace with color token. @default "fade" */
  style?: LoadingStyle;
  /** Opacity when style="fade". @default 0.6 */
  opacity?: OpacityScale;
  /** Token when style="mute". @default "neutral" */
  color?: TokenPath;
  /** Show spinner. @default true */
  spinner?: boolean;
  /** @default "wait" */
  cursor?: "wait" | "progress" | "default";
  /** Global default loader - used when component has no loaderSlot prop */
  loader?: LoaderSlotConfig;
  /** Global loading label - e.g. "Loading..." for aria-label or text */
  label?: string;
}

// =============================================================================
// HOVER STATE CONFIGURATION (FUTURE EXTENSIBILITY)
// =============================================================================

// NOTE: The `hover`, `active`, and `selected` sections are reserved for
// future extensibility only. They are declared here so the config shape is
// forward-compatible, but the current runtime and class generation only
// implement `focused`, `disabled`, and `loading`.
//
// Keep these types minimal and documented to avoid confusion for integrators.

/**
 * Hover state strategy.
 */
export type HoverStrategy = "darken" | "lighten" | "elevate" | "none";

/**
 * Hover state configuration.
 */
export interface HoverStateConfig {
  /**
   * Hover effect strategy.
   * @default "darken"
   */
  strategy?: HoverStrategy;

  /**
   * Intensity of the hover effect (1-3).
   * @default 1
   */
  intensity?: 1 | 2 | 3;

  /**
   * Transition duration.
   * @default "150ms"
   */
  transitionDuration?: `${number}ms`;
}

// =============================================================================
// ACTIVE/PRESSED STATE CONFIGURATION (FUTURE EXTENSIBILITY)
// =============================================================================

/**
 * Active state strategy.
 */
export type ActiveStrategy = "darken" | "scale" | "both" | "none";

/**
 * Active/pressed state configuration.
 */
export interface ActiveStateConfig {
  /**
   * Active effect strategy.
   * @default "darken"
   */
  strategy?: ActiveStrategy;

  /**
   * Scale factor when strategy includes "scale".
   * @default 0.98
   */
  scaleFactor?: number;

  /**
   * Intensity of darken effect (1-3).
   * @default 2
   */
  intensity?: 1 | 2 | 3;
}

// =============================================================================
// SELECTED STATE CONFIGURATION (FUTURE EXTENSIBILITY)
// =============================================================================

/**
 * Selected state configuration.
 */
export interface SelectedStateConfig {
  /**
   * Whether to show a visual indicator.
   * @default true
   */
  showIndicator?: boolean;

  /**
   * Token for selected background.
   */
  backgroundToken?: TokenPath;

  /**
   * Token for selected border/indicator.
   */
  indicatorToken?: TokenPath;
}

// =============================================================================
// COMPLETE STATES CONFIGURATION
// =============================================================================

/**
 * Complete interactive states configuration.
 * Placed under config.states (top-level) in the config file.
 */
export interface StatesConfig {
  /**
   * Focused state configuration.
   */
  focused?: FocusedConfig;

  /**
   * Disabled state configuration.
   */
  disabled?: DisabledStateConfig;

  /**
   * Loading state configuration.
   */
  loading?: LoadingStateConfig;

  /**
   * Hover state configuration.
   * @future Reserved for future implementation
   */
  hover?: HoverStateConfig;

  /**
   * Active/pressed state configuration.
   * @future Reserved for future implementation
   */
  active?: ActiveStateConfig;

  /**
   * Selected state configuration.
   * @future Reserved for future implementation
   */
  selected?: SelectedStateConfig;
}

// =============================================================================
// RESOLVED STATE TYPES (INTERNAL USE)
// Same shape as user config with all defaults applied; no custom/adaptive/strategy/overlay.
// =============================================================================

/**
 * Resolved focused state: flattened, with defaults.
 */
export interface ResolvedFocusedConfig {
  mode: FocusedMode;
  /** Ring color (ring mode). Resolved from "component" to actual token when in context. */
  color: FocusedColor | TokenPath;
  shades: { light: FocusedShade; dark: FocusedShade };
  style: Required<FocusedStyleConfig>;
  accessibility: Required<FocusedAccessibilityConfig>;
}

/**
 * Resolved disabled state: same keys as DisabledStateConfig, all required.
 */
export interface ResolvedDisabledStateConfig extends Required<DisabledStateConfig> {}

/**
 * Resolved loading state: same keys as LoadingStateConfig, all required.
 */
export interface ResolvedLoadingStateConfig extends Required<LoadingStateConfig> {}

/**
 * Fully resolved states configuration.
 */
export interface ResolvedStatesConfig {
  focused: ResolvedFocusedConfig;
  disabled: ResolvedDisabledStateConfig;
  loading: ResolvedLoadingStateConfig;
  // Optional forward-compatible keys. Present for future features only;
  // they have no effect on the current class generation or runtime behavior.
  hover?: HoverStateConfig;
  active?: ActiveStateConfig;
  selected?: SelectedStateConfig;
}
