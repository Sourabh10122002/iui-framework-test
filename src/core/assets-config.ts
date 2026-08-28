/**
 * Asset config types (icons, loaders, illustrations, flags, emoji).
 * Used by iui.assets.json and merged in config.ts into IUIConfig.
 */

export type IconLibrary =
  | "material-icons"
  | "lucide"
  | "phosphor"
  | "material-symbols";

/**
 * Icon defaults: flexible key/value map so each package can define its own options.
 * e.g. material-symbols: { style, filled }; lucide: { strokeWidth }; phosphor: { weight }.
 */
export type IconDefaults = Record<
  string,
  | string
  | number
  | boolean
  | undefined
  | Record<string, string | number | boolean | undefined>
>;

/**
 * Semantic `@alias` keys → glyph ids for the active {@link IconLibrary}.
 * Defined in project `assets.config.json` (`icon.globalIcons`) — not in Framework.
 *
 * Used by `resolveIconSlot` when `name` starts with `@` (e.g. `@menu`).
 */
export type GlobalIconMap = Record<string, string>;

/**
 * Slot asset preload tier (platform — no per-icon consumer lists).
 * - none: lazy load on first slot render (smallest prod bundles)
 * - configured: eager load configured library `/react` wrappers at init
 * - scanned: configured + warm bundler-scanned glyph modules from `iui-slot-warmup`
 */
export type AssetPreloadTier = "none" | "configured" | "scanned";

/** How runtime slots resolve asset glyphs — lazy dynamic imports or CLI-bound static imports. */
export type AssetBindingMode = "lazy" | "scanned";

/** Icon block in assets: library, optional global icon map, plus library-specific defaults. */
export type IconAssetsThemeConfig = {
  library: IconLibrary;
  globalIcons?: GlobalIconMap;
  /**
   * Glyph id used when an `@alias` is unmapped or a bound/lazy lookup fails.
   * Must exist in the active icon library. When omitted, Framework uses a
   * library-native default (e.g. Lucide `circle-help`, Material `help_outline`).
   */
  fallback?: string;
  /** Showcase defaults when a slot uses `@placeholder` on `name` (or other keys). */
  placeholder?: SlotPlaceholderProps;
  /** Overrides {@link IUIAssetsConfig.preload} for the icon library only. */
  preload?: AssetPreloadTier;
  /** When `"scanned"`, `.iui/generated/assets/*` static bindings are used when registered. */
  binding?: AssetBindingMode;
} & IconDefaults;

export interface IconThemeConfig {
  library: IconLibrary;
  defaults?: IconDefaults;
}

/* ========== Illustration ========== */

/** Storyset style names @see https://storyset.com */
export type StorysetStyle = "Amico" | "Bro" | "Cuate" | "Pana" | "Rafiki";

export interface StorysetDefaults {
  style?: StorysetStyle;
}

export type IllustrationLibrary = "storyset";

export type IllustrationPackageOption =
  | IllustrationLibrary
  | { library: IllustrationLibrary; style?: StorysetStyle };

export type IllustrationThemeConfig = {
  library: "storyset";
  defaults?: StorysetDefaults;
};

export type IllustrationDefaults = StorysetDefaults;

/* ========== Emoji ========== */

export type EmojiFamily = string;

export type EmojiSkinTone =
  | ""
  | "light"
  | "mediumLight"
  | "medium"
  | "mediumDark"
  | "dark";

/** Global emoji alias map — `@key` resolution (project `assets.config.json` only). */
export type GlobalEmojiMap = Record<string, string>;

export type GlobalLoaderMap = Record<string, string>;

export type GlobalIllustrationMap = Record<string, string>;

export type GlobalFlagMap = Record<string, string>;

export type GlobalFileTypeMap = Record<string, string>;

export interface EmojiThemeConfig {
  family?: EmojiFamily;
  skinTone?: EmojiSkinTone;
  placeholder?: SlotPlaceholderProps;
  globalEmojis?: GlobalEmojiMap;
  /**
   * Emoji id used when an `@alias` is unmapped or `@placeholder` has no configured value.
   */
  fallback?: string;
  binding?: AssetBindingMode;
}

/* ========== Loaders ========== */

export type LoaderLibrary = "ldrs";

export interface LoaderDefaults {
  name?: string;
  color?: string;
  size?: number | string;
  strokeWidth?: number;
  speed?: number;
}

export interface LoaderThemeConfig {
  library: LoaderLibrary;
  defaults?: LoaderDefaults;
}

export type LoaderAssetsConfig = {
  library: LoaderLibrary;
  /** Default loader when slot omits `name` or uses `@placeholder`. */
  placeholder?: SlotPlaceholderProps;
  /** Semantic `@alias` → loader id (ldrs name). */
  globalLoaders?: GlobalLoaderMap;
  fallback?: string;
  binding?: AssetBindingMode;
} & LoaderDefaults;

/* ========== Flags ========== */

export type FlagLibrary = "flagpack";

export interface FlagDefaults {
  size?: "sm" | "md" | "lg";
}

export interface FlagThemeConfig {
  library: FlagLibrary;
  defaults?: FlagDefaults;
  /** ISO country code for `@placeholder` (legacy string form still supported). */
  placeholder?: string | SlotPlaceholderProps;
  globalFlags?: GlobalFlagMap;
  fallback?: string;
  binding?: AssetBindingMode;
}

/* ========== Slot placeholders (docs / showcase) ========== */

/** Props merged when a slot uses `@placeholder` on a key; configured under `assets.*.placeholder`. */
export type SlotPlaceholderProps = Record<
  string,
  string | number | boolean | undefined
>;

/** @alias {@link SlotPlaceholderProps} */
export type FileTypePlaceholderProps = SlotPlaceholderProps;

export type FileTypeLibrary = "vscode";

export interface FileTypeThemeConfig {
  library?: FileTypeLibrary;
  placeholder?: SlotPlaceholderProps;
  globalFileTypes?: GlobalFileTypeMap;
  fallback?: string;
  binding?: AssetBindingMode;
}

/* ========== Logos ========== */

export type LogoVariant = "mono" | "color";

export interface LogoDefaults {
  size?: "sm" | "md" | "lg";
}

export interface LogoThemeConfig {
  variant?: LogoVariant;
  defaults?: LogoDefaults;
}

/** Global mono-logo alias map — `@key` resolution (project `assets.config.json` only). */
export type GlobalLogoMap = Record<string, string>;

export interface LogoAssetsConfig {
  placeholder?: SlotPlaceholderProps;
  globalLogos?: GlobalLogoMap;
  fallback?: string;
  binding?: AssetBindingMode;
}

/** Global color-logo alias map — `@key` resolution (project `assets.config.json` only). */
export type GlobalColorLogoMap = Record<string, string>;

export interface ColorLogoAssetsConfig {
  placeholder?: SlotPlaceholderProps;
  globalColorLogos?: GlobalColorLogoMap;
  fallback?: string;
  binding?: AssetBindingMode;
}

/* ========== IUIAssetsConfig (iui.assets.json shape) ========== */

export interface IUIAssetsConfig {
  /** Default preload tier for runtime slot packages; icon can override via `icon.preload`. */
  preload?: AssetPreloadTier;
  /** Default asset binding mode; per-slot blocks can override. */
  binding?: AssetBindingMode;
  icon?: IconAssetsThemeConfig;
  loader?: LoaderAssetsConfig;
  illustration?: {
    library: IllustrationLibrary;
    style?: StorysetStyle;
    placeholder?: SlotPlaceholderProps;
    globalIllustrations?: GlobalIllustrationMap;
    fallback?: string;
    binding?: AssetBindingMode;
  };
  flag?: FlagThemeConfig;
  fileType?: FileTypeThemeConfig;
  emoji?: EmojiThemeConfig;
  logo?: LogoAssetsConfig;
  colorLogo?: ColorLogoAssetsConfig;
}
