import { resolveAssetSubpath, findInventiveUiNodeModulesRoot } from "./asset-packages.mjs";
import { scanUsedSlotAssets, lookupKeyToModuleId } from "./scan-used-slot-assets.mjs";
import {
  transformAssetDistModule,
  isTransformableAssetDist,
  packageFolderFromId,
} from "../shared/slot-transform.mjs";
import { getWarmupModuleSource } from "../shared/write-slot-warmup.mjs";

const WARMUP_MODULE_ID = "iui-slot-warmup";
const VIRTUAL_WARMUP = "\0iui-slot-warmup";
const WARMUP_STUB_SOURCE =
  "export function warmScannedSlotAssets() {}\nexport default function warmScannedSlotAssetsDefault() {}";

/** Stub virtual warmup during optimizeDeps so pre-bundling @inventive-ui/framework does not fail. */
function iuiSlotWarmupOptimizeDepsPlugin() {
  return {
    name: "iui-slot-warmup-optimize-deps-stub",
    setup(build) {
      build.onResolve({ filter: /^iui-slot-warmup$/ }, () => ({
        path: WARMUP_MODULE_ID,
        namespace: "iui-slot-warmup-stub",
      }));
      build.onLoad({ filter: /.*/, namespace: "iui-slot-warmup-stub" }, () => ({
        contents: WARMUP_STUB_SOURCE,
        loader: "js",
      }));
    },
  };
}

/**
 * Rewrites asset-package slot hooks to minimal per-glyph import maps (only assets referenced
 * in the consumer app). Required for Framework runtime slots in `build` / `preview`.
 */
export function inventiveUiSlotAssetsPlugin(options = {}) {
  let projectRoot = process.cwd();
  let viteRoot = process.cwd();
  let usedAssets = new Map();
  let scanOptions = {};
  let catalogGlobFallback = Boolean(options.assetCatalog);
  /** Only rewrite to public /iui-assets URLs during production builds — dev uses Vite-relative imports. */
  let assetRuntimeExternal;

  const refreshUsedAssets = () => {
    usedAssets = scanUsedSlotAssets(viteRoot, scanOptions);
    projectRoot = findInventiveUiNodeModulesRoot(viteRoot);
  };

  const resolveAssetRuntimeExternal = (command) => {
    const externalOpt =
      typeof options.assetRuntimeExternal === "string"
        ? options.assetRuntimeExternal.trim()
        : "";
    return command === "build" && externalOpt ? externalOpt : undefined;
  };

  return {
    name: "inventive-ui-slot-assets",
    enforce: "pre",

    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [iuiSlotWarmupOptimizeDepsPlugin()],
          },
        },
      };
    },

    configResolved(config) {
      viteRoot = options.root ?? config.root ?? process.cwd();
      scanOptions = options.scan ?? {};
      catalogGlobFallback = Boolean(options.assetCatalog);
      assetRuntimeExternal = resolveAssetRuntimeExternal(config.command);
      refreshUsedAssets();
    },

    buildStart() {
      refreshUsedAssets();
    },

    resolveId(id) {
      if (id === WARMUP_MODULE_ID) {
        return VIRTUAL_WARMUP;
      }
      if (!id.startsWith("@inventive-ui/")) return null;
      return resolveAssetSubpath(projectRoot, id);
    },

    load(id) {
      if (id === VIRTUAL_WARMUP) {
        return getWarmupModuleSource(
          usedAssets,
          projectRoot,
          lookupKeyToModuleId,
          resolveAssetSubpath,
        );
      }
      return null;
    },

    transform(code, id) {
      if (!isTransformableAssetDist(id)) return null;
      const pkgFolder = packageFolderFromId(id);
      if (!pkgFolder) return null;

      const rewritten = transformAssetDistModule(code, pkgFolder, usedAssets, {
        catalogGlobFallback,
        assetRuntimeExternal,
      });
      if (!rewritten) return null;
      return { code: rewritten, map: null };
    },
  };
}
