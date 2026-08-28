import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { scanUsedSlotAssets } from "../scan-used-slot-assets.mjs";

test("scanUsedSlotAssets resolves object flag.placeholder.code without throwing", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-scan-flag-"));
  try {
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "assets.config.json"),
      JSON.stringify({
        binding: "scanned",
        preload: "scanned",
        icon: { library: "material-symbols", preload: "scanned" },
        flag: {
          library: "flagpack",
          placeholder: { code: "IN" },
          fallback: "US",
        },
      }),
    );
    writeFileSync(
      join(root, "src", "Demo.tsx"),
      'export const demo = { prefix: { type: "flag" } };',
    );

    assert.doesNotThrow(() => {
      scanUsedSlotAssets(root, { scanDirs: ["src"], include: ["**/*.tsx"] });
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
