import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadJiti } from "./load-jiti.mjs";
import {
  frameworkRoot,
  tryLoadBuiltBuildCssApi,
} from "./load-build-css-api.mjs";

/**
 * Prefer prebuilt Node API (published packages without `src/`).
 * Fall back to jiti + TypeScript sources for monorepo before `build:node`.
 */
function loadThemeInitApi() {
  const built = tryLoadBuiltBuildCssApi();
  if (built) return built;

  const jiti = loadJiti(import.meta.url, {
    frameworkRoot,
    purpose: "generate the theme init script",
  });
  return jiti(join(frameworkRoot, "src/server/generate-theme-init-script.ts"));
}

const {
  generateThemeInitScript,
  hashThemeInitScript,
  injectThemeInitScriptIntoHtml,
} = loadThemeInitApi();

/**
 * @param {Record<string, unknown> | null | undefined} config
 */
export function generateThemeInitScriptFromConfig(config) {
  return generateThemeInitScript(config ?? undefined);
}

export { generateThemeInitScript, hashThemeInitScript, injectThemeInitScriptIntoHtml };
