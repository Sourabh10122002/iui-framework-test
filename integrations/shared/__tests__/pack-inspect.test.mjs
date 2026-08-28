/**
 * Stage G — pack contents must not ship migration/oracle/test paths;
 * required shade/server/node artifacts must be present.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync } from "fs";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frameworkRoot = join(__dirname, "../../..");
const useShell = process.platform === "win32";

test("npm pack includes shade/server exports and excludes migration artifacts", () => {
  const packDir = mkdtempSync(join(tmpdir(), "iui-pack-inspect-"));
  try {
    const pack = spawnSync("npm", ["pack", "--pack-destination", packDir, "--dry-run", "--json"], {
      cwd: frameworkRoot,
      encoding: "utf8",
      shell: useShell,
    });
    // Prefer real pack listing for path accuracy.
    const real = spawnSync("npm", ["pack", "--pack-destination", packDir], {
      cwd: frameworkRoot,
      encoding: "utf8",
      shell: useShell,
    });
    assert.equal(real.status, 0, real.stderr || real.stdout);
    const tarball = readdirSync(packDir).find((f) => f.endsWith(".tgz"));
    assert.ok(tarball, "expected a packed tarball");

    const listing = spawnSync("tar", ["-tzf", join(packDir, tarball)], {
      encoding: "utf8",
      shell: useShell,
    });
    assert.equal(listing.status, 0, listing.stderr);
    const files = listing.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const mustInclude = [
      "package/dist/shade.esm.js",
      "package/dist/shade.cjs",
      "package/dist/shade.d.ts",
      "package/dist/index.esm.js",
      "package/dist/server/index.esm.js",
      "package/dist/node/build-css-api.cjs",
      "package/dist/node/build-css-api.mjs",
    ];
    for (const path of mustInclude) {
      assert.ok(files.includes(path), `pack missing ${path}`);
    }

    const bannedSubstrings = [
      "migration-tools/",
      "shade/migration/",
      "legacy-oracle/",
      "/__tests__/",
      "/__fixtures__/",
      "Design-System/",
      "golden-divergence",
      "intentional-deviation-allowlist",
    ];
    for (const banned of bannedSubstrings) {
      const hit = files.find((f) => f.includes(banned));
      assert.equal(hit, undefined, `pack unexpectedly contains ${banned} (${hit})`);
    }

    // dry-run json should parse when available (best-effort)
    if (pack.status === 0 && pack.stdout.trim().startsWith("[")) {
      assert.ok(JSON.parse(pack.stdout).length >= 1);
    }
  } finally {
    rmSync(packDir, { recursive: true, force: true });
  }
});
