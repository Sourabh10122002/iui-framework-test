import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "module";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parsesAsEngineUtility } from "../engine-parse-check.mjs";
import { tryLoadBuiltBuildCssApi } from "../load-build-css-api.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frameworkRoot = join(__dirname, "../../..");
const builtCjs = join(frameworkRoot, "dist/node/build-css-api.cjs");
const requireFromHere = createRequire(import.meta.url);

test("tryLoadBuiltBuildCssApi returns the prebuilt CJS API", () => {
  assert.ok(
    existsSync(builtCjs),
    "run npm run build:node before this test (dist/node/build-css-api.cjs missing)",
  );
  const viaHelper = tryLoadBuiltBuildCssApi();
  const viaRequire = requireFromHere(builtCjs);
  assert.ok(viaHelper);
  assert.equal(typeof viaHelper.generateThemeInitScript, "function");
  assert.equal(typeof viaHelper.parseUtilityClass, "function");
  assert.equal(typeof viaHelper.UtilityCache, "function");
  assert.equal(typeof viaHelper.generateBuildCSS, "function");
  assert.equal(
    viaHelper.generateThemeInitScript,
    viaRequire.generateThemeInitScript,
  );
});

test("dist/node/build-css-api theme-init + parser APIs work", () => {
  const api = tryLoadBuiltBuildCssApi();
  assert.ok(api);

  const script = api.generateThemeInitScript({
    theme: { mode: { default: "light", allowSystem: false } },
  });
  assert.match(script, /dataset\.iuiThemeInit="1"/);

  const cache = new api.UtilityCache();
  assert.ok(api.parseUtilityClass("flex", { cache }) != null);
  assert.equal(api.parseUtilityClass("not-a-real-utility-zzz", { cache }), null);
});

test("parsesAsEngineUtility works via dist (or src fallback)", () => {
  assert.equal(parsesAsEngineUtility("flex"), true);
  assert.equal(parsesAsEngineUtility("bg-brand-500"), true);
  assert.equal(parsesAsEngineUtility("not-a-real-utility-zzz"), false);
});
