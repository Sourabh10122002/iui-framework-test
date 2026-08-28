/**
 * Authoritative utility validation via the engine parser (compile-first scan gate).
 * Prefers dist/node/build-css-api (published packages); falls back to jiti + src.
 */
import { join } from "path";
import { loadJiti } from "./load-jiti.mjs";
import {
  frameworkRoot,
  tryLoadBuiltBuildCssApi,
} from "./load-build-css-api.mjs";

/** @type {((className: string, context: { cache: { get: (k: string) => unknown; set: (k: string, v: unknown) => void } }) => unknown) | null} */
let parseUtilityClass = null;
/** @type {{ cache: { get: (k: string) => unknown; set: (k: string, v: unknown) => void } } | null} */
let parserContext = null;
/** @type {Map<string, boolean>} */
const resultCache = new Map();

function ensureEngineParse() {
  if (parseUtilityClass && parserContext) return;

  const built = tryLoadBuiltBuildCssApi();
  if (built) {
    parseUtilityClass = built.parseUtilityClass;
    parserContext = { cache: new built.UtilityCache() };
    return;
  }

  const jiti = loadJiti(import.meta.url, {
    frameworkRoot,
    purpose: "validate scanned utility tokens",
  });
  const parserMod = jiti(join(frameworkRoot, "src/engine/core/parser.ts"));
  const cacheMod = jiti(join(frameworkRoot, "src/engine/core/cache.ts"));
  parseUtilityClass = parserMod.parseUtilityClass;
  parserContext = { cache: new cacheMod.UtilityCache() };
}

/**
 * @param {string} token Full utility token including variants (e.g. dark:hover:bg-red-500).
 * @returns {boolean}
 */
export function parsesAsEngineUtility(token) {
  if (!token) return false;
  const memo = resultCache.get(token);
  if (memo !== undefined) return memo;

  ensureEngineParse();
  const ok = parseUtilityClass(token, parserContext) != null;
  resultCache.set(token, ok);
  return ok;
}
