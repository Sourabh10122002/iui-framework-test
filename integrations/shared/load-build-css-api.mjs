/**
 * Prefer prebuilt Node compile API (published packages without `src/`).
 * Returns null when dist is missing so callers can jiti-fall back for monorepo.
 */
import { createHash } from "crypto";
import { createRequire } from "module";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const frameworkRoot = join(__dirname, "../..");
const builtCjsPath = join(frameworkRoot, "dist/node/build-css-api.cjs");
const requireFromHere = createRequire(import.meta.url);

/**
 * Short hash of the prebuilt compile API — invalidates warm CSS cache when
 * `npm run build:node` changes optimizer output without a compiler version bump.
 * @returns {string}
 */
export function getFrameworkEngineFingerprint() {
  if (!existsSync(builtCjsPath)) return "src";
  return createHash("sha256")
    .update(readFileSync(builtCjsPath))
    .digest("hex")
    .slice(0, 12);
}

/**
 * @returns {Record<string, unknown> | null}
 */
export function tryLoadBuiltBuildCssApi() {
  if (!existsSync(builtCjsPath)) return null;
  return requireFromHere(builtCjsPath);
}
