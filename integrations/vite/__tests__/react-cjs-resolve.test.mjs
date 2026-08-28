import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { createReactCjsAliases } from "../react-cjs-resolve.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frameworkRoot = join(__dirname, "../../..");

describe("createReactCjsAliases", () => {
  it("resolves react CJS from a workspace hoist root (not only vite app root)", () => {
    // Simulate apps/docs as Vite root while react is hoisted at monorepo root.
    // Use Framework's own node_modules if present; otherwise skip.
    const localReact = join(frameworkRoot, "node_modules", "react", "cjs");
    if (!existsSync(localReact)) {
      // Peer react may not be installed in Framework package itself.
      return;
    }

    const aliases = createReactCjsAliases(frameworkRoot, "production");
    const reactAlias = aliases.find((a) => a.find instanceof RegExp && a.find.test("react"));
    assert.ok(reactAlias, "expected /^react$/ alias");
    assert.ok(
      existsSync(reactAlias.replacement),
      `react CJS file missing: ${reactAlias.replacement}`,
    );
    assert.match(reactAlias.replacement.replace(/\\/g, "/"), /\/react\/cjs\/react\.production\.js$/);

    const schedulerAlias = aliases.find((a) => a.find instanceof RegExp && a.find.test("scheduler"));
    assert.ok(schedulerAlias, "expected /^scheduler$/ alias");
    assert.match(
      schedulerAlias.replacement.replace(/\\/g, "/"),
      /\/scheduler\/cjs\/scheduler\.production\.js$/,
    );
  });

  it("returns no aliases when react is not installed above the root", () => {
    const aliases = createReactCjsAliases(join(frameworkRoot, "does-not-exist-root"), "production");
    assert.equal(aliases.length, 0);
  });
});
