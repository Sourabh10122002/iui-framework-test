import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  collectScanRoots,
  resolveInstalledPackageDir,
} from "../scan-source-utils.mjs";

test("resolveInstalledPackageDir finds hoisted workspace packages", () => {
  const workspace = join(tmpdir(), `iui-hoist-${Date.now()}`);
  const app = join(workspace, "apps", "docs");
  const pkgDist = join(
    workspace,
    "node_modules",
    "@inventive-ui",
    "components",
    "dist",
  );
  mkdirSync(app, { recursive: true });
  mkdirSync(pkgDist, { recursive: true });
  writeFileSync(join(pkgDist, "index.js"), "export {};");

  const pkgDir = resolveInstalledPackageDir(app, "@inventive-ui/components");
  assert.equal(
    pkgDir,
    join(workspace, "node_modules", "@inventive-ui", "components"),
  );

  const roots = collectScanRoots(app, {
    scanDirs: ["src"],
    scanPackages: ["@inventive-ui/components"],
  });
  assert.ok(roots.includes(pkgDist));

  rmSync(workspace, { recursive: true, force: true });
});
