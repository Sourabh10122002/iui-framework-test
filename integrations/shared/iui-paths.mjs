import { join } from "path";

/** User-visible IUI metadata + codegen root (committed). */
export const IUI_DIR = ".iui";

/** Generated source artifacts — committed. */
export const IUI_GENERATED_SEGMENT = "generated";

/** Disposable build/cache artifacts — gitignored. */
export const IUI_CACHE_SEGMENT = "cache";

export const IUI_CACHE_FILES = {
  scan: "scan.cache.json",
  styles: "styles.css",
  manifest: "manifest.js",
  stylesInject: "styles.inject.js",
  stylesInline: "styles.inline.js",
  slotState: "slot-state.json",
  slotLock: "slot.lock",
  utilities: "utilities.css",
  manifestJson: "manifest.json",
  slotWarmup: "slot-warmup.mjs",
};

/** Vite dev middleware public URL for compiled stylesheet. */
export const STYLES_CSS_PUBLIC_PATH = `/${IUI_DIR}/${IUI_CACHE_SEGMENT}/${IUI_CACHE_FILES.styles}`;

/**
 * Compile-first CSS cache artifacts written per active bundler integration.
 * Scan cache + CLI state are integration-agnostic and managed separately.
 *
 * @typedef {'vite' | 'webpack' | 'next'} IuiBuildIntegration
 */
export const CSS_CACHE_ARTIFACTS_BY_INTEGRATION = {
  vite: ["styles", "manifest"],
  webpack: ["styles", "manifest", "stylesInject"],
  next: ["styles", "manifest", "stylesInline"],
};

/** @param {IuiBuildIntegration} integration */
export function cssCacheArtifactsForIntegration(integration) {
  return (
    CSS_CACHE_ARTIFACTS_BY_INTEGRATION[integration] ??
    CSS_CACHE_ARTIFACTS_BY_INTEGRATION.webpack
  );
}

/**
 * @param {string} projectRoot
 */
export function iuiRoot(projectRoot) {
  return join(projectRoot, IUI_DIR);
}

/**
 * @param {string} projectRoot
 */
export function iuiGeneratedDir(projectRoot) {
  return join(iuiRoot(projectRoot), IUI_GENERATED_SEGMENT);
}

/**
 * @param {string} projectRoot
 */
export function iuiCacheDir(projectRoot) {
  return join(iuiRoot(projectRoot), IUI_CACHE_SEGMENT);
}

/**
 * @param {string} projectRoot
 * @param {keyof typeof IUI_CACHE_FILES} name
 */
export function iuiCacheFile(projectRoot, name) {
  return join(iuiCacheDir(projectRoot), IUI_CACHE_FILES[name]);
}

/**
 * Default source scan roots — generated codegen only, not disposable cache.
 */
export const DEFAULT_IUI_SCAN_DIRS = ["src", `${IUI_DIR}/${IUI_GENERATED_SEGMENT}`];
