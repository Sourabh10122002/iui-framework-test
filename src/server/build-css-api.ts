/**
 * Node-only entry for compile-first CSS generation + Vite/Webpack helpers.
 * Bundled to dist/node/build-css-api.* so published packages do not need `src/`.
 */
export { generateBuildCSS } from "./ssr-extraction";
export {
  expandBuildClasses,
  collectFilePaletteSignals,
} from "./expand-build-classes";
export {
  generateThemeInitScript,
  hashThemeInitScript,
  injectThemeInitScriptIntoHtml,
} from "./generate-theme-init-script";
export { parseUtilityClass } from "../engine/core/parser";
export { UtilityCache } from "../engine/core/cache";
