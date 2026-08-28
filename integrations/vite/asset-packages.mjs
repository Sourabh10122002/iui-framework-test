import { existsSync } from "fs";
import { dirname, join, parse, resolve } from "path";

/** Asset packages loaded lazily by Framework slots — exclude from optimizeDeps.pre-bundle. */
export const IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE = [
  "@inventive-ui/icons-lucide",
  "@inventive-ui/icons-phosphor",
  "@inventive-ui/icons-material",
  "@inventive-ui/material-symbols",
  "@inventive-ui/logos",
  "@inventive-ui/color-logos",
  "@inventive-ui/flags",
  "@inventive-ui/file-types",
  "@inventive-ui/loaders",
  "@inventive-ui/illustrations",
  "@inventive-ui/emoji",
];

/** Walk up from Vite root; use the topmost hoisted `node_modules/@inventive-ui`. */
export function findInventiveUiNodeModulesRoot(startDir) {
  let dir = resolve(startDir);
  const fsRoot = parse(dir).root;
  let best = null;

  while (true) {
    if (existsSync(join(dir, "node_modules", "@inventive-ui"))) {
      best = dir;
    }
    if (dir === fsRoot) break;
    dir = dirname(dir);
  }

  return best ?? resolve(startDir);
}

const ASSET_SUBPATH_PACKAGES = [
  { pkg: "icons-lucide", dir: "icons", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "icons-phosphor", dir: "icons", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "icons-material", dir: "icons", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "material-symbols", dir: "icons", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "logos", dir: "logos", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "color-logos", dir: "logos", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "flags", dir: "flags", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "file-types", dir: "types", reserved: new Set(["react", "vanilla", "utils"]) },
];

function pkgDist(projectRoot, pkg, ...parts) {
  return join(projectRoot, "node_modules", "@inventive-ui", pkg, "dist", ...parts);
}

function existingPkgFile(projectRoot, pkg, ...parts) {
  const file = pkgDist(projectRoot, pkg, ...parts);
  return existsSync(file) ? file : null;
}

/** Map @inventive-ui/<pkg>/<name> → dist file (Vite dep-scan misses export wildcards). */
export function resolveAssetSubpath(projectRoot, source) {
  for (const { pkg, dir, reserved } of ASSET_SUBPATH_PACKAGES) {
    const prefix = `@inventive-ui/${pkg}/`;
    if (!source.startsWith(prefix)) continue;
    const sub = source.slice(prefix.length);
    if (!sub || sub.includes("/")) continue;
    if (sub === "react") return existingPkgFile(projectRoot, pkg, "react.js");
    if (sub === "vanilla") return existingPkgFile(projectRoot, pkg, "vanilla.js");
    if (sub === "utils") return existingPkgFile(projectRoot, pkg, "index.js");
    if (reserved.has(sub)) continue;
    return existingPkgFile(projectRoot, pkg, dir, `${sub}.js`);
  }

  const loaderSubpath = source.match(/^@inventive-ui\/loaders\/([^/]+)$/);
  if (loaderSubpath && loaderSubpath[1] !== "react") {
    return existingPkgFile(projectRoot, "loaders", "loaders", `${loaderSubpath[1]}.js`);
  }

  const familyScene = source.match(
    /^@inventive-ui\/illustrations\/(amico|bro|cuate|pana|rafiki)\/([^/]+)$/,
  );
  if (familyScene) {
    return existingPkgFile(
      projectRoot,
      "illustrations",
      familyScene[1],
      `${familyScene[2]}.js`,
    );
  }

  if (source === "@inventive-ui/illustrations/illustrations.json") {
    return existingPkgFile(projectRoot, "illustrations", "illustrations.json");
  }

  if (source === "@inventive-ui/color-logos/dist/color-logos.json") {
    return existingPkgFile(projectRoot, "color-logos", "color-logos.json");
  }

  return null;
}

/** True for `@inventive-ui/<asset-pkg>/<glyph>` style imports (not package entrypoints). */
export function isInventiveUiAssetGlyphImport(source) {
  if (!source.startsWith("@inventive-ui/")) return false;

  for (const { pkg, reserved } of ASSET_SUBPATH_PACKAGES) {
    const prefix = `@inventive-ui/${pkg}/`;
    if (!source.startsWith(prefix)) continue;
    const sub = source.slice(prefix.length);
    if (!sub || sub.includes("/")) continue;
    if (reserved.has(sub)) return false;
    return true;
  }

  const loaderSubpath = source.match(/^@inventive-ui\/loaders\/([^/]+)$/);
  if (loaderSubpath && loaderSubpath[1] !== "react") return true;

  if (
    /^@inventive-ui\/illustrations\/(amico|bro|cuate|pana|rafiki)\/[^/]+$/.test(source)
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves static `@inventive-ui/<pkg>/<subpath>` imports (docs-icons, tree-shaking).
 * Pair with `inventiveUiSlotAssetsPlugin()` for runtime Framework slots in production.
 */
export function inventiveUiAssetSubpathResolver(options = {}) {
  let projectRoot = process.cwd();

  return {
    name: "inventive-ui-asset-subpath-resolver",
    enforce: "pre",
    configResolved(config) {
      const viteRoot = options.root ?? config.root ?? process.cwd();
      projectRoot = findInventiveUiNodeModulesRoot(viteRoot);
    },
    resolveId(source) {
      return resolveAssetSubpath(projectRoot, source);
    },
  };
}
