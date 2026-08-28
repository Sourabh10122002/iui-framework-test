import { existsSync } from "fs";
import { join, resolve } from "path";
import {
  inventiveUiAssetSubpathResolver,
  resolveAssetSubpath,
  isInventiveUiAssetGlyphImport,
  IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE,
  findInventiveUiNodeModulesRoot,
} from "./asset-packages.mjs";
import { inventiveUiSlotAssetsPlugin } from "./slot-assets.mjs";
import { iuiBuildCSSPlugin } from "./iui-css.mjs";
import { iuiReactCjsResolvePlugin } from "./react-cjs-resolve.mjs";
import { iuiCjsEsmBridgePlugin } from "./cjs-esm-bridge.mjs";
import {
  resolveBootstrapBridge,
  buildLegacyBootstrapShimSource,
} from "../shared/bootstrap-bridge.mjs";

const IUI_SCOPE = "@inventive-ui/";
const CORE_PKGS = new Set([
  "@inventive-ui/framework",
  "@inventive-ui/components",
]);

function isCorePkgImport(id) {
  for (const pkg of CORE_PKGS) {
    if (id === pkg || id.startsWith(pkg + "/")) return true;
  }
  return false;
}

/**
 * Core IUI Vite plugin:
 * 1. Resolves deprecated `iui-bootstrap` → generated bootstrap bridge (registerBootstrapState)
 * 2. Handles optional @inventive-ui/* asset packages gracefully (stubs when not installed)
 */
export function iuiPlugin(options = {}) {
  let configPath = null;
  let projectRoot = process.cwd();

  return {
    name: "iui-vite-plugin",
    enforce: "pre",

    config() {
      return {
        resolve: {
          // One module graph for initConfig / slot registry (components + app).
          dedupe: ["@inventive-ui/framework", "react", "react-dom"],
        },
        optimizeDeps: {
          // Stateful singleton — must not be inlined into other prebundles
          // (e.g. @inventive-ui/components), or SlotRenderer sees an uninitialized config.
          exclude: ["@inventive-ui/framework"],
        },
      };
    },

    configResolved(config) {
      const viteRoot = options.root ?? config.root ?? process.cwd();
      projectRoot = findInventiveUiNodeModulesRoot(viteRoot);

      if (options.configPath) {
        const custom = join(projectRoot, options.configPath);
        if (existsSync(custom)) {
          configPath = custom;
        }
      } else {
        const candidates = [
          join(projectRoot, "iui.config.ts"),
          join(projectRoot, "iui.config.js"),
          join(projectRoot, "iui.config.mjs"),
        ];
        for (const p of candidates) {
          if (existsSync(p)) {
            configPath = p;
            break;
          }
        }
      }
    },

    async resolveId(id, _importer, opts) {
      if (id === "iui-bootstrap") {
        const bridge = resolveBootstrapBridge(projectRoot);
        if (bridge) return bridge;
        return "\0iui-bootstrap-compat";
      }

      if (id.startsWith(IUI_SCOPE) && !isCorePkgImport(id)) {
        const assetFile = resolveAssetSubpath(projectRoot, id);
        if (assetFile) return assetFile;

        // Missing glyphs must not stub to `{}` — that crashes Framework IconComponent.
        if (isInventiveUiAssetGlyphImport(id)) {
          return null;
        }

        const resolved = await this.resolve(id, resolve(projectRoot, "package.json"), {
          ...opts,
          skipSelf: true,
        });
        if (resolved && !resolved.external) return resolved;
        return `\0iui-empty:${id}`;
      }
    },

    load(id) {
      if (id === "\0iui-bootstrap-compat") {
        return buildLegacyBootstrapShimSource(projectRoot, configPath);
      }

      if (id.startsWith("\0iui-empty:")) {
        return "export default {};";
      }
    },

    // iui.config HMR: CSS-only invalidation via iuiBuildCSSPlugin (no full page reload).
  };
}

export {
  inventiveUiAssetSubpathResolver,
  resolveAssetSubpath,
  IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE,
};
export { inventiveUiSlotAssetsPlugin };
export { iuiBuildCSSPlugin } from "./iui-css.mjs";
export {
  scanUsedClasses,
  extractClassesFromSource,
} from "../shared/scan-used-classes.mjs";
export { generateBuildCSSForProject } from "../shared/generate-build-css.mjs";
export {
  scanUsedSlotAssets,
  lookupKeyToModuleId,
} from "./scan-used-slot-assets.mjs";

/**
 * Official Inventive UI Vite integration.
 *
 * - Static subpath imports (`@inventive-ui/icons-lucide/heart`) work without extra config.
 * - Runtime Framework slots (`<Icon name="heart" />`, asset slots) require this in production.
 *
 * @example
 * plugins: [inventiveUiVite(), react()]
 */
export function inventiveUiVite(options = {}) {
  return [
    iuiReactCjsResolvePlugin(options),
    iuiCjsEsmBridgePlugin(options),
    iuiPlugin(options),
    iuiBuildCSSPlugin(options),
    inventiveUiAssetSubpathResolver(options),
    inventiveUiSlotAssetsPlugin(options),
  ];
}

export default inventiveUiVite;
