/**
 * IUI Framework - Server / SSR entry point
 *
 * Industry standard: Separate entry keeps SSR code out of browser bundle.
 * Provides server-safe utilities for Next.js SSR (Chakra UI/MUI pattern)
 */

// SSR Style Extraction (industry standard - Chakra/MUI pattern)
export {
  generateCriticalCSS,
  generateCriticalCSSWithMeta,
  generateCriticalCSSFromRegistry,
  generateThemeCSSVars,
  generateBuildCSS,
  extractClassesFromContent,
  createSSRRegistry,
  generateSSRStyles,
  SSRRegistry,
} from "./ssr-extraction";
export { generateFullThemeCSS } from "./generate-theme-css";
export {
  generateThemeInitScript,
  resolveThemeInitOptions,
  resolveShellBootColors,
  deriveShellBootFromTheme,
  hashThemeInitScript,
  injectThemeInitScriptIntoHtml,
  THEME_BOOT_BG,
  THEME_BOOT_FG,
} from "./generate-theme-init-script";
export { collectStateUtilityClasses } from "./generate-state-utilities";
export { expandShadeClasses } from "./expand-shade-classes";
export { expandThemeUtilityClasses } from "./expand-theme-utility-classes";
export {
  expandThemeGrayUtilityClasses,
  THEME_GRAY_STEPS,
  filterChromaticGrayUtilitiesWithoutAccent,
  accentPaletteIncludesGray,
} from "./expand-theme-gray-utility-classes";
export { expandBuildClasses, collectFilePaletteSignals } from "./expand-build-classes";
export {
  resolvePaletteUtilities,
  resolvePaletteUtilitiesFromPatterns,
} from "./resolve-palette-utilities";
export { getConfigPalettes, COLOR_SHADE_STEPS } from "./get-config-palettes";
export type { BuildCSSResult, CriticalCSSResult } from "./ssr-extraction";
export type { FullThemeCSSResult } from "./generate-theme-css";
export type { ThemeInitScriptOptions } from "./generate-theme-init-script";
export type { CollectStateUtilityOptions } from "./generate-state-utilities";

// Legacy (kept for compatibility)
export function extractIUIStyles(): string {
  return "";
}

/** Per-request registry for SSR; use createSSRRegistry for new code. */
export { createSSRRegistry as createIUIRegistry } from "./ssr-extraction";

export {
  IUIRegistryContext,
  useIUIRegistry,
  useIUIRegisterClassNames,
} from "./registry-context";
