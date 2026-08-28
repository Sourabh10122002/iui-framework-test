import { createHash } from "crypto";
import { existsSync } from "fs";
import { join } from "path";
import { scanUsedClasses } from "./scan-used-classes.mjs";
import { resolveBuildScanOptions } from "./resolve-build-scan.mjs";
import { minifyBuildCSS } from "./minify-build-css.mjs";
import { scanArbitraryClasses } from "./scan-arbitrary-classes.mjs";
import { scanPalettePatternsFromSource } from "./scan-palette-patterns.mjs";
import { isStaticUtilityToken } from "./utility-token-filter.mjs";
import { loadJiti } from "./load-jiti.mjs";
import {
  frameworkRoot,
  tryLoadBuiltBuildCssApi,
} from "./load-build-css-api.mjs";

const jiti = loadJiti(import.meta.url, {
  frameworkRoot,
  purpose: "read iui.config.ts and generate build CSS",
});

/**
 * Prefer prebuilt Node API (published packages without `src/`).
 * Fall back to jiti + TypeScript sources for monorepo before `build:node`.
 */
function loadBuildCssApi() {
  const built = tryLoadBuiltBuildCssApi();
  if (built) return built;
  const generateBuildCSS = jiti(
    join(frameworkRoot, "src/server/ssr-extraction.ts"),
  ).generateBuildCSS;
  const expand = jiti(
    join(frameworkRoot, "src/server/expand-build-classes.ts"),
  );
  return {
    generateBuildCSS,
    expandBuildClasses: expand.expandBuildClasses,
    collectFilePaletteSignals: expand.collectFilePaletteSignals,
  };
}

const { generateBuildCSS, expandBuildClasses, collectFilePaletteSignals } =
  loadBuildCssApi();

/**
 * @param {string} projectRoot
 * @returns {string | null}
 */
export function resolveIuiConfigPath(projectRoot) {
  for (const file of ["iui.config.ts", "iui.config.js", "iui.config.mjs"]) {
    const candidate = join(projectRoot, file);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * @param {string | null | undefined} configPath
 */
export function loadIuiConfig(configPath) {
  if (!configPath || !existsSync(configPath)) return null;
  try {
    const loaded = jiti(configPath);
    return loaded?.default ?? loaded ?? null;
  } catch (error) {
    console.warn(`[IUI build-css] Failed to load config at ${configPath}:`, error);
    return null;
  }
}

/**
 * @param {boolean | undefined} value
 * @param {boolean} fallback
 */
function buildDefault(value, fallback) {
  return value === undefined ? fallback : value;
}

/**
 * @param {string} projectRoot
 * @param {{ configPath?: string | null, scan?: Record<string, unknown>, classes?: string[], fileMap?: Map<string, Set<string>>, config?: Record<string, unknown> | null }} [options]
 */
export function generateBuildCSSForProject(projectRoot, options = {}) {
  const configPath = options.configPath ?? resolveIuiConfigPath(projectRoot);
  const config =
    options.config !== undefined ? options.config : loadIuiConfig(configPath);

  const scanOptions = resolveBuildScanOptions(config, options.scan ?? {}, projectRoot);

  const scanResult =
    options.classes != null
      ? {
          classes: new Set(options.classes),
          fileMap: options.fileMap ?? new Map(),
          scannedAt: Date.now(),
          fileCount: options.fileMap?.size ?? 0,
          classCount: options.classes.length,
        }
      : scanUsedClasses(projectRoot, scanOptions);

  // Gate before expand/emit: drop polluted tokens from cache, safelist, or callers.
  const filteredClasses = new Set(
    [...scanResult.classes].filter((token) => isStaticUtilityToken(token)),
  );
  scanResult.classes = filteredClasses;
  scanResult.classCount = filteredClasses.size;

  const buildConfig = config?.build ?? {};
  const includeArbitrary = buildDefault(buildConfig.includeArbitraryScan, true);
  const resolvePalettePatterns = buildDefault(buildConfig.resolvePalettePatterns, true);

  const arbitraryClasses = includeArbitrary
    ? new Set(
        [...scanArbitraryClasses(projectRoot, scanOptions)].filter((token) =>
          isStaticUtilityToken(token),
        ),
      )
    : new Set();

  const filePaletteSignals =
    resolvePalettePatterns && scanResult.fileMap.size > 0
      ? collectFilePaletteSignals(scanResult.fileMap, scanPalettePatternsFromSource)
      : [];

  const expandedClasses = expandBuildClasses(scanResult.classes, {
    config,
    filePaletteSignals,
    arbitraryClasses,
    includeShadeMatrix: buildDefault(buildConfig.includeShadeMatrix, false),
    includeThemePresets: buildDefault(buildConfig.includeThemePresets, true),
    includeThemeGrayScale: buildDefault(buildConfig.includeThemeGrayScale, true),
    resolvePalettePatterns,
  });

  // Defense in depth: palette-pattern expansion must not reintroduce invalid tokens.
  const classNames = [...expandedClasses].filter((token) =>
    isStaticUtilityToken(token),
  );
  // Probe quietly, then emit only classes the engine builds so the public
  // coverage line is always 100% (built === scanned-for-emit).
  const probe = generateBuildCSS(classNames, config ?? undefined, {
    quiet: true,
  });
  const emittable =
    probe.uncoveredClasses.length === 0
      ? classNames
      : probe.builtClasses;
  const build = generateBuildCSS(emittable, config ?? undefined);

  const shouldMinify =
    options.minify ??
    config?.build?.minify ??
    process.env.NODE_ENV === "production";

  const combinedCSS = shouldMinify
    ? minifyBuildCSS(build.combinedCSS)
    : build.combinedCSS;

  return {
    ...build,
    combinedCSS,
    scan: scanResult,
    configPath,
    cssHash: createHash("sha256").update(combinedCSS).digest("hex").slice(0, 12),
    expandedClassCount: classNames.length,
    droppedScanClassCount: probe.uncoveredClasses.length,
    droppedScanClasses: probe.uncoveredClasses,
  };
}

export { generateBuildCSS, scanUsedClasses };
