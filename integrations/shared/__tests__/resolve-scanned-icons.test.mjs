import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { readMergedGlobalIcons } from "../resolve-scanned-icon-name.mjs";

test("readMergedGlobalIcons reads assets.config.json only", () => {
  const root = join(tmpdir(), `iui-icons-${Date.now()}`);
  mkdirSync(root, { recursive: true });
  try {
    writeFileSync(
      join(root, "assets.config.json"),
      JSON.stringify({
        icon: { globalIcons: { check: "done", menu: "menu" } },
      }),
    );
    const merged = readMergedGlobalIcons(root);
    assert.equal(merged.check, "done");
    assert.equal(merged.menu, "menu");
    assert.equal(merged.launch, undefined);
    assert.equal(merged.placeholder, undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("readMergedGlobalIcons returns empty map when assets.config.json is missing", () => {
  const root = join(tmpdir(), `iui-icons-empty-${Date.now()}`);
  mkdirSync(root, { recursive: true });
  try {
    assert.deepEqual(readMergedGlobalIcons(root), {});
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
