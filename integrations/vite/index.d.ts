export interface IUIViteOptions {
  configPath?: string;
  root?: string;
  /**
   * When true, runtime slot hooks fall back to `import.meta.glob` for unscanned glyphs.
   * Prefer `assetRuntimeExternal` for Storybook — globbing entire catalogs OOMs CI builds.
   */
  assetCatalog?: boolean;
  /**
   * Public URL prefix for runtime glyph loading without bundling (e.g. `/iui-assets`).
   * Pair with Storybook `staticDirs` that copy `@inventive-ui` package `dist` trees into the output.
   * Applied only during Vite `build`; dev `serve` keeps relative dynamic imports through Vite.
   */
  assetRuntimeExternal?: string;
  /** When true, write `.iui/cache/utilities.css` to disk (debug). Plugin option overrides `iui.config` build.writeFiles. */
  writeFiles?: boolean;
  scan?: {
    scanDirs?: string[];
    scanPackages?: string[];
    include?: string[];
    exclude?: string[];
    safelist?: string[];
    useAst?: boolean;
    shadeDiagnostics?: "warn" | "error" | "silent";
    minify?: boolean;
  };
}

/**
 * Core plugin — resolves deprecated `iui-bootstrap` to bootstrap-state bridge; stubs missing optional packages.
 */
declare function iuiPlugin(options?: IUIViteOptions): import("vite").Plugin;

/**
 * Resolves static `@inventive-ui/<pkg>/<glyph>` subpath imports.
 */
declare function inventiveUiAssetSubpathResolver(options?: { root?: string }): import("vite").Plugin;

/**
 * Scans consumer source for slot/static asset usage and rewrites hook dynamic imports
 * to minimal per-glyph loader maps (not full package globs). Required for Framework
 * runtime asset slots in production.
 */
declare function inventiveUiSlotAssetsPlugin(options?: {
  root?: string;
  scan?: IUIViteOptions["scan"];
  assetCatalog?: boolean;
  assetRuntimeExternal?: string;
}): import("vite").Plugin;

declare function resolveAssetSubpath(projectRoot: string, source: string): string | null;

declare const IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE: readonly string[];

declare function scanUsedSlotAssets(
  viteRoot: string,
  options?: {
    scanDirs?: string[];
    include?: string[];
    exclude?: string[];
  },
): Map<string, Set<string>>;

declare function lookupKeyToModuleId(pkg: string, lookupKey: string): string;

/**
 * Compile-first CSS: scans class names, generates CSS in Node, auto-injects virtual stylesheet.
 */
declare function iuiBuildCSSPlugin(options?: IUIViteOptions): import("vite").Plugin;

declare function scanUsedClasses(
  projectRoot: string,
  options?: {
    scanDirs?: string[];
    scanPackages?: string[];
    include?: string[];
    exclude?: string[];
    safelist?: string[];
    shadeDiagnostics?: "warn" | "error" | "silent";
  },
): {
  classes: Set<string>;
  fileMap: Map<string, Set<string>>;
  scannedAt: number;
  fileCount: number;
  classCount: number;
  diagnostics: Array<{
    code: "IUI_SHADE_DYNAMIC";
    filename: string;
    line: number;
    method: string;
    reason: string;
    message: string;
  }>;
};

declare function extractClassesFromSource(content: string): Set<string>;

declare function generateBuildCSSForProject(
  projectRoot: string,
  options?: Record<string, unknown>,
): Record<string, unknown>;

/**
 * Official Inventive UI Vite integration (config + compile CSS + static subpaths + runtime slots).
 *
 * Static imports need no extra setup. Framework slots require this plugin in production.
 */
declare function inventiveUiVite(options?: IUIViteOptions): import("vite").PluginOption[];

export default inventiveUiVite;
export {
  iuiPlugin,
  iuiBuildCSSPlugin,
  inventiveUiAssetSubpathResolver,
  inventiveUiSlotAssetsPlugin,
  inventiveUiVite,
  resolveAssetSubpath,
  IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE,
  scanUsedSlotAssets,
  scanUsedClasses,
  extractClassesFromSource,
  generateBuildCSSForProject,
  lookupKeyToModuleId,
};
