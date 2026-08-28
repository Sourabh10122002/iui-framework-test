import { existsSync } from "fs";
import { join } from "path";
import { findInventiveUiNodeModulesRoot } from "./asset-packages.mjs";

/**
 * React 19 exposes CJS through index.js re-exports. When Rollup bundles a linked
 * ESM library (@inventive-ui/framework) that does `import { useMemo } from "react"`,
 * resolving to react/index.js fails static named-export analysis. Alias to direct CJS files.
 *
 * Resolves `react` / `react-dom` from the same hoisted install root as the rest of
 * inventivelyUiVite (npm/pnpm/yarn workspaces), not only `<viteRoot>/node_modules`.
 *
 * @param {string} projectRoot Vite project root (consumer app)
 * @param {"development" | "production"} mode
 */
export function createReactCjsAliases(projectRoot, mode) {
  const env = mode === "production" ? "production" : "development";
  const installRoot = findInventiveUiNodeModulesRoot(projectRoot);
  const nm = (pkg) => join(installRoot, "node_modules", pkg);

  const aliases = [
    {
      find: "react/jsx-dev-runtime",
      replacement: nm(`react/cjs/react-jsx-dev-runtime.${env}.js`),
    },
    {
      find: "react/jsx-runtime",
      replacement: nm(`react/cjs/react-jsx-runtime.${env}.js`),
    },
    {
      find: "react-dom/client",
      replacement: nm(`react-dom/cjs/react-dom-client.${env}.js`),
    },
    {
      find: "react-dom/test-utils",
      replacement: nm("react-dom/test-utils.js"),
    },
    {
      find: /^react-dom$/,
      replacement: nm(`react-dom/cjs/react-dom.${env}.js`),
    },
    { find: /^react$/, replacement: nm(`react/cjs/react.${env}.js`) },
    // react-dom CJS requires "scheduler" → index.js uses module.exports (breaks ESM chunks).
    {
      find: /^scheduler$/,
      replacement: nm(`scheduler/cjs/scheduler.${env}.js`),
    },
  ];

  return aliases.filter(({ replacement }) => existsSync(replacement));
}

/**
 * @param {{ root?: string }} [options]
 */
export function iuiReactCjsResolvePlugin(options = {}) {
  return {
    name: "iui-react-cjs-resolve",
    enforce: "pre",

    config(config, { command }) {
      const root = options.root ?? config.root ?? process.cwd();
      const mode = command === "build" ? "production" : "development";
      const aliases = createReactCjsAliases(root, mode);

      if (aliases.length === 0) {
        return undefined;
      }

      return {
        resolve: {
          dedupe: ["react", "react-dom"],
          alias: aliases,
        },
        build: {
          commonjsOptions: {
            transformMixedEsModules: true,
          },
        },
      };
    },
  };
}
