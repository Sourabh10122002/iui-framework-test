
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
const { IUIBuildCSSWebpackPlugin } = require("../webpack/iui-css.cjs");
const { writeNextBootstrapShim } = require("./create-bootstrap.mjs");

const VIRTUAL_ID = "iui-bootstrap";

export default function withIUI(
  nextConfig: NextConfig = {}
): NextConfig {
  console.log("[IUI Next] Plugin initialized");

  const userWebpack = nextConfig.webpack;

  return {
    ...nextConfig,

    webpack(config, ctx) {
      const root = ctx.dir || process.cwd();
      const isServer = ctx.isServer;

      const bootstrapFile = writeNextBootstrapShim(root, { isServer });

      config.resolve ??= {};
      config.resolve.alias ??= {};
      config.resolve.alias[VIRTUAL_ID] = bootstrapFile;

      config.plugins ??= [];
      config.plugins.push(
        new IUIBuildCSSWebpackPlugin({
          root,
          configPath: resolveConfig(root) ?? undefined,
          integration: "next",
          emitStaticAsset: !isServer,
          emitPublicCss: true,
        }),
      );

      config.watchOptions ??= {};
      const ignored = config.watchOptions.ignored;
      const iuiIgnore = /[\\/]\.iui[\\/]cache[\\/]/;
      if (Array.isArray(ignored)) {
        if (!ignored.some((p) => String(p).includes(".iui"))) {
          ignored.push(iuiIgnore);
        }
      } else if (!ignored) {
        config.watchOptions.ignored = ["**/node_modules/**", iuiIgnore];
      }

      if (typeof userWebpack === "function") {
        return userWebpack(config, ctx);
      }
      return config;
    },
  };
}

function resolveConfig(root: string) {
  for (const f of [
    "iui.config.ts",
    "iui.config.js",
    "iui.config.mjs",
  ]) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// IUIRegistry + IUIBox are in ./iui-registry.tsx but NOT re-exported here
// so next.config can load this file without needing to resolve .tsx (Node MODULE_NOT_FOUND).
// App layout should use:
//   import "@inventive-ui/framework/next/bootstrap" (server + client)
//   import { IUIRegistry } from "@inventive-ui/framework/next/registry"
//   import { IUIProvider } from "@inventive-ui/framework"
