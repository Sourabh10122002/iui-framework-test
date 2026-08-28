import { existsSync } from "fs";
import { join, resolve } from "path";
import type { Plugin } from "vite";
import {
  inventiveUiAssetSubpathResolver,
  resolveAssetSubpath,
  IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE,
} from "./asset-packages.mjs";
import { inventiveUiSlotAssetsPlugin } from "./slot-assets.mjs";
import { iuiBuildCSSPlugin } from "./iui-css.mjs";
import { iuiReactCjsResolvePlugin } from "./react-cjs-resolve.mjs";
import { iuiCjsEsmBridgePlugin } from "./cjs-esm-bridge.mjs";
import {
  resolveBootstrapBridge,
  buildLegacyBootstrapShimSource,
} from "../shared/bootstrap-bridge.mjs";

export interface IUIViteOptions {
  configPath?: string;
  root?: string;
  writeFiles?: boolean;
  scan?: Record<string, unknown>;
}

const IUI_SCOPE = "@inventive-ui/";
const CORE_PKGS = new Set([
  "@inventive-ui/framework",
  "@inventive-ui/components",
]);

function isCorePkgImport(id: string): boolean {
  for (const pkg of CORE_PKGS) {
    if (id === pkg || id.startsWith(pkg + "/")) return true;
  }
  return false;
}

/**
 * Core IUI Vite plugin — config bootstrap + optional package stubs.
 */
export function iuiPlugin(options: IUIViteOptions = {}): Plugin {
  let configPath: string | null = null;
  let projectRoot = process.cwd();

  return {
    name: "iui-vite-plugin",
    enforce: "pre",

    config() {
      return {
        resolve: {
          dedupe: ["@inventive-ui/framework", "react", "react-dom"],
        },
        optimizeDeps: {
          exclude: ["@inventive-ui/framework"],
        },
      };
    },

    configResolved(config) {
      projectRoot = options.root ?? config.root ?? process.cwd();

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
        const resolved = await this.resolve(
          id,
          resolve(projectRoot, "package.json"),
          { ...opts, skipSelf: true },
        );
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

    handleHotUpdate({ file, server }) {
      if (configPath && file === configPath) {
        server.ws.send({ type: "full-reload" });
      }
    },
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

/**
 * Official Inventive UI Vite integration (config + compile CSS + static subpaths + runtime slots).
 */
export function inventiveUiVite(options: IUIViteOptions = {}) {
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
