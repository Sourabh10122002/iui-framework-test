/**
 * Load the single Framework shade authority for Node-only compile scanning.
 * Published packages use the built CJS entry; source checkouts fall back to
 * jiti so scanner tests do not require a preceding build.
 */
import { createRequire } from "module";
import { existsSync } from "fs";
import { join } from "path";
import { frameworkRoot } from "./load-build-css-api.mjs";
import { loadJiti } from "./load-jiti.mjs";

const requireFromHere = createRequire(import.meta.url);

export function loadShadeApi() {
  const sourceEntry = join(frameworkRoot, "src", "shade.ts");
  if (existsSync(sourceEntry)) {
    const jiti = loadJiti(import.meta.url, {
      frameworkRoot,
      purpose: "evaluate static shade requests during compile scanning",
    });
    return jiti(sourceEntry);
  }

  const builtCjs = join(frameworkRoot, "dist", "shade.cjs");
  if (existsSync(builtCjs)) return requireFromHere(builtCjs);

  throw new Error(
    "[IUI shade scan] Missing dist/shade.cjs. Reinstall or rebuild @inventive-ui/framework.",
  );
}
