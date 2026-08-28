#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";
import {
  buildThemeScaffoldConfig,
  frameworkScriptsDirFromMeta,
  loadFrameworkThemeDefaults,
} from "./load-framework-theme-defaults.mjs";
import { IUI_DIR, IUI_CACHE_SEGMENT } from "../integrations/shared/iui-paths.mjs";

const scriptsDir = frameworkScriptsDirFromMeta(import.meta.url);
const themeDefaults = loadFrameworkThemeDefaults(scriptsDir);

function buildIuiConfigTemplate() {
  return buildThemeScaffoldConfig(themeDefaults, { configType: "IUIConfig" });
}

const args = process.argv.slice(2);
const command = args[0];
const scaffoldVite =
  args.includes("--vite") ||
    args.includes("vite") ||
    args.includes("--react-vite") ||
    args.includes("react-vite") ||
    command === "init" ||
    command === "init-vite";

if (command && command !== "init" && command !== "init-vite" && !scaffoldVite) {
  console.log(`
Inventive UI — framework config scaffold (iui-init)

  The product CLI command \`iui\` is owned by inventive-ui
  (doctor, update, install, assets, …). This package only ships iui-init.

  npx iui-init          Create iui.config.ts
  npx iui-init --vite   Also scaffold vite.config.ts (compile-first)
  npx inventive-ui init   Full project init via the official CLI
`);
  process.exit(command === "help" || command === "--help" ? 0 : 1);
}

const VITE_CONFIG_TEMPLATE = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {
  inventiveUiVite,
  IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE,
} from "@inventive-ui/framework/vite";

// inventiveUiVite injects theme + compile-first CSS into <head> (zero-FOUC).
// Do not import style-map .generated files into the browser — scan them via Framework defaults (src, .iui).
export default defineConfig({
  plugins: [...inventiveUiVite({ root: import.meta.dirname }), react()],
  resolve: {
    dedupe: ["@inventive-ui/framework", "react", "react-dom"],
  },
  optimizeDeps: {
    exclude: [...IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE],
  },
});
`;

const GITIGNORE_LINES = [
  "",
  "# IUI disposable cache (.iui/generated/ stays committed)",
  `${IUI_DIR}/${IUI_CACHE_SEGMENT}/`,
  ".iui-bootstrap-client.js",
  ".iui-bootstrap-server.js",
  ".iui-bootstrap.js",
  "public/iui/",
];

const cwd = process.cwd();
const configTarget = join(cwd, "iui.config.ts");
const viteTarget = join(cwd, "vite.config.ts");
const gitignoreTarget = join(cwd, ".gitignore");

if (existsSync(configTarget)) {
  console.log("✔ iui.config.ts already exists — skipping.");
} else {
  writeFileSync(configTarget, buildIuiConfigTemplate(), "utf8");
  console.log("✔ iui.config.ts created (includes build.scanDirs / scanPackages).");
}

if (scaffoldVite) {
  if (existsSync(viteTarget)) {
    console.log("✔ vite.config.ts already exists — skipping.");
  } else {
    writeFileSync(viteTarget, VITE_CONFIG_TEMPLATE, "utf8");
    console.log("✔ vite.config.ts created with inventiveUiVite() plugin.");
  }
}

if (existsSync(gitignoreTarget)) {
  const existing = readFileSync(gitignoreTarget, "utf8");
  if (
    !existing.includes(".iui/cache/") &&
    !existing.includes("public/iui/")
  ) {
    appendFileSync(gitignoreTarget, GITIGNORE_LINES.join("\n") + "\n", "utf8");
    console.log("✔ .gitignore updated with IUI compile-first cache entries.");
  }
} else {
  writeFileSync(gitignoreTarget, GITIGNORE_LINES.slice(1).join("\n") + "\n", "utf8");
  console.log("✔ .gitignore created with IUI compile-first cache entries.");
}

console.log(`
Next steps:
  1. Wrap your app with <IUIProvider> from @inventive-ui/framework
  2. Import slots from @inventive-ui/framework/slots when needed
  3. No manual CSS imports — the plugin auto-injects compile-first styles
  4. Webpack: plugins: [...inventiveUiWebpack()]  |  Next: export default withIUI({ ... })
`);
