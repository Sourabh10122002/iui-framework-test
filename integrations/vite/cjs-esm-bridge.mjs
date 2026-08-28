import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { findInventiveUiNodeModulesRoot } from "./asset-packages.mjs";

/**
 * Packages whose CJS named exports Rollup fails to analyze in large app graphs
 * (notably react-router → cookie). Provide an ESM bridge so inventivelyUiVite
 * consumers do not need per-app shims.
 *
 * @see https://rollupjs.org/troubleshooting/#error-name-is-not-exported-by-module
 */
const CJS_ESM_BRIDGES = {
  cookie: {
    subpath: join("cookie", "dist", "index.js"),
    named: [
      "parse",
      "serialize",
      "parseCookie",
      "stringifyCookie",
      "parseSetCookie",
      "stringifySetCookie",
    ],
  },
};

/**
 * @param {{ root?: string }} [options]
 */
export function iuiCjsEsmBridgePlugin(options = {}) {
  let installRoot = process.cwd();
  const virtualPrefix = "\0iui-cjs-esm:";

  return {
    name: "iui-cjs-esm-bridge",
    enforce: "pre",

    configResolved(config) {
      const viteRoot = options.root ?? config.root ?? process.cwd();
      installRoot = findInventiveUiNodeModulesRoot(viteRoot);
    },

    resolveId(id) {
      if (!Object.prototype.hasOwnProperty.call(CJS_ESM_BRIDGES, id)) {
        return null;
      }
      const file = join(installRoot, "node_modules", CJS_ESM_BRIDGES[id].subpath);
      if (!existsSync(file)) return null;
      return virtualPrefix + id;
    },

    load(id) {
      if (!id.startsWith(virtualPrefix)) return null;
      const pkg = id.slice(virtualPrefix.length);
      const bridge = CJS_ESM_BRIDGES[pkg];
      if (!bridge) return null;

      const file = join(installRoot, "node_modules", bridge.subpath);
      const cjs = readFileSync(file, "utf8").replace(/^"use strict";\s*/, "");
      const named = bridge.named
        .map((name) => `export const ${name} = __mod.${name};`)
        .join("\n");

      // Isolate CJS bindings (function decls like parseCookie) from ESM export names.
      return `
const __mod = (() => {
  const exports = {};
  const module = { exports };
  ${cjs}
  return module.exports;
})();
${named}
export default __mod;
`;
    },
  };
}
