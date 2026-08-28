import type { StatesConfig } from "./states";

// Semantic colors - hold meaning
export type SemanticColorKey = "success" | "warning" | "danger" | "info";

//Base Colors
export type BaseColor =
  | "gray"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "slate"
  | "zinc"
  | "neutral"
  | "stone";

//types of color codes
export type HexColor = `#${string}`;

//Safe color - supports hexcode,rgb,rgba,HSL,BaseColors
export type SafeColor = HexColor | BaseColor;

export interface SemanticColors {
  success: SafeColor;
  warning: SafeColor;
  danger: SafeColor;
  info: SafeColor;
}

//Brand Color
export type BrandColor = {
  set?: SafeColor;
};

/** Neutral UI ramp — same shape as brand: one hex (or accent palette name). */
export type NeutralColor = {
  set?: SafeColor;
};

/** @deprecated Use `NeutralColor` and `neutral.set`. */
export type NeutralColors = NeutralColor;

//Accent Colors
export interface AccentColors {
  [key: string]: SafeColor;
}

//Gradient Colors
export type GradientColor = SafeColor | SemanticColorKey;

//Directions
export type GradientDirectionKeyword =
  | "to top"
  | "to bottom"
  | "to start"
  | "to end"
  | "to top start"
  | "to top end"
  | "to bottom start"
  | "to bottom end";

//Direction in terms of degree
export type GradientDirectionAngle = `${number}deg`;

//Gradient direction
export type GradientDirection =
  | GradientDirectionKeyword
  | GradientDirectionAngle;

//Gradient definition
export interface Gradients {
  from: GradientColor;
  to: GradientColor;
  via?: GradientColor;
  direction: GradientDirection;
}

//Gradient configuration
export interface GradientsConfig {
  [key: string]: Gradients;
}

export interface ColorConfig {
  semantic?: SemanticColors;
  brand?: BrandColor;
  neutral?: NeutralColor;
  accent?: AccentColors;
  gradients?: GradientsConfig;
}

//----------------------Typography Configuration---------------------//
export type TypographyProvider = "system" | "google" | "local";

// Built-in fonts
export type BuiltInFonts = "inter" | "arial" | "mono";
export type FontFamily = string | readonly string[];
export type FontAlias = Lowercase<string>;
export type FontURL = `https://${string}` | `http://${string}` | `/${string}`;

// System typography
export type SystemTypography = {
  provider: "system";
  set: BuiltInFonts;
};

// Google typography
export type GoogleTypography<T extends Record<FontAlias, FontFamily>> = {
  provider: "google";
  extend: T;
  set: keyof T;
};

// Local typography
export type LocalTypography<T extends Record<FontAlias, FontFamily>> = {
  provider: "local";
  url: FontURL | readonly FontURL[];
  extend: T;
  set: keyof T;
};

// Union of all typography configs
export type TypographyConfig =
  | SystemTypography
  | GoogleTypography<Record<FontAlias, FontFamily>>
  | LocalTypography<Record<FontAlias, FontFamily>>;

// Define typography function

// System
export function defineTypography(config: SystemTypography): SystemTypography;

// Google
export function defineTypography<T extends Record<FontAlias, FontFamily>>(
  config: GoogleTypography<T>,
): GoogleTypography<T>;

// Local
export function defineTypography<T extends Record<FontAlias, FontFamily>>(
  config: LocalTypography<T>,
): LocalTypography<T>;

// Implementation
export function defineTypography(config: TypographyConfig): TypographyConfig {
  return config;
}

export type SpacingSet = "compact" | "standard" | "spacious";

export interface SpacingConfig {
  set?: SpacingSet;
}

export type RadiusSet = "none" | "sm" | "md" | "lg" | "full";
export interface RadiusConfig {
  set?: RadiusSet;
}

export interface modeConfig {
  default?: "light" | "dark";
  allowSystem: boolean;
  /** Storage key for theme persistence (default: "iui-theme") */
  storageKey?: string;
}

export type PanelBackgroundSet = "solid" | "translucent";

export interface PanelBackgroundConfig {
  set?: PanelBackgroundSet;
}

/* ========== States (focused state, disabled, loading – top-level like theme) ========== */
/** Re-exported from ./states – use defineStates() to build. */
export type { StatesConfig } from "./states";
export {
  defineStates,
  defineFocused,
  defineDisabledState,
  defineLoadingState,
} from "./states";

export interface ThemeConfig {
  colors?: ColorConfig;
  typography?: TypographyConfig;
  spacing?: SpacingConfig;
  radius?: RadiusConfig;
  direction?: "ltr" | "rtl";
  mode?: modeConfig;
  panelBackground?: PanelBackgroundConfig;
  /**
   * First-paint shell colors for compile-first SPAs (html/body/#root).
   * Used by the blocking `#iui-theme-init` script before the app bundle runs.
   * When omitted, derived from `theme.colors.neutral.set` (palette 50/950 + 900/50 fg).
   */
  shellBoot?: {
    light: { background: string; foreground: string };
    dark: { background: string; foreground: string };
  };
}

export interface CoreConfig {
  /**
   * Apply !important to all utilities
   * - false (default): No !important by default (Tailwind CSS behavior)
   * - true: Apply !important to all utilities globally
   * - string: Use selector strategy (e.g., '#app' for higher specificity)
   */
  important?: boolean | string;
}

/** Re-export asset types (defined in assets-config.ts). */
export type {
  IconLibrary,
  IconDefaults,
  IconThemeConfig,
  GlobalIconMap,
  IconAssetsThemeConfig,
  StorysetStyle,
  StorysetDefaults,
  IllustrationLibrary,
  IllustrationPackageOption,
  IllustrationThemeConfig,
  IllustrationDefaults,
  EmojiFamily,
  EmojiSkinTone,
  EmojiThemeConfig,
  GlobalEmojiMap,
  LoaderLibrary,
  LoaderDefaults,
  LoaderThemeConfig,
  FlagLibrary,
  FlagDefaults,
  FlagThemeConfig,
  SlotPlaceholderProps,
  FileTypePlaceholderProps,
  FileTypeLibrary,
  FileTypeThemeConfig,
  LogoVariant,
  LogoDefaults,
  LogoThemeConfig,
  LogoAssetsConfig,
  GlobalLogoMap,
  ColorLogoAssetsConfig,
  GlobalColorLogoMap,
  IUIAssetsConfig,
  AssetPreloadTier,
  AssetBindingMode,
} from "./assets-config";

import type { IUIAssetsConfig } from "./assets-config";

/** Compile-first scanner options (merged with Vite/Webpack plugin options). */
export interface IUIBuildConfig {
  /** App folders to scan for class names (default: `src`, `.iui`). */
  scanDirs?: string[];
  /** Installed packages whose `dist` is scanned (default: `@inventive-ui/components`). */
  scanPackages?: string[];
  include?: string[];
  exclude?: string[];
  /** Classes always included in build CSS (Tailwind safelist equivalent). */
  safelist?: string[];
  /**
   * Merge `compile.safelist` from installed `scanPackages` manifests (default: false — scan-first).
   * Opt in during migration when a package still relies on a non-empty compile.safelist.
   * Target: empty safelist + scanner-discoverable static maps.
   */
  packageSafelist?: boolean;
  /** Write `.iui/utilities.css` to disk for debugging. */
  writeFiles?: boolean;
  /** Minify generated CSS (default: true in production). */
  minify?: boolean;
  /** Use Babel AST scanner in addition to regex (default: true). */
  useAst?: boolean;
  /**
   * Pre-expand shade semantic matrix at build time (default: false — scan-first).
   * Opt in when a component library needs the full compose() matrix without
   * relying on scanner-discoverable static maps.
   */
  includeShadeMatrix?: boolean;
  /** Dynamic shade-call handling during scans (default: "warn"). */
  shadeDiagnostics?: "warn" | "error" | "silent";
  /** Pre-expand spacing/radius/font theme presets (default: true). */
  includeThemePresets?: boolean;
  /**
   * Pre-expand theme gray utilities (`gray-2` … `gray-98`, even steps) at build time.
   * CSS vars always come from neutral init; this emits matching utility classes.
   * Default: true. Does not require `accent.gray` in config.
   */
  includeThemeGrayScale?: boolean;
  /** Resolve dynamic palette template patterns against config palettes (default: true). */
  resolvePalettePatterns?: boolean;
  /** Full-file regex scan for arbitrary utilities like w-[120px] (default: true). */
  includeArbitraryScan?: boolean;
}

/** User-facing config: only theme, states, core. What you define in iui.config.ts. */
export interface IUIThemeConfig {
  theme?: ThemeConfig;
  /** Interactive states (focused state, disabled, loading). */
  states?: StatesConfig;
  core?: CoreConfig;
  /** Compile-first scanner options. */
  build?: IUIBuildConfig;
}

/** Full config: theme + optional assets (from assets.config.json). What you pass to initConfig / IUIProvider. */
export type IUIConfig = IUIThemeConfig & { assets?: IUIAssetsConfig };

export { mergeProjectConfig } from "./load-project-config";
