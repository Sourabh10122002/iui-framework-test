import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { resolveInstalledPackageDir } from "./scan-source-utils.mjs";

/** Default package dist folders scanned for component library class names. */
export const DEFAULT_SCAN_PACKAGES = ["@inventive-ui/components"];

/** Default app source directories (relative to project root). */
import { DEFAULT_IUI_SCAN_DIRS } from "./iui-paths.mjs";

export const DEFAULT_SCAN_DIRS = DEFAULT_IUI_SCAN_DIRS;

/**
 * @param {string} manifestPath
 * @returns {string[]}
 */
function readCompileSafelistFromManifestFile(manifestPath) {
  if (!existsSync(manifestPath)) return [];

  try {
    const raw = readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    const list = manifest?.compile?.safelist ?? manifest?.compileSafelist;
    if (!Array.isArray(list)) return [];
    return list.filter((entry) => typeof entry === "string" && entry.trim());
  } catch {
    return [];
  }
}

/**
 * Read compile.safelist entries from an installed package iui-manifest.json.
 * When the project root is the package itself (monorepo / Storybook in components),
 * reads `{projectRoot}/iui-manifest.json` before `node_modules`.
 *
 * Resolves packages from the nearest/hoisted node_modules (workspaces).
 *
 * @param {string} projectRoot
 * @param {string} packageName
 * @returns {string[]}
 */
export function readPackageCompileSafelist(projectRoot, packageName) {
  if (!projectRoot || !packageName) return [];

  const localManifest = join(projectRoot, "iui-manifest.json");
  try {
    const pkgJsonPath = join(projectRoot, "package.json");
    if (existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
      if (pkg?.name === packageName && existsSync(localManifest)) {
        return readCompileSafelistFromManifestFile(localManifest);
      }
    }
  } catch {
    // fall through to node_modules lookup
  }

  const pkgDir = resolveInstalledPackageDir(projectRoot, packageName);
  if (!pkgDir) return [];
  return readCompileSafelistFromManifestFile(join(pkgDir, "iui-manifest.json"));
}

/**
 * Merge safelist entries from installed scanPackages manifests.
 * @param {string | undefined} projectRoot
 * @param {string[]} scanPackages
 * @returns {string[]}
 */
export function readScanPackagesCompileSafelist(projectRoot, scanPackages) {
  if (!projectRoot || !Array.isArray(scanPackages)) return [];
  const merged = [];
  for (const pkg of scanPackages) {
    if (typeof pkg !== "string" || !pkg.trim()) continue;
    merged.push(...readPackageCompileSafelist(projectRoot, pkg));
  }
  return merged;
}

/**
 * Merge plugin scan options with iui.config `build` block.
 * @param {Record<string, unknown> | null | undefined} config
 * @param {Record<string, unknown>} [pluginScan]
 * @param {string} [projectRoot]
 */
export function resolveBuildScanOptions(config, pluginScan = {}, projectRoot) {
  const build = config?.build ?? {};

  const scanDirs =
    pluginScan.scanDirs ?? build.scanDirs ?? DEFAULT_SCAN_DIRS;

  const scanPackages =
    pluginScan.scanPackages ?? build.scanPackages ?? DEFAULT_SCAN_PACKAGES;

  const includePackageSafelist =
    pluginScan.packageSafelist ?? build.packageSafelist ?? false;

  const safelist = [
    ...(Array.isArray(build.safelist) ? build.safelist : []),
    ...(Array.isArray(pluginScan.safelist) ? pluginScan.safelist : []),
    ...(includePackageSafelist
      ? readScanPackagesCompileSafelist(projectRoot, scanPackages)
      : []),
  ];

  return {
    scanDirs,
    scanPackages,
    safelist: [...new Set(safelist)],
    include: pluginScan.include ?? build.include,
    exclude: pluginScan.exclude ?? build.exclude ?? ["**/*.test.*", "**/*.spec.*"],
    useAst: pluginScan.useAst ?? build.useAst,
    shadeDiagnostics:
      pluginScan.shadeDiagnostics ?? build.shadeDiagnostics ?? "warn",
    minify: pluginScan.minify ?? build.minify,
  };
}
