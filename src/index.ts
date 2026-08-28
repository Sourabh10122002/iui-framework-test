/**
 * Inventive UI Framework - Main Entry Point (compile-first)
 *
 * CSS utilities are generated at build time via the Vite/Webpack/Next plugin.
 */
import { initFramework } from "./core/auto-config";

// ============================================================================
// CORE UTILITIES (Most commonly used - like Tailwind's utilities)
// ============================================================================

// Class merging utility (primary export - most used)
export { cn, iuimerge, cn2 } from "./utilities/class-utilities";

// Conditional classes
export { conditionalClasses, cx } from "./utilities/class-utilities";

// Variant helpers
export {
  withStateVariants,
  withResponsiveVariants,
  withThemeVariants,
  withAllVariants,
  createComponentClasses,
  createIUIVariants,
} from "./utilities/class-utilities";

// Validation utilities
export {
  validateIUIClass,
  getConflictingClasses,
  extractDesignTokens,
  getTokenCategory,
} from "./utilities/class-utilities";

// Re-export class-variance-authority (portable types for consumers)
export { cva, type VariantProps } from "class-variance-authority";

// ============================================================================
// REACT HOOKS (React-specific utilities)
// ============================================================================

// Theme hooks — prefer useThemeMode / useThemeLayout over full useTheme when possible
export {
  useTheme,
  useThemeMode,
  useThemeLayout,
  useThemeSelector,
} from "./hooks/use-theme";

// Compile-first: palette CSS is in build output.
export { useColorPalette } from "./hooks/use-color-palette.stub";

export {
  useArbitraryValues,
  initializeArbitraryValues,
  processClasses,
  prefetchUtilities,
} from "./hooks/compile-first-runtime-stubs";

// Slot system moved to @inventive-ui/framework/slots (smaller main bundle).
// Type-only re-exports remain for backward-compatible typings.
export type {
  Slot,
  SlotMap,
  SlotRendererFn,
} from "./utilities/slot/slot-types";
export type { OptionalSlotPackageId } from "./utilities/slot/async-slot";

// ============================================================================
// THEME & CONFIGURATION (Theme management)
// ============================================================================

// Theme manager (compile-first)
export {
  themeManager,
  applyMode,
  bootstrapThemeFromScript,
  setupThemeToggle,
  syncThemeToDOM,
  getAvailableColorPalettes,
  getAvailableTokens,
  validateColor,
  getColorWithFallback,
  validateThemeValue,
  setSpacing,
  setRadius,
  setFont,
  setThemeColor,
} from "./configuration/theme-options";

// Theme types
export type {
  ThemeState,
  ColorPalette,
  ColorShade,
} from "./configuration/theme-options";

// Theme constants
export {
  availableColorPalettes,
  colorShades,
  semanticColors,
  brandColor,
  neutralColor,
  accentColors,
  /** @deprecated Use `neutralColor`. */
  neutralColors,
  globalRadius,
  globalSpacing,
  globalColor,
  globalFont,
  globalMode,
  globalPanelBackground,
  typographyExtendTokens,
} from "./configuration/theme-options";

// ============================================================================
// DESIGN TOKEN MAPS (engine — same objects the utility engine uses)
// Import from the package root, e.g.:
//   import { fontSize, fontWeight, fontFamily, spacing, colors } from "@inventive-ui/framework"
//
// Implementation note: Rollup emits a flat dist/index.d.ts with `export * from "./engine/tokens/values"`.
// Companion declarations must exist at dist/engine/tokens/values.d.ts — produced by `npm run build:emit-token-dts`
// (part of `npm run build`) so TypeScript can resolve those symbols from the package entry.
// ============================================================================

export * from "./engine/tokens/values";

// Dynamic token resolution (numeric / arbitrary steps — same helpers the theme pipeline uses)
export {
  getDynamicTokenValue,
  getSpacingValue,
  getBorderWidthValue,
  getRingWidthValue,
  getFontSizeValue,
} from "./engine/tokens/dynamic";

// Structured semantic + component token trees; `designTokens.values` mirrors static maps from `values`
export {
  semanticTokens,
  componentTokens,
  designTokens,
  resolveTokenReference,
} from "./engine/tokens/design";
export type {
  DesignToken,
  ColorToken,
  DimensionToken,
  FontFamilyToken,
  FontWeightToken,
  FontSizeToken,
  LineHeightToken,
  LetterSpacingToken,
  BorderRadiusToken,
  BorderWidthToken,
  ShadowToken,
  DurationToken,
  CubicBezierToken,
  OpacityToken,
} from "./engine/tokens/design";
/** Default export of design token bundle (same object as `designTokens`) for `import { iuiDesignTokens } from "…"`. */
export { default as iuiDesignTokens } from "./engine/tokens/design";

// Theme utilities (mapSpacing alias for mapSpacingClass for convenience)
export {
  mapSpacingClass,
  mapSpacingClass as mapSpacing,
  mapSpacingToPadding,
  mapRadius,
  getResponsiveRadius,
  mapFont,
  fontMap,
  generatePalette,
  generateNeutralPalette,
  completeHexCode,
} from "./utilities/theme-utilities";
export type { Shade } from "./utilities/theme-utilities";

// ============================================================================
// CSS VARIABLE MANAGEMENT (Runtime CSS variables)
// ============================================================================

export {
  cssVariableManager,
  setRootCssVariables,
  setRootCssVariable,
  getRootCssVariable,
  removeRootCssVariable,
  clearRootCssVariables,
  markInitialLoadComplete,
  isInInitialLoad,
} from "./utilities/css-variable-manager";

export { VariableUtils } from "./utilities/variable-utilities";

// ============================================================================
// CONFIGURATION (Framework configuration)
// ============================================================================

export { applyLoadedConfig, initFramework } from "./core/auto-config";
export { mergeProjectConfig } from "./core/load-project-config";
export {
  registerBootstrapState,
  getBootstrapFrameworkConfig,
  getBootstrapComponentConfig,
} from "./core/bootstrap-state";
export type { BootstrapState } from "./core/bootstrap-state";
export {
  initConfig,
  getConfigLoader,
  getCachedConfig,
  clearConfigCache,
  isConfigCacheValid,
  getToken,
  getSemanticColors,
  getBrandColor,
  getModeAllowSystem,
  getModeDefault,
  getModeStorageKey,
  getNeutralColors,
  getAccentColors,
  getGradientColors,
  getRadiusSet,
  getSpacingSet,
  getTypographySet,
  getTypographyProvider,
  getLocalFontUrls,
  getTypographyExtend,
  getMode,
  getIconLibrary,
  getIconDefaults,
  getIconFallback,
  getIllustrationLibrary,
  getIllustrationDefaults,
  getEmojiDefaults,
  getFlagLibrary,
  getFlagDefaults,
  getLoaderLibrary,
  getLoaderDefaults,
  getLogoVariant,
  getLogoDefaults,
  ConfigLoader,
} from "./core/config-loader";

// Config types
export type {
  IUIConfig,
  IUIThemeConfig,
  ThemeConfig,
  ColorConfig,
  SemanticColors,
  NeutralColor,
  /** @deprecated Use `NeutralColor`. */
  NeutralColors,
  AccentColors,
  Gradients,
  GradientsConfig,
  FontAlias,
  FontFamily,
  FontURL,
  LocalTypography,
  SystemTypography,
  GradientColor,
  SemanticColorKey,
  GoogleTypography,
  GradientDirection,
  GradientDirectionAngle,
  GradientDirectionKeyword,
  TypographyConfig,
  SpacingConfig,
  RadiusConfig,
  RadiusSet,
  SpacingSet,
  BuiltInFonts,
  TypographyProvider,
  IconLibrary,
  IconDefaults,
  IconThemeConfig,
  IllustrationLibrary,
  IllustrationPackageOption,
  IllustrationThemeConfig,
  IllustrationDefaults,
  StorysetDefaults,
  StorysetStyle,
  EmojiThemeConfig,
  EmojiFamily,
  EmojiSkinTone,
  FlagLibrary,
  FlagThemeConfig,
  FlagDefaults,
  LoaderLibrary,
  LoaderThemeConfig,
  LoaderDefaults,
  IUIAssetsConfig,
  AssetPreloadTier,
  LogoVariant,
  LogoThemeConfig,
  LogoDefaults,
  SafeColor,
  HexColor,
  BaseColor,
} from "./core/config";

export { defineTypography } from "./core/config";
export {
  defineStates,
  defineFocused,
  defineDisabledState,
  defineLoadingState,
} from "./core/states";
export type { StatesConfig } from "./core/states";
// ============================================================================
// CONTEXT & PROVIDER (React context)
// ============================================================================

export { IUIProvider } from "./core/context/iui-provider";
export type { IUIProviderProps } from "./core/context/iui-provider";
export { useIUIContext } from "./core/context/iui-context";
export type { IUIContextValue } from "./core/context/iui-context";
export type { ApplyLoadedConfigOptions } from "./core/auto-config";

// ============================================================================
// CORE STATES (Interactive state hooks - tree-shakeable)
// ============================================================================

export {
  useStates,
  useDisabledState,
  useFocused,
  useLoadingState,
  clearStatesCache,
} from "./core/states";
export type { UseStatesOptions, UseStatesReturn } from "./core/states";

// ============================================================================
// POLYMORPHIC COMPONENTS (Definitions & forwardRef)
// ============================================================================

export type {
  PolymorphicRef,
  PolymorphicProps,
  PolymorphicPropsWithRef,
  ComponentSize,
  ComponentVariant,
  ComponentAppearance,
  CommonProps,
  SemanticColor,
} from "./definitions/common";
export { forwardRefWithGenerics } from "./utilities/forward-ref-generics";

// ============================================================================
// TYPES (TypeScript types)
// ============================================================================

export type { TokenCategory } from "./utilities/class-utilities";
export type {
  CSSUtility,
  PseudoState,
  ParsedVariant,
} from "./engine/public-types";

// CSS optimization types (build-time engine)
export type { CSSOptimizationConfig } from "./engine/css/optimization";
export type {
  CSSLogicalPropertiesConfig,
  CSSLogicalPropertiesResult,
  CSSLogicalPropertiesEngine,
} from "./engine/css/optimizers/logical-properties";

// ============================================================================
// UTILITY FUNCTIONS (Helper utilities)
// ============================================================================

export { getInitialsFromName } from "./utilities/index";

// Semantic shade system — compose palette-aware utility class strings
export {
  shade,
  shadeRegistry,
  fieldAddonDivider,
} from "./utilities/shade";
export type {
  SemanticRequest,
  ComponentStyleVariant,
  InteractiveFullConfig,
  InteractiveStateConfig,
  SelectionConfig,
  SurfaceConfig,
  FieldConfig,
  StatusConfig,
  ScrollConfig,
  SwatchConfig,
  ShadeRegistryEntry,
} from "./utilities/shade";

// Additional design-system helpers (not in utilities barrel)
export { mapClassNames } from "./utilities/map-class-names";
export { normalizeLucidePhosphorName } from "./utilities/normalizeLucidePhosphorName";
export {
  buildGradientString,
  getGradientValue,
  isGradientRegistered,
  getRegisteredGradientNames,
  getTextGradientProperties,
} from "./utilities/gradient-utils";

// ============================================================================
// LOGGING UTILITY (Development debugging)
// ============================================================================

export { logger, createScopedLogger } from "./utilities/logger";

// ============================================================================
// SSR UTILITIES (Server-Side Rendering helpers)
// ============================================================================

export {
  isBrowser,
  isNode,
  isNextJS,
  getWindow,
  getDocument,
  browserOnly,
  serverOnly,
} from "./utils/ssr";
