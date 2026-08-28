import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { iuiCjsEsmBridgePlugin } from "../cjs-esm-bridge.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("iuiCjsEsmBridgePlugin", () => {
  it("bridges cookie CJS to named ESM exports when cookie is installed", () => {
    // Prefer the docs monorepo hoist (has react-router → cookie); fall back to local.
    const docsRoot = join(__dirname, "../../../../IUI-Docs/apps/docs");
    const root = existsSync(join(docsRoot, "../../node_modules/cookie"))
      ? docsRoot
      : join(__dirname, "../../..");

    const cookiePkg = join(
      existsSync(join(docsRoot, "../../node_modules/cookie"))
        ? join(docsRoot, "../..")
        : root,
      "node_modules/cookie/dist/index.js",
    );
    if (!existsSync(cookiePkg)) {
      return;
    }

    const plugin = iuiCjsEsmBridgePlugin({ root: docsRoot });
    plugin.configResolved({ root: docsRoot });

    const resolved = plugin.resolveId("cookie");
    assert.equal(resolved, "\0iui-cjs-esm:cookie");

    const source = plugin.load(resolved);
    assert.match(source, /export const parse = __mod\.parse/);
    assert.match(source, /export const serialize = __mod\.serialize/);
    assert.match(source, /const __mod = \(\(\) => \{/);
  });

  it("ignores unrelated ids", () => {
    const plugin = iuiCjsEsmBridgePlugin({ root: process.cwd() });
    plugin.configResolved({ root: process.cwd() });
    assert.equal(plugin.resolveId("react"), null);
    assert.equal(plugin.load("\0other"), null);
  });
});
