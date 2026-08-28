import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/**
 * Resolve `jiti` from the framework package root.
 * Required for file:-linked monorepos where the consumer may not hoist `jiti`.
 *
 * @param {string} [callerUrl] - `import.meta.url` of the calling module (used as jiti parent).
 * @param {{ frameworkRoot?: string, purpose?: string }} [options]
 * @returns {import("jiti").JITI}
 */
export function loadJiti(callerUrl = import.meta.url, options = {}) {
  const frameworkRoot =
    options.frameworkRoot ??
    join(dirname(fileURLToPath(import.meta.url)), "../..");
  const purpose =
    options.purpose ?? "read TypeScript sources / iui.config at build time";

  const requireFromFramework = createRequire(
    join(frameworkRoot, "package.json"),
  );

  let createJiti;
  try {
    createJiti = requireFromFramework("jiti").createJiti;
  } catch (cause) {
    throw new Error(
      `[IUI] Cannot load 'jiti' (needed to ${purpose}). ` +
        "Run `npm install` in the @inventive-ui/framework package " +
        "(linked via file:../Framework-updated or equivalent).",
      { cause },
    );
  }

  return createJiti(callerUrl, { interopDefault: true });
}

export default loadJiti;
