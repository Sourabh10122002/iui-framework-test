import type {
  AccentColors,
  BuiltInFonts,
  TypographyConfig,
  GradientsConfig,
  IUIConfig,
  IUIAssetsConfig,
  NeutralColor,
  /** @deprecated Use `NeutralColor`. */
  NeutralColors,
  SemanticColors,
  IconLibrary,
  IconDefaults,
  GlobalIconMap,
  IllustrationLibrary,
  IllustrationThemeConfig,
  IllustrationDefaults,
  EmojiThemeConfig,
  FlagLibrary,
  FlagThemeConfig,
  FlagDefaults,
  FileTypeLibrary,
  SlotPlaceholderProps,
  LoaderLibrary,
  LoaderThemeConfig,
  LoaderDefaults,
  LogoVariant,
  LogoThemeConfig,
  LogoDefaults,
  TypographyProvider,
  FontURL,
  FontAlias,
  FontFamily,
  SpacingSet,
  RadiusSet,
  modeConfig,
  PanelBackgroundSet,
  SafeColor,
} from "./config";

import type { StatesConfig } from "./states/types";
import { minimalPreset } from "./states/define-states";
const DEFAULT_ICON_LIBRARY = "material-symbols";
const DEFAULT_ILLUSTRATION_LIBRARY: IllustrationLibrary = "storyset";
const DEFAULT_FLAG_LIBRARY: FlagLibrary = "flagpack";
const DEFAULT_FILE_TYPE_LIBRARY: FileTypeLibrary = "vscode";
const DEFAULT_LOADER_LIBRARY: LoaderLibrary = "ldrs";
// Logo config disabled for now
const DEFAULT_LOGO_VARIANT: LogoVariant = "color";

import type {
  AssetBindingMode,
  GlobalEmojiMap,
  GlobalLogoMap,
  GlobalColorLogoMap,
} from "./assets-config";
import { normalizeIconLibraryId } from "../utilities/slot/normalize-icon-library";
import {
  resolveIconFallbackGlyph,
  resolveAssetFallback,
} from "../utilities/slot/asset-fallback";

/** Framework defaults for assets (used when assets not set). */
const DEFAULT_ICON_DEFAULTS: IconDefaults = { style: "outlined", filled: true };
const DEFAULT_ICON_PLACEHOLDER: SlotPlaceholderProps = { name: "help" };
const DEFAULT_ILLUSTRATION_DEFAULTS: IllustrationDefaults = { style: "Amico" };
const DEFAULT_EMOJI: Partial<EmojiThemeConfig> = {
  family: "apple",
  skinTone: "light",
};
const DEFAULT_LOADER_DEFAULTS: LoaderDefaults = {
  name: "ring",
  color: "currentColor",
};

const DEFAULT_FLAG_PLACEHOLDER_CODE = "US";
const DEFAULT_FILETYPE_PLACEHOLDER: SlotPlaceholderProps = { extension: "pdf" };
const DEFAULT_ILLUSTRATION_PLACEHOLDER: SlotPlaceholderProps = {
  name: "amico-1212-sale-hidden",
};
const DEFAULT_EMOJI_PLACEHOLDER: SlotPlaceholderProps = { name: "waving_hand" };
const DEFAULT_LOGO_PLACEHOLDER: SlotPlaceholderProps = { name: "apple" };
const DEFAULT_COLOR_LOGO_PLACEHOLDER: SlotPlaceholderProps = {
  name: "typescript",
};
class ConfigLoader {
  private config: IUIConfig;

  constructor(config: IUIConfig = {}) {
    this.config = config;
  }

  getConfig(): IUIConfig {
    return this.config;
  }

  getSemanticColors(): SemanticColors | undefined {
    return this.config.theme?.colors?.semantic;
  }
  getBrandColor(): SafeColor | undefined {
    return this.config.theme?.colors?.brand?.set;
  }

  getNeutralColors(): NeutralColor | undefined {
    return this.config.theme?.colors?.neutral;
  }

  getAccentColors(): AccentColors | undefined {
    return this.config.theme?.colors?.accent || {};
  }

  getGradientColors(): GradientsConfig | undefined {
    return this.config.theme?.colors?.gradients || {};
  }

  getToken(path: string): any {
    const theme = this.config.theme;
    if (!theme) return undefined;

    const keys = path.split(".");
    let value: any = theme;

    for (const key of keys) {
      if (value && typeof value === "object") {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  getRadiusSet(): RadiusSet | undefined {
    return this.config.theme?.radius?.set;
  }

  getSpacingSet(): SpacingSet | undefined {
    return this.config.theme?.spacing?.set;
  }

  getPanelBackgroundSet(): PanelBackgroundSet | undefined {
    return this.config.theme?.panelBackground?.set;
  }

  /**
   * Get the important configuration
   * Returns undefined by default (Tailwind CSS behavior - no !important by default)
   */
  getImportant(): boolean | string | undefined {
    return this.config.core?.important;
  }
  /* -------------------- TYPOGRAPHY -------------------- */

  /**
   * Raw typography config
   */
  getTypography(): TypographyConfig | undefined {
    return this.config.theme?.typography;
  }

  /**
   * Typography provider
   */
  getTypographyProvider(): TypographyProvider | undefined {
    return this.config.theme?.typography?.provider;
  }

  /**
   * Default typography set (common across all providers)
   */
  getTypographySet(): string | undefined {
    return this.config.theme?.typography?.set;
  }

  /**
   * Local font URL (only for local provider)
   */
  getLocalFontUrls(): FontURL | readonly FontURL[] | undefined {
    const typography = this.config.theme?.typography;
    return typography?.provider === "local" ? typography.url : undefined;
  }

  /**
   * Typography font extensions
   * - google + local → allowed
   * - system → undefined
   */
  getTypographyExtend(): Record<FontAlias, FontFamily> | undefined {
    const typography = this.config.theme?.typography;

    if (!typography) return undefined;

    if (typography.provider === "google" || typography.provider === "local") {
      return typography.extend;
    }

    return undefined;
  }

  getMode(): modeConfig | undefined {
    return this.config.theme?.mode;
  }
  getModeDefault(): "light" | "dark" | undefined {
    return this.config.theme?.mode?.default;
  }
  getModeAllowSystem(): Boolean | true | undefined {
    return this.config.theme?.mode?.allowSystem;
  }
  getModeStorageKey(): string {
    return this.config.theme?.mode?.storageKey ?? "iui-theme";
  }

  getIconLibrary(): IconLibrary {
    return this.config.assets?.icon?.library ?? DEFAULT_ICON_LIBRARY;
  }
  getIconDefaults(): IconDefaults {
    const p = this.config.assets?.icon;
    if (!p) return DEFAULT_ICON_DEFAULTS;
    const {
      library: _,
      globalIcons: __,
      fallback: ___,
      placeholder: ____,
      preload: _____,
      binding: ______,
      ...opts
    } = p as IconDefaults & {
      library?: IconLibrary;
      globalIcons?: GlobalIconMap;
      fallback?: string;
      placeholder?: SlotPlaceholderProps;
      preload?: string;
      binding?: AssetBindingMode;
    };
    return { ...DEFAULT_ICON_DEFAULTS, ...opts };
  }

  getIconPlaceholderProps(): SlotPlaceholderProps {
    return {
      ...DEFAULT_ICON_PLACEHOLDER,
      ...(this.config.assets?.icon?.placeholder ?? {}),
    };
  }

  getIconFallback(): string {
    const library = normalizeIconLibraryId(this.getIconLibrary());
    return resolveIconFallbackGlyph(
      library,
      this.config.assets?.icon?.fallback,
    );
  }

  getGlobalIcons(): GlobalIconMap {
    return (this.config.assets?.icon?.globalIcons ?? {}) as GlobalIconMap;
  }

  getIllustrationLibrary(): IllustrationLibrary {
    return (
      this.config.assets?.illustration?.library ?? DEFAULT_ILLUSTRATION_LIBRARY
    );
  }

  getIllustrationDefaults(): IllustrationDefaults {
    const p = this.config.assets?.illustration;
    const style = p?.style;
    return style
      ? { ...DEFAULT_ILLUSTRATION_DEFAULTS, style }
      : DEFAULT_ILLUSTRATION_DEFAULTS;
  }

  getIllustrationPlaceholderProps(): SlotPlaceholderProps {
    return {
      ...DEFAULT_ILLUSTRATION_PLACEHOLDER,
      ...(this.config.assets?.illustration?.placeholder ?? {}),
    };
  }

  getIllustrationFallback(): string {
    return resolveAssetFallback(
      "illustration",
      this.config.assets?.illustration?.fallback,
    );
  }

  getGlobalIllustrations(): Record<string, string> {
    return (this.config.assets?.illustration?.globalIllustrations ??
      {}) as Record<string, string>;
  }

  getEmojiDefaults(): Partial<EmojiThemeConfig> {
    const p = this.config.assets?.emoji;
    const merged = (
      p ? { ...DEFAULT_EMOJI, ...p } : DEFAULT_EMOJI
    ) as Partial<EmojiThemeConfig> & {
      placeholder?: unknown;
      globalEmojis?: unknown;
    };
    const { placeholder: _ph, globalEmojis: _ge, ...rest } = merged;
    return rest;
  }

  getGlobalEmojis(): GlobalEmojiMap {
    return (this.config.assets?.emoji?.globalEmojis ?? {}) as GlobalEmojiMap;
  }

  getEmojiPlaceholderProps(): SlotPlaceholderProps {
    return {
      ...DEFAULT_EMOJI_PLACEHOLDER,
      ...(this.config.assets?.emoji?.placeholder ?? {}),
    };
  }

  getEmojiFallback(): string {
    return resolveAssetFallback("emoji", this.config.assets?.emoji?.fallback);
  }

  getFlagLibrary(): FlagLibrary {
    return this.config.assets?.flag?.library ?? DEFAULT_FLAG_LIBRARY;
  }

  getFlagDefaults(): FlagDefaults {
    const p = this.config.assets?.flag;
    return { ...(p?.defaults ?? {}) };
  }

  getFlagPlaceholderProps(): SlotPlaceholderProps {
    const raw = this.config.assets?.flag?.placeholder;
    if (typeof raw === "string" && raw.length > 0) {
      return { code: raw };
    }
    return {
      code: DEFAULT_FLAG_PLACEHOLDER_CODE,
      ...(typeof raw === "object" && raw != null ? raw : {}),
    };
  }

  getFlagPlaceholderCode(): string {
    const code = this.getFlagPlaceholderProps().code;
    return typeof code === "string" && code.length > 0
      ? code
      : DEFAULT_FLAG_PLACEHOLDER_CODE;
  }

  getFlagFallback(): string {
    return resolveAssetFallback("flag", this.config.assets?.flag?.fallback);
  }

  getGlobalFlags(): Record<string, string> {
    return (this.config.assets?.flag?.globalFlags ?? {}) as Record<string, string>;
  }

  getFileTypeLibrary(): FileTypeLibrary {
    return this.config.assets?.fileType?.library ?? DEFAULT_FILE_TYPE_LIBRARY;
  }

  getFileTypePlaceholderProps(): SlotPlaceholderProps {
    return {
      ...DEFAULT_FILETYPE_PLACEHOLDER,
      ...(this.config.assets?.fileType?.placeholder ?? {}),
    };
  }

  getFileTypeFallback(): string {
    return resolveAssetFallback(
      "fileType",
      this.config.assets?.fileType?.fallback,
    );
  }

  getGlobalFileTypes(): Record<string, string> {
    return (this.config.assets?.fileType?.globalFileTypes ??
      {}) as Record<string, string>;
  }

  getLogoPlaceholderProps(): SlotPlaceholderProps {
    return {
      ...DEFAULT_LOGO_PLACEHOLDER,
      ...(this.config.assets?.logo?.placeholder ?? {}),
    };
  }

  getGlobalLogos(): GlobalLogoMap {
    return (this.config.assets?.logo?.globalLogos ?? {}) as GlobalLogoMap;
  }

  getLogoFallback(): string {
    return resolveAssetFallback("logo", this.config.assets?.logo?.fallback);
  }

  getColorLogoPlaceholderProps(): SlotPlaceholderProps {
    return {
      ...DEFAULT_COLOR_LOGO_PLACEHOLDER,
      ...(this.config.assets?.colorLogo?.placeholder ?? {}),
    };
  }

  getGlobalColorLogos(): GlobalColorLogoMap {
    return (this.config.assets?.colorLogo?.globalColorLogos ??
      {}) as GlobalColorLogoMap;
  }

  getColorLogoFallback(): string {
    return resolveAssetFallback(
      "colorLogo",
      this.config.assets?.colorLogo?.fallback,
    );
  }

  getLoaderLibrary(): LoaderLibrary {
    return this.config.assets?.loader?.library ?? DEFAULT_LOADER_LIBRARY;
  }

  getLoaderDefaults(): LoaderDefaults {
    const p = this.config.assets?.loader;
    if (!p) return DEFAULT_LOADER_DEFAULTS;
    const {
      library: _library,
      placeholder: _placeholder,
      globalLoaders: _globalLoaders,
      fallback: _fallback,
      binding: _binding,
      ...opts
    } = p;
    const name =
      (typeof opts.name === "string" && opts.name.length > 0
        ? opts.name
        : undefined) ??
      (typeof p.placeholder?.name === "string" ? p.placeholder.name : undefined) ??
      DEFAULT_LOADER_DEFAULTS.name;
    return { ...DEFAULT_LOADER_DEFAULTS, ...opts, name };
  }

  getLoaderPlaceholderProps(): SlotPlaceholderProps {
    const p = this.config.assets?.loader;
    const name =
      (typeof p?.placeholder?.name === "string" && p.placeholder.name) ||
      (typeof p?.name === "string" && p.name) ||
      DEFAULT_LOADER_DEFAULTS.name;
    return { name, ...(p?.placeholder ?? {}) };
  }

  getLoaderFallback(): string {
    return resolveAssetFallback("loader", this.config.assets?.loader?.fallback);
  }

  getGlobalLoaders(): Record<string, string> {
    return (this.config.assets?.loader?.globalLoaders ?? {}) as Record<
      string,
      string
    >;
  }

  getAssetBinding(slotType: string): AssetBindingMode {
    const assets = this.config.assets;
    const globalBinding = assets?.binding ?? "lazy";

    switch (slotType) {
      case "icon":
        return assets?.icon?.binding ?? globalBinding;
      case "logo":
        return assets?.logo?.binding ?? globalBinding;
      case "color-logo":
        return assets?.colorLogo?.binding ?? globalBinding;
      case "flag":
        return assets?.flag?.binding ?? globalBinding;
      case "file-type":
        return assets?.fileType?.binding ?? globalBinding;
      case "loader":
        return assets?.loader?.binding ?? globalBinding;
      case "illustration":
        return assets?.illustration?.binding ?? globalBinding;
      case "emoji":
        return assets?.emoji?.binding ?? globalBinding;
      default:
        return globalBinding;
    }
  }

  getLogoVariant(): LogoVariant {
    // Logo config disabled for now – always return default
    return DEFAULT_LOGO_VARIANT;
    // return this.config.logo?.variant ?? DEFAULT_LOGO_VARIANT;
  }

  getLogoDefaults(): LogoDefaults {
    // Logo config disabled for now – always return empty
    return {};
    // return this.config.logo?.defaults ?? {};
  }

  getStatesConfig(): StatesConfig {
    if (!this.config.states) {
      const isEmptyDev =
        !this.config.theme &&
        !this.config.build &&
        !this.config.core &&
        !this.config.assets;
      if (isEmptyDev) return minimalPreset;
      return {
        focused: { mode: "native" },
        disabled: { style: "fade", opacity: 0.5 },
        loading: { style: "fade", spinner: true, cursor: "wait" },
      } as StatesConfig;
    }
    const states = this.config.states;
    const loading = states.loading;
    if (loading && loading.loader === undefined && loading.spinner) {
      const loaderDefaults = this.getLoaderDefaults();
      return { ...states, loading: { ...loading, loader: loaderDefaults } };
    }
    return states;
  }

  updateConfig(newConfig: IUIConfig): void {
    this.config = newConfig;
  }
}

const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Config caching system for performance optimization
 * ⚠️ IMPORTANT: Only caches config STRUCTURE, not runtime values
 * Font variables, theme state, and injected styles are NEVER cached
 *
 * ✅ SAFE TO CACHE:
 * - Config file structure (colors, spacing, radius config)
 * - Static configuration values
 *
 * ❌ NEVER CACHED (always fresh):
 * - font-family values
 * - --iui-font-* CSS variables
 * - theme JS state
 * - injected styles
 */
class ConfigCache {
  private cache: IUIConfig | null = null;
  private timestamp: number = 0;
  private readonly ttl: number;

  constructor(ttl: number = CONFIG_CACHE_TTL) {
    this.ttl = ttl;
  }

  /**
   * Get cached config if valid
   * NOTE: Even if config is cached, font variables are always refreshed
   */
  get(): IUIConfig | null {
    if (!this.cache) return null;

    // Check if cache is still valid
    if (Date.now() - this.timestamp > this.ttl) {
      this.clear();
      return null;
    }

    // ⚠️ Config structure is cached, but font values will be refreshed on application
    return this.cache;
  }

  /**
   * Set config in cache
   * NOTE: Only caches config structure, not runtime font/theme values
   */
  set(config: IUIConfig): void {
    this.cache = config;
    this.timestamp = Date.now();
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache = null;
    this.timestamp = 0;
  }

  /**
   * Check if cache is valid
   */
  isValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.timestamp <= this.ttl;
  }

  /**
   * Get cache age in milliseconds
   */
  getAge(): number {
    if (!this.cache) return Infinity;
    return Date.now() - this.timestamp;
  }
}

const configCacheInstance = new ConfigCache();
let configLoaderInstance: ConfigLoader | null = null;

/** Cross-entry singleton keys — `index` and `slots` bundles must share one loader. */
const GLOBAL_LOADER_KEY = "__IUI_CONFIG_LOADER__" as const;
const GLOBAL_CACHE_KEY = "__IUI_CONFIG_CACHE__" as const;

type IuiConfigGlobals = typeof globalThis & {
  [GLOBAL_LOADER_KEY]?: ConfigLoader | null;
  [GLOBAL_CACHE_KEY]?: ConfigCache;
};

function globals(): IuiConfigGlobals {
  return globalThis as IuiConfigGlobals;
}

function sharedCache(): ConfigCache {
  const g = globals();
  if (!g[GLOBAL_CACHE_KEY]) {
    // Prefer existing module-local cache when this entry created it first.
    g[GLOBAL_CACHE_KEY] = configCacheInstance;
  }
  return g[GLOBAL_CACHE_KEY]!;
}

function getSharedLoader(): ConfigLoader | null {
  return globals()[GLOBAL_LOADER_KEY] ?? configLoaderInstance;
}

function setSharedLoader(loader: ConfigLoader | null): void {
  configLoaderInstance = loader;
  globals()[GLOBAL_LOADER_KEY] = loader;
}

export function initConfig(config: IUIConfig): ConfigLoader {
  // Cache the config (may include assets from iui.assets.json)
  sharedCache().set(config);

  const loader = new ConfigLoader(config);
  setSharedLoader(loader);
  return loader;
}

export function getConfigLoader(): ConfigLoader {
  let loader = getSharedLoader();
  if (!loader) {
    // Try to restore from cache if available
    const cachedConfig = sharedCache().get();
    if (cachedConfig) {
      loader = new ConfigLoader(cachedConfig);
      setSharedLoader(loader);
      return loader;
    }
    throw new Error("Config not initialized. Call initConfig() first.");
  }
  return loader;
}

/**
 * Get cached config directly (for performance optimization). Includes assets if merged at init.
 */
export function getCachedConfig(): IUIConfig | null {
  return sharedCache().get();
}

/**
 * Clear config cache (useful for testing or hot reload)
 */
export function clearConfigCache(): void {
  sharedCache().clear();
  setSharedLoader(null);
  // Keep module-local mirror in sync when this entry owns a distinct ConfigCache instance.
  if (configCacheInstance !== sharedCache()) {
    configCacheInstance.clear();
  }
}

/**
 * Check if config cache is valid
 */
export function isConfigCacheValid(): boolean {
  return sharedCache().isValid();
}

export function getToken(path: string): any {
  return getConfigLoader().getToken(path);
}

export function getSemanticColors(): SemanticColors | undefined {
  return getConfigLoader().getSemanticColors();
}

export function getBrandColor(): SafeColor | undefined {
  return getConfigLoader().getBrandColor();
}
export function getNeutralColors(): NeutralColors | undefined {
  return getConfigLoader().getNeutralColors();
}

export function getAccentColors(): AccentColors | undefined {
  return getConfigLoader().getAccentColors();
}

export function getGradientColors(): GradientsConfig | undefined {
  return getConfigLoader().getGradientColors();
}

export function getRadiusSet(): RadiusSet | undefined {
  return getConfigLoader().getRadiusSet();
}

export function getSpacingSet(): SpacingSet | undefined {
  return getConfigLoader().getSpacingSet();
}

export function getPanelBackgroundSet(): PanelBackgroundSet | undefined {
  return getConfigLoader().getPanelBackgroundSet();
}

export function getImportant(): boolean | string | undefined {
  return getConfigLoader().getImportant();
}

export function getTypographySet(): BuiltInFonts | string | undefined {
  return getConfigLoader().getTypographySet();
}

// Fixed: Return type now matches actual return (includes undefined)
export function getTypographyProvider(): TypographyProvider | undefined {
  return getConfigLoader().getTypographyProvider();
}

export function getTypographyExtend(): Record<string, FontFamily> {
  const result = getConfigLoader().getTypographyExtend();
  return result || {};
}
export function getLocalFontUrls(): string[] {
  const result = getConfigLoader().getLocalFontUrls();
  if (!result) return [];
  // Convert FontURL | readonly FontURL[] to string[]
  if (Array.isArray(result)) {
    return result.map((url) => String(url));
  }
  return [String(result)];
}
export function getMode(): modeConfig | undefined {
  return getConfigLoader().getMode();
}
export function getModeDefault(): "light" | "dark" | undefined {
  return getConfigLoader().getModeDefault();
}
// Fixed: Return type now matches actual return (includes undefined)
export function getModeAllowSystem(): Boolean | true | undefined {
  return getConfigLoader().getModeAllowSystem();
}
export function getModeStorageKey(): string {
  return getConfigLoader().getModeStorageKey();
}
export function getIconLibrary(): IconLibrary {
  return getConfigLoader().getIconLibrary();
}
export function getIconDefaults(): IconDefaults {
  return getConfigLoader().getIconDefaults();
}
export function getIconFallback(): string {
  return getConfigLoader().getIconFallback();
}
export function getIconPlaceholderProps(): SlotPlaceholderProps {
  return getConfigLoader().getIconPlaceholderProps();
}
export function getGlobalIcons(): GlobalIconMap {
  return getConfigLoader().getGlobalIcons();
}
export function getIllustrationLibrary(): IllustrationLibrary {
  return getConfigLoader().getIllustrationLibrary();
}
export function getIllustrationDefaults(): IllustrationDefaults {
  return getConfigLoader().getIllustrationDefaults();
}
export function getIllustrationPlaceholderProps(): SlotPlaceholderProps {
  return getConfigLoader().getIllustrationPlaceholderProps();
}
export function getIllustrationFallback(): string {
  return getConfigLoader().getIllustrationFallback();
}
export function getGlobalIllustrations(): Record<string, string> {
  return getConfigLoader().getGlobalIllustrations();
}
export function getEmojiDefaults(): Partial<EmojiThemeConfig> {
  return getConfigLoader().getEmojiDefaults();
}
export function getEmojiPlaceholderProps(): SlotPlaceholderProps {
  return getConfigLoader().getEmojiPlaceholderProps();
}
export function getEmojiFallback(): string {
  return getConfigLoader().getEmojiFallback();
}
export function getGlobalEmojis(): GlobalEmojiMap {
  return getConfigLoader().getGlobalEmojis();
}
export function getFlagLibrary(): FlagLibrary {
  return getConfigLoader().getFlagLibrary();
}
export function getFlagDefaults(): FlagDefaults {
  return getConfigLoader().getFlagDefaults();
}
export function getFlagPlaceholderCode(): string {
  return getConfigLoader().getFlagPlaceholderCode();
}
export function getFlagPlaceholderProps(): SlotPlaceholderProps {
  return getConfigLoader().getFlagPlaceholderProps();
}
export function getFlagFallback(): string {
  return getConfigLoader().getFlagFallback();
}
export function getGlobalFlags(): Record<string, string> {
  return getConfigLoader().getGlobalFlags();
}
export function getFileTypeLibrary(): FileTypeLibrary {
  return getConfigLoader().getFileTypeLibrary();
}
export function getFileTypePlaceholderProps(): SlotPlaceholderProps {
  return getConfigLoader().getFileTypePlaceholderProps();
}
export function getFileTypeFallback(): string {
  return getConfigLoader().getFileTypeFallback();
}
export function getGlobalFileTypes(): Record<string, string> {
  return getConfigLoader().getGlobalFileTypes();
}
export function getLogoPlaceholderProps(): SlotPlaceholderProps {
  return getConfigLoader().getLogoPlaceholderProps();
}
export function getGlobalLogos(): GlobalLogoMap {
  return getConfigLoader().getGlobalLogos();
}
export function getLogoFallback(): string {
  return getConfigLoader().getLogoFallback();
}
export function getColorLogoPlaceholderProps(): SlotPlaceholderProps {
  return getConfigLoader().getColorLogoPlaceholderProps();
}
export function getGlobalColorLogos(): GlobalColorLogoMap {
  return getConfigLoader().getGlobalColorLogos();
}
export function getColorLogoFallback(): string {
  return getConfigLoader().getColorLogoFallback();
}
export function getLoaderLibrary(): LoaderLibrary {
  return getConfigLoader().getLoaderLibrary();
}
export function getLoaderDefaults(): LoaderDefaults {
  return getConfigLoader().getLoaderDefaults();
}
export function getLoaderPlaceholderProps(): SlotPlaceholderProps {
  return getConfigLoader().getLoaderPlaceholderProps();
}
export function getLoaderFallback(): string {
  return getConfigLoader().getLoaderFallback();
}
export function getGlobalLoaders(): Record<string, string> {
  return getConfigLoader().getGlobalLoaders();
}
export function getLogoVariant(): LogoVariant {
  return getConfigLoader().getLogoVariant();
}
export function getLogoDefaults(): LogoDefaults {
  return getConfigLoader().getLogoDefaults();
}
export function getAssetBinding(slotType: string): AssetBindingMode {
  return getConfigLoader().getAssetBinding(slotType);
}
export function isScannedAssetBinding(slotType: string): boolean {
  return getAssetBinding(slotType) === "scanned";
}
export function getStatesConfig(): StatesConfig {
  return getConfigLoader().getStatesConfig();
}

/** Sentinel: substitute from `assets.*.placeholder` config blocks. */
export const SLOT_PLACEHOLDER_SENTINEL = "@placeholder";

/**
 * Shallow-merge: for each own string key (except `type`), if the value is
 * {@link SLOT_PLACEHOLDER_SENTINEL}, replace it with `map[key]` when that entry is defined.
 * Returns the original `slot` when nothing changes (referential equality preserved).
 */
export function resolvePlaceholderValuesInObject<T extends object>(
  slot: T,
  map: Readonly<SlotPlaceholderProps>,
): T {
  const plain = slot as Record<string, unknown>;
  let next: Record<string, unknown> | undefined;

  for (const key of Object.keys(plain)) {
    if (key === "type") continue;
    const v = plain[key];
    if (v !== SLOT_PLACEHOLDER_SENTINEL) continue;
    const resolved = map[key];
    if (resolved === undefined) continue;
    if (next === undefined) next = { ...plain };
    next[key] = resolved;
  }

  return next !== undefined ? (next as T) : slot;
}

export { ConfigLoader };
export default ConfigLoader;
