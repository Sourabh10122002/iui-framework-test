import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import loadJiti from "./load-jiti.mjs";

const IUI_CONFIG_CANDIDATES = ["iui.config.ts", "iui.config.js", "iui.config.mjs"];

/**
 * Read assets.config.json from project root.
 * @param {string} projectRoot
 */
export function readAssetsConfigJson(projectRoot) {
  const configPath = join(projectRoot, "assets.config.json");
  if (!existsSync(configPath)) return undefined;
  try {
    return JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    return undefined;
  }
}

/**
 * Load iui.config.* default export (IUIThemeConfig).
 * @param {string} projectRoot
 */
export function loadIuiThemeConfig(projectRoot) {
  for (const file of IUI_CONFIG_CANDIDATES) {
    const configPath = join(projectRoot, file);
    if (!existsSync(configPath)) continue;
    const jiti = loadJiti(import.meta.url, {
      purpose: "load iui.config for runtime merge",
    });
    const mod = jiti(pathToFileURL(configPath).href);
    return mod?.default ?? mod ?? {};
  }
  return {};
}

/**
 * Merge iui theme config + assets.config.json → runtime IUIConfig shape.
 * @param {string} [projectRoot]
 */
export function loadProjectConfig(projectRoot = process.cwd()) {
  const themeConfig = loadIuiThemeConfig(projectRoot) ?? {};
  const assets = readAssetsConfigJson(projectRoot);
  if (assets === undefined) {
    return themeConfig;
  }
  return { ...themeConfig, assets };
}

export default loadProjectConfig;
