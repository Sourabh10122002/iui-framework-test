/**
 * IUI Design System - States Module
 * Centralized interactive state management
 *
 * @module states
 */

// Type definitions
export type {
  // Token types
  TokenPath,
  TokenNamespace,
  SemanticTokenKey,
  NeutralTokenKey,
  BrandTokenKey,
  CSSSize,
  OpacityScale,

  // Focus ring types
  FocusedMode,
  FocusedColor,
  FocusedShade,
  RadiusInherit,
  FocusedStyleConfig,
  FocusedAccessibilityConfig,
  FocusedConfig,

  // Disabled state types
  DisabledStyle,
  DisabledCursor,
  DisabledStateConfig,

  // Loading state types
  LoadingStyle,
  LoadingStateConfig,

  // Future state types
  HoverStrategy,
  HoverStateConfig,
  ActiveStrategy,
  ActiveStateConfig,
  SelectedStateConfig,

  // Complete config types
  StatesConfig,
  ResolvedStatesConfig,
  ResolvedFocusedConfig,
  ResolvedDisabledStateConfig,
  ResolvedLoadingStateConfig,
} from "./types";

// Helper functions for config definition
export {
  defineStates,
  defineFocused,
  defineDisabledState,
  defineLoadingState,
  defineHoverState,
  defineActiveState,
  defineSelectedState,
  // Presets
  accessibilityFirstPreset,
  modernAdaptivePreset,
  minimalPreset,
} from "./define-states";

// Resolver utilities
export {
  resolveStatesConfig,
  // tokenToPalette,
  generateFocusedCSS,
  generateDisabledCSS,
  generateLoadingCSS,
  generateStateCSS,
  // getFocusedClasses,
  // getDisabledClasses,
  // Default configs
  DEFAULT_FOCUSED_CONFIG,
  DEFAULT_DISABLED_CONFIG,
  DEFAULT_LOADING_CONFIG,
  // Types
  type StateCSS,
  type StateContext,
} from "./resolver";

// React hooks
export {
  useStates,
  useDisabledState,
  useFocused,
  useLoadingState,
  clearStatesCache,
  type UseStatesOptions,
  type UseStatesReturn,
} from "./use-states";
