import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { writeBuildCssFiles } from "../write-build-css.mjs";
import { iuiCacheFile } from "../iui-paths.mjs";

const payload = {
  combinedCSS: "/* iui test */\n.flex { display: flex; }\n",
  manifest: {
    mode: "compile",
    version: 1,
    cssHash: "abc123",
    classCount: 1,
  },
};

test("writeBuildCssFiles(vite) writes styles + manifest only", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-css-vite-"));
  try {
    writeBuildCssFiles(root, payload, { integration: "vite" });

    assert.ok(existsSync(iuiCacheFile(root, "styles")));
    assert.ok(existsSync(iuiCacheFile(root, "manifest")));
    assert.equal(existsSync(iuiCacheFile(root, "stylesInject")), false);
    assert.equal(existsSync(iuiCacheFile(root, "stylesInline")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writeBuildCssFiles(webpack) writes inject adapter", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-css-webpack-"));
  try {
    writeBuildCssFiles(root, payload, { integration: "webpack" });

    assert.ok(existsSync(iuiCacheFile(root, "stylesInject")));
    assert.equal(existsSync(iuiCacheFile(root, "stylesInline")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writeBuildCssFiles(next) writes inline adapter", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-css-next-"));
  try {
    writeBuildCssFiles(root, payload, { integration: "next" });

    assert.ok(existsSync(iuiCacheFile(root, "stylesInline")));
    assert.equal(existsSync(iuiCacheFile(root, "stylesInject")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writeBuildCssFiles prunes stale adapter files on integration switch", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-css-prune-"));
  try {
    writeBuildCssFiles(root, payload, { integration: "webpack" });
    assert.ok(existsSync(iuiCacheFile(root, "stylesInject")));

    writeBuildCssFiles(root, payload, { integration: "vite" });
    assert.equal(existsSync(iuiCacheFile(root, "stylesInject")), false);
    assert.ok(existsSync(iuiCacheFile(root, "styles")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
