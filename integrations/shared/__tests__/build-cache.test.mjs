import test from "node:test";
import assert from "node:assert/strict";
import {
  isCompleteBuildClassCache,
  readBuildClassCache,
  writeBuildClassCache,
} from "../build-cache.mjs";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

test("incomplete or empty caches are not treated as warm", () => {
  assert.equal(isCompleteBuildClassCache(null), false);
  assert.equal(isCompleteBuildClassCache({ version: 1, files: {} }), false);
  assert.equal(
    isCompleteBuildClassCache({
      version: 1,
      complete: false,
      files: { "src/a.tsx": ["flex"] },
    }),
    false,
  );
  assert.equal(
    isCompleteBuildClassCache({
      version: 1,
      complete: true,
      files: { "src/a.tsx": ["flex"] },
    }),
    true,
  );
});

test("write/read round-trip preserves complete flag", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-cache-"));
  try {
    writeBuildClassCache(root, {
      version: 1,
      complete: true,
      files: { "src/App.tsx": ["flex", "gap-4"] },
    });
    const warm = readBuildClassCache(root);
    assert.equal(warm.complete, true);
    assert.equal(isCompleteBuildClassCache(warm), true);
    assert.deepEqual(warm.files["src/App.tsx"], ["flex", "gap-4"]);

    writeBuildClassCache(root, {
      version: 1,
      complete: false,
      files: { "src/App.tsx": ["flex"] },
    });
    const cold = readBuildClassCache(root);
    assert.equal(cold.complete, false);
    assert.equal(isCompleteBuildClassCache(cold), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
