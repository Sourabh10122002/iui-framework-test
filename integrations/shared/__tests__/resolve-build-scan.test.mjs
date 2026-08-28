import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { resolveBuildScanOptions, readPackageCompileSafelist } from "../resolve-build-scan.mjs";
import { DEFAULT_SCAN_PACKAGES } from "../resolve-build-scan.mjs";

test("resolveBuildScanOptions merges config.build and plugin options", () => {
  const resolved = resolveBuildScanOptions(
    {
      build: {
        safelist: ["sr-only"],
        scanDirs: ["app"],
      },
    },
    {
      safelist: ["pointer-events-none"],
      scanPackages: ["@inventive-ui/components"],
    },
  );

  assert.deepEqual(resolved.scanDirs, ["app"]);
  assert.deepEqual(resolved.scanPackages, ["@inventive-ui/components"]);
  assert.ok(resolved.safelist.includes("sr-only"));
  assert.ok(resolved.safelist.includes("pointer-events-none"));
});

test("resolveBuildScanOptions uses defaults when config absent", () => {
  const resolved = resolveBuildScanOptions(null, {});
  assert.deepEqual(resolved.scanDirs, ["src", ".iui/generated"]);
  assert.deepEqual(resolved.scanPackages, DEFAULT_SCAN_PACKAGES);
});

test("readPackageCompileSafelist reads compile.safelist from iui-manifest.json", () => {
  const root = join(tmpdir(), `iui-scan-test-${Date.now()}`);
  const pkgDir = join(root, "node_modules", "@inventive-ui", "components");
  mkdirSync(pkgDir, { recursive: true });
  writeFileSync(
    join(pkgDir, "iui-manifest.json"),
    JSON.stringify({
      compile: { safelist: ["bg-brand-500", "hover:bg-brand-600"] },
    }),
  );

  const list = readPackageCompileSafelist(root, "@inventive-ui/components");
  assert.ok(list.includes("bg-brand-500"));
  assert.ok(list.includes("hover:bg-brand-600"));

  rmSync(root, { recursive: true, force: true });
});

test("readPackageCompileSafelist reads local iui-manifest when project is the package", () => {
  const root = join(tmpdir(), `iui-scan-local-${Date.now()}`);
  mkdirSync(root, { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "@inventive-ui/components" }),
  );
  writeFileSync(
    join(root, "iui-manifest.json"),
    JSON.stringify({
      compile: { safelist: ["bg-success-500", "text-brand-700"] },
    }),
  );

  const list = readPackageCompileSafelist(root, "@inventive-ui/components");
  assert.ok(list.includes("bg-success-500"));
  assert.ok(list.includes("text-brand-700"));

  rmSync(root, { recursive: true, force: true });
});

test("resolveBuildScanOptions does not merge package safelist by default", () => {
  const root = join(tmpdir(), `iui-scan-default-off-${Date.now()}`);
  const pkgDir = join(root, "node_modules", "@inventive-ui", "components");
  mkdirSync(pkgDir, { recursive: true });
  writeFileSync(
    join(pkgDir, "iui-manifest.json"),
    JSON.stringify({
      compile: { safelist: ["text-brand-700"] },
    }),
  );

  const resolved = resolveBuildScanOptions(
    { build: { safelist: ["sr-only"] } },
    {},
    root,
  );

  assert.ok(resolved.safelist.includes("sr-only"));
  assert.ok(!resolved.safelist.includes("text-brand-700"));

  rmSync(root, { recursive: true, force: true });
});

test("resolveBuildScanOptions merges package manifest safelist when packageSafelist is true", () => {
  const root = join(tmpdir(), `iui-scan-merge-${Date.now()}`);
  const pkgDir = join(root, "node_modules", "@inventive-ui", "components");
  mkdirSync(pkgDir, { recursive: true });
  writeFileSync(
    join(pkgDir, "iui-manifest.json"),
    JSON.stringify({
      compile: { safelist: ["text-brand-700"] },
    }),
  );

  const resolved = resolveBuildScanOptions(
    { build: { safelist: ["sr-only"], packageSafelist: true } },
    {},
    root,
  );

  assert.ok(resolved.safelist.includes("sr-only"));
  assert.ok(resolved.safelist.includes("text-brand-700"));

  rmSync(root, { recursive: true, force: true });
});

test("resolveBuildScanOptions skips package manifest safelist when packageSafelist is false", () => {
  const root = join(tmpdir(), `iui-scan-no-pkg-${Date.now()}`);
  const pkgDir = join(root, "node_modules", "@inventive-ui", "components");
  mkdirSync(pkgDir, { recursive: true });
  writeFileSync(
    join(pkgDir, "iui-manifest.json"),
    JSON.stringify({
      compile: { safelist: ["text-brand-700"] },
    }),
  );

  const resolved = resolveBuildScanOptions(
    { build: { safelist: ["sr-only"], packageSafelist: false } },
    {},
    root,
  );

  assert.ok(resolved.safelist.includes("sr-only"));
  assert.ok(!resolved.safelist.includes("text-brand-700"));

  rmSync(root, { recursive: true, force: true });
});
